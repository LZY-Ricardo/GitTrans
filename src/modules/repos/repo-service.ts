import { z } from "zod";

import { AppError } from "@/lib/errors";
import { createIgnoreMatcher, matchesAnyGlob, normalizePath } from "@/lib/paths";
import { prisma } from "@/lib/prisma";
import { getUserGitHubAccessToken } from "@/modules/auth/github-account-service";
import { MODEL_OPTIONS } from "@/modules/catalog/bootstrap";
import {
  getRepositoryByFullName,
  getRepositoryTree,
  listInstallationRepositories,
  listUserInstallations
} from "@/modules/github/github-service";
import { DEFAULT_MODEL_ID } from "@/modules/translation/model-routing";

const UpdateRepositoryConfigSchema = z.object({
  baseBranch: z.string().min(1),
  baseLanguage: z.string().min(1),
  targetLanguages: z.array(z.string().min(1)).min(1),
  includePaths: z.array(z.string().min(1)).min(1),
  ignoreRulesText: z.string(),
  modelId: z.string().min(1),
  readmeNavigationEnabled: z.boolean()
});

function getDefaultConfig(defaultBranch: string) {
  return {
    baseBranch: defaultBranch,
    baseLanguage: "zh-CN",
    targetLanguages: ["en"],
    includePaths: ["README.md", "docs/**"],
    ignoreRulesText: "",
    modelId: DEFAULT_MODEL_ID,
    outputRoot: "translations",
    readmeNavigationEnabled: true,
    usePlatformKey: true
  };
}

function isRecoverableGitHubAccessError(error: unknown) {
  return error instanceof AppError && [
    "GITHUB_RESOURCE_NOT_FOUND",
    "GITHUB_FORBIDDEN",
    "GITHUB_UNAUTHORIZED",
  ].includes(error.code);
}

export function shouldRetryRepositoryFilesWithDefaultBranch(options: {
  error: unknown;
  requestedRef: string;
  defaultBranch: string;
}) {
  return (
    options.error instanceof AppError &&
    options.error.code === "GITHUB_RESOURCE_NOT_FOUND" &&
    options.requestedRef !== options.defaultBranch
  );
}

async function upsertInstallationRecord(installation: {
  installationId: string;
  accountLogin: string;
  accountType: string;
  repositoriesCount: number | null;
}) {
  return prisma.gitHubAppInstallation.upsert({
    where: {
      installationId: installation.installationId,
    },
    create: {
      installationId: installation.installationId,
      accountLogin: installation.accountLogin,
      accountType: installation.accountType,
      repositoriesCount: installation.repositoriesCount,
    },
    update: {
      accountLogin: installation.accountLogin,
      accountType: installation.accountType,
      repositoriesCount: installation.repositoriesCount,
    },
  });
}

async function ensureRepositoryGitHubAccessForRecord(repo: Awaited<ReturnType<typeof getRepositoryForUser>>) {
  try {
    const repoMeta = await getRepositoryByFullName({
      installationId: repo.installation.installationId,
      owner: repo.owner,
      repo: repo.name,
    });

    if (repo.defaultBranch !== repoMeta.defaultBranch) {
      await prisma.repository.update({
        where: { id: repo.id },
        data: {
          defaultBranch: repoMeta.defaultBranch,
        },
      });
    }

    return {
      installationId: repo.installation.installationId,
      defaultBranch: repoMeta.defaultBranch,
      notice: null as string | null,
    };
  } catch (error) {
    if (!isRecoverableGitHubAccessError(error)) {
      throw error;
    }
  }

  const installations = await listAccessibleInstallationsForUser(repo.userId);

  for (const installation of installations) {
    if (installation.installationId === repo.installation.installationId) {
      continue;
    }

    try {
      const repoMeta = await getRepositoryByFullName({
        installationId: installation.installationId,
        owner: repo.owner,
        repo: repo.name,
      });
      const installationRecord = await upsertInstallationRecord(installation);

      await prisma.repository.update({
        where: { id: repo.id },
        data: {
          installationRefId: installationRecord.id,
          defaultBranch: repoMeta.defaultBranch,
        },
      });

      return {
        installationId: installation.installationId,
        defaultBranch: repoMeta.defaultBranch,
        notice: "已自动恢复 GitHub 安装绑定，请确认当前基准分支后再保存配置。",
      };
    } catch (error) {
      if (!isRecoverableGitHubAccessError(error)) {
        throw error;
      }
    }
  }

  throw new AppError(
    "REPOSITORY_ACCESS_LOST",
    409,
    "当前 GitHub 安装已无法访问该仓库，请检查 GitHub App 安装范围后重新导入仓库。",
  );
}

export async function ensureRepositoryGitHubAccess(repoId: string, userId: string) {
  const repo = await getRepositoryForUser(repoId, userId);
  return ensureRepositoryGitHubAccessForRecord(repo);
}

export async function listAccessibleInstallationsForUser(userId: string) {
  const userToken = await getUserGitHubAccessToken(userId);
  return listUserInstallations(userToken);
}

