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
    modelId: MODEL_OPTIONS[0].id,
    outputRoot: "translations",
    readmeNavigationEnabled: true,
    usePlatformKey: true
  };
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

  const installationRecord = await prisma.gitHubAppInstallation.upsert({
    where: {
      installationId: options.installationId
    },
    create: {
      installationId: options.installationId,
      accountLogin: installation.accountLogin,
      accountType: installation.accountType,
      repositoriesCount: installation.repositoriesCount
    },
    update: {
      accountLogin: installation.accountLogin,
      accountType: installation.accountType,
      repositoriesCount: installation.repositoriesCount
    }
  });

  const defaults = getDefaultConfig(repoMeta.defaultBranch);

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

  const tree = await getRepositoryTree({
    installationId: repo.installation.installationId,
    owner: repo.owner,
    repo: repo.name,
    ref: ref ?? repo.baseBranch
  });

  const includePatterns = config.includePathsJson as string[];
  const ignoreMatcher = createIgnoreMatcher(config.ignoreRulesText);

  const files = tree.filter((item) => item.type === "file");
  const items = files.map((item) => {
    const normalized = normalizePath(item.path);
    const selected = matchesAnyGlob(normalized, includePatterns);
    const ignored = ignoreMatcher.ignores(normalized);
    const translatable =
      normalized.toLowerCase().endsWith(".md") && !normalized.startsWith("translations/");

    return {
      path: normalized,
      type: "file" as const,
      translatable,
      selected,
      ignored,
      reason: ignored ? "matched_ignore_rule" : null
    };
  });

  return {
    summary: {
      totalFiles: items.length,
      translatableFiles: items.filter((item) => item.translatable).length,
      ignoredFiles: items.filter((item) => item.ignored).length
    },
    items
  };
}