export async function listAccessibleRepositoriesForInstallation(options: {
  userId: string;
  installationId: string;
  page: number;
  pageSize: number;
  query?: string;
}) {
  const installations = await listAccessibleInstallationsForUser(options.userId);

  if (!installations.some((item) => item.installationId === options.installationId)) {
    throw new AppError("INSTALLATION_FORBIDDEN", 403, "当前用户无权访问该安装");
  }

  const result = await listInstallationRepositories({
    installationId: options.installationId,
    page: options.page,
    pageSize: options.pageSize,
    query: options.query
  });

  const existingRepos = await prisma.repository.findMany({
    where: {
      githubRepoId: {
        in: result.items.map((item) => item.githubRepoId)
      }
    },
    select: {
      githubRepoId: true
    }
  });

  const imported = new Set(existingRepos.map((item) => item.githubRepoId));

  return {
    items: result.items.map((item) => ({
      ...item,
      alreadyImported: imported.has(item.githubRepoId)
    })),
    total: result.total
  };
}

export async function importRepositoryForUser(options: {
  userId: string;
  installationId: string;
  owner: string;
  name: string;
}) {
  const installations = await listAccessibleInstallationsForUser(options.userId);
  const installation = installations.find(
    (item) => item.installationId === options.installationId
  );

  if (!installation) {
    throw new AppError("INSTALLATION_FORBIDDEN", 403, "当前用户无权导入该仓库");
  }

  const repoMeta = await getRepositoryByFullName({
    installationId: options.installationId,
    owner: options.owner,
    repo: options.name
  });

  if (repoMeta.private) {
    throw new AppError("PRIVATE_REPO_NOT_SUPPORTED", 400, "MVP 暂不支持私有仓库");
  }

  const installationRecord = await upsertInstallationRecord(installation);

  const defaults = getDefaultConfig(repoMeta.defaultBranch);

  const existingRepository = await prisma.repository.findUnique({
    where: {
      fullName: repoMeta.fullName
    }
  });

  if (existingRepository && existingRepository.userId !== options.userId) {
    throw new AppError(
      "REPOSITORY_ALREADY_IMPORTED",
      409,
      "该仓库已被其他账号导入，当前 MVP 暂不支持多账号共享同一仓库",
    );
  }

  return prisma.repository.upsert({
    where: {
      fullName: repoMeta.fullName
    },
    create: {
      userId: options.userId,
      installationRefId: installationRecord.id,
      owner: repoMeta.owner,
      name: repoMeta.name,
      fullName: repoMeta.fullName,
      githubRepoId: repoMeta.githubRepoId,
      defaultBranch: repoMeta.defaultBranch,
      baseBranch: defaults.baseBranch,
      baseLanguage: defaults.baseLanguage,
      translationBranch: `gittrans/${defaults.baseBranch}`,
      config: {
        create: {
          targetLanguagesJson: defaults.targetLanguages,
          includePathsJson: defaults.includePaths,
          ignoreRulesText: defaults.ignoreRulesText,
          modelId: defaults.modelId,
          outputRoot: defaults.outputRoot,
          readmeNavigationEnabled: defaults.readmeNavigationEnabled,
          usePlatformKey: defaults.usePlatformKey
        }
      },
      syncState: {
        create: {}
      }
    },
    update: {
      userId: options.userId,
      installationRefId: installationRecord.id,
      owner: repoMeta.owner,
      name: repoMeta.name,
      defaultBranch: repoMeta.defaultBranch
    },
    include: {
      config: true,
      syncState: true
    }
  });
}

export async function listRepositoriesForUser(userId: string) {
  const repos = await prisma.repository.findMany({
    where: { userId },
    include: {
      config: true,
      syncState: true,
      tasks: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      pullRequestState: true
    },
    orderBy: { updatedAt: "desc" }
  });

  return repos.map((repo) => ({
    id: repo.id,
    fullName: repo.fullName,
    defaultBranch: repo.defaultBranch,
    baseBranch: repo.baseBranch,
    baseLanguage: repo.baseLanguage,
    targetLanguages: (repo.config?.targetLanguagesJson as string[]) ?? [],
    status: repo.status,
    currentTask: repo.tasks[0]
      ? {
          id: repo.tasks[0].id,
          status: repo.tasks[0].status,
          type: repo.tasks[0].type
        }
      : null,
    currentPrUrl: repo.pullRequestState?.url ?? null,
    lastSyncedAt: repo.syncState?.lastSyncedAt ?? null
  }));
}

export async function getRepositoryForUser(repoId: string, userId: string) {
  const repo = await prisma.repository.findFirst({
    where: {
      id: repoId,
      userId
    },
    include: {
      config: true,
      syncState: true,
      tasks: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      pullRequestState: true,
      installation: true
    }
  });

  if (!repo) {
    throw new AppError("REPO_NOT_FOUND", 404, "仓库不存在");
  }

  return repo;
}

export async function getRepositorySummary(repoId: string, userId: string) {
  const repo = await getRepositoryForUser(repoId, userId);

  return {
    id: repo.id,
    fullName: repo.fullName,
    defaultBranch: repo.defaultBranch,
    baseBranch: repo.baseBranch,
    baseLanguage: repo.baseLanguage,
    targetLanguages: (repo.config?.targetLanguagesJson as string[]) ?? [],
    status: repo.status,
    translationBranch: repo.translationBranch,
    currentPr: repo.pullRequestState
      ? {
          number: repo.pullRequestState.number,
          url: repo.pullRequestState.url,
          state: repo.pullRequestState.state
        }
      : null,
    syncState: {
      lastSyncedSha: repo.syncState?.lastSyncedSha ?? null,
      lastSyncedAt: repo.syncState?.lastSyncedAt ?? null
    },
    latestTask: repo.tasks[0]
      ? {
          id: repo.tasks[0].id,
          type: repo.tasks[0].type,
          status: repo.tasks[0].status,
          createdAt: repo.tasks[0].createdAt
        }
      : null
  };
}

export async function getRepositoryConfig(repoId: string, userId: string) {
  const repo = await getRepositoryForUser(repoId, userId);
  const config = repo.config;

  if (!config) {
    throw new AppError("REPO_CONFIG_NOT_FOUND", 404, "仓库配置不存在");
  }

  return {
    repoId: repo.id,
    baseBranch: repo.baseBranch,
    baseLanguage: repo.baseLanguage,
    targetLanguages: config.targetLanguagesJson as string[],
    includePaths: config.includePathsJson as string[],
    ignoreRulesText: config.ignoreRulesText,
    modelId: config.modelId,
    outputRoot: config.outputRoot,
    readmeNavigationEnabled: config.readmeNavigationEnabled,
    usePlatformKey: config.usePlatformKey
  };
}

export async function updateRepositoryConfig(options: {
  repoId: string;
  userId: string;
  input: unknown;
}) {
  const input = UpdateRepositoryConfigSchema.parse(options.input);
  const repo = await getRepositoryForUser(options.repoId, options.userId);

  if (!MODEL_OPTIONS.some((model) => model.id === input.modelId)) {
    throw new AppError("MODEL_NOT_ALLOWED", 400, "当前模型不在允许列表中");
  }

  const updated = await prisma.repository.update({
    where: { id: repo.id },
    data: {
      baseBranch: input.baseBranch,
      baseLanguage: input.baseLanguage,
      translationBranch: `gittrans/${input.baseBranch}`,
      config: {
        update: {
          targetLanguagesJson: input.targetLanguages,
          includePathsJson: input.includePaths,
          ignoreRulesText: input.ignoreRulesText,
          modelId: input.modelId,
          readmeNavigationEnabled: input.readmeNavigationEnabled
        }
      }
    },
    include: {
      config: true
    }
  });

  return {
    saved: true,
    configVersion: updated.updatedAt.getTime()
  };
}

export async function getRepositoryFiles(repoId: string, userId: string, ref?: string) {
  const repo = await getRepositoryForUser(repoId, userId);
  const config = repo.config;

  if (!config) {
    throw new AppError("REPO_CONFIG_NOT_FOUND", 404, "仓库配置不存在");
  }

  const access = await ensureRepositoryGitHubAccessForRecord(repo);
  const requestedRef = ref ?? repo.baseBranch;
  let notice = access.notice;
  let tree;

  try {
    tree = await getRepositoryTree({
      installationId: access.installationId,
      owner: repo.owner,
      repo: repo.name,
      ref: requestedRef
    });
  } catch (error) {
    if (shouldRetryRepositoryFilesWithDefaultBranch({
      error,
      requestedRef,
      defaultBranch: access.defaultBranch,
    })) {
      tree = await getRepositoryTree({
        installationId: access.installationId,
        owner: repo.owner,
        repo: repo.name,
        ref: access.defaultBranch
      });
      notice = [notice, `基准分支 ${requestedRef} 不可用，当前已改用默认分支 ${access.defaultBranch} 预览文件。`]
        .filter(Boolean)
        .join(" ");
    } else {
      throw error;
    }
  }

  const includePatterns = config.includePathsJson as string[];
  const ignoreMatcher = createIgnoreMatcher(config.ignoreRulesText);

  const files = tree.filter((item) => item.type === "file");
  const items = files.map((item) => {
    const normalized = normalizePath(item.path);
    const translatable =
      normalized.toLowerCase().endsWith(".md") && !normalized.startsWith("translations/");
    const selected = translatable && matchesAnyGlob(normalized, includePatterns);
    const ignored = translatable && ignoreMatcher.ignores(normalized);

    return {
      path: normalized,
      type: "file" as const,
      translatable,
      selected,
      ignored,
      reason: ignored ? "matched_ignore_rule" : null
    };
  }).filter((item) => item.translatable);

  return {
    summary: {
      totalFiles: items.length,
      translatableFiles: items.filter((item) => item.translatable).length,
      ignoredFiles: items.filter((item) => item.ignored).length
    },
    items,
    notice,
  };
}
