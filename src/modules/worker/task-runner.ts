import { TaskItemStatus, TaskStatus, TaskType, TriggerSource } from "@prisma/client";

import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { filterTranslatablePaths, isMarkdownPath, matchesAnyGlob, normalizePath } from "@/lib/paths";
import { prisma } from "@/lib/prisma";
import {
  compareCommits,
  commitFilesToBranch,
  getBranchHead,
  getFileContent,
  getRepositoryTree,
  upsertPullRequest
} from "@/modules/github/github-service";
import { buildGitTransConfigFile } from "@/modules/repos/config-file";
import { translateMarkdown } from "@/modules/translation/markdown";
import { updateReadmeNavigation } from "@/modules/translation/readme-navigation";
import { deriveTaskResult } from "@/modules/worker/task-result";

type RunnableTask = Awaited<ReturnType<typeof claimNextTask>>;

async function claimNextTask(workerId: string) {
  const now = new Date();
  const candidate = await prisma.translationTask.findFirst({
    where: {
      OR: [
        { status: TaskStatus.pending },
        {
          status: TaskStatus.running,
          lockExpiresAt: {
            lt: now
          }
        }
      ]
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    include: {
      repository: {
        include: {
          config: true,
          syncState: true,
          installation: true
        }
      }
    }
  });

  if (!candidate) {
    return null;
  }

  const updated = await prisma.translationTask.updateMany({
    where: {
      id: candidate.id,
      OR: [
        { status: TaskStatus.pending },
        {
          status: TaskStatus.running,
          lockExpiresAt: {
            lt: now
          }
        }
      ]
    },
    data: {
      status: TaskStatus.running,
      lockOwner: workerId,
      lockExpiresAt: new Date(Date.now() + env.TASK_LOCK_TIMEOUT_MS),
      startedAt: candidate.startedAt ?? now
    }
  });

  if (updated.count === 0) {
    return null;
  }

  return prisma.translationTask.findUnique({
    where: { id: candidate.id },
    include: {
      repository: {
        include: {
          config: true,
          syncState: true,
          installation: true
        }
      }
    }
  });
}

function buildOutputPath(language: string, filePath: string) {
  return `translations/${language}/${normalizePath(filePath)}`;
}

async function updateTaskProgress(
  taskId: string,
  data: Partial<{
    progressTotal: number;
    progressDone: number;
    progressFailed: number;
    currentLanguage: string | null;
    currentFile: string | null;
    changedFilesJson: string[];
    readmeNavigationPreview: string | null;
    prUrl: string | null;
    errorSummary: string | null;
    status: TaskStatus;
    finishedAt: Date | null;
    commitRange: string | null;
  }>
) {
  await prisma.translationTask.update({
    where: { id: taskId },
    data
  });
}

async function markRepositoryReady(repoId: string) {
  await prisma.repository.update({
    where: { id: repoId },
    data: { status: "ready" }
  });
}

function filterDeletedFiles(options: {
  files: Array<{ path: string; status: string }>;
  includePatterns: string[];
  ignoreRulesText: string;
}) {
  return options.files
    .filter((file) => file.status === "removed")
    .map((file) => normalizePath(file.path))
    .filter((path) => isMarkdownPath(path))
    .filter((path) => matchesAnyGlob(path, options.includePatterns))
    .filter((path) => {
      const matcher = filterTranslatablePaths({
        paths: [path],
        includePatterns: options.includePatterns,
        ignoreRulesText: options.ignoreRulesText
      });

      return matcher.length > 0;
    });
}

async function resolveSourceFiles(task: NonNullable<RunnableTask>) {
  const repo = task.repository;
  const config = repo.config;

  if (!config) {
    throw new AppError("REPO_CONFIG_NOT_FOUND", 404, "仓库配置不存在");
  }

  const includePatterns = config.includePathsJson as string[];
  const branchHead = await getBranchHead({
    installationId: repo.installation.installationId,
    owner: repo.owner,
    repo: repo.name,
    branch: repo.baseBranch
  });

  if (task.type === TaskType.full || !repo.syncState?.lastSyncedSha) {
    const tree = await getRepositoryTree({
      installationId: repo.installation.installationId,
      owner: repo.owner,
      repo: repo.name,
      ref: repo.baseBranch
    });

    const markdownFiles = filterTranslatablePaths({
      paths: tree.filter((item) => item.type === "file").map((item) => item.path),
      includePatterns,
      ignoreRulesText: config.ignoreRulesText
    });

    return {
      headSha: branchHead.sha,
      changedFiles: markdownFiles,
      deletedFiles: [] as string[],
      commitRange: null as string | null
    };
  }

  const compare = await compareCommits({
    installationId: repo.installation.installationId,
    owner: repo.owner,
    repo: repo.name,
    base: repo.syncState.lastSyncedSha!,
    head: branchHead.sha
  });

  const changedFiles = filterTranslatablePaths({
    paths: compare.files
      .filter((file) => file.status !== "removed")
      .map((file) => file.path),
    includePatterns,
    ignoreRulesText: config.ignoreRulesText
  });

  const deletedFiles = filterDeletedFiles({
    files: compare.files,
    includePatterns,
    ignoreRulesText: config.ignoreRulesText
  });

  return {
    headSha: branchHead.sha,
    changedFiles,
    deletedFiles,
    commitRange: `${repo.syncState.lastSyncedSha}...${branchHead.sha}`
  };
}

async function createTaskItems(taskId: string, files: string[], languages: string[]) {
  if (!files.length || !languages.length) {
    return;
  }

  await prisma.translationTaskItem.createMany({
    data: files.flatMap((filePath) =>
      languages.map((language) => ({
        taskId,
        filePath,
        language,
        outputPath: buildOutputPath(language, filePath)
      }))
    )
  });
}

async function processTask(task: NonNullable<RunnableTask>) {
  const repo = task.repository;
  const config = repo.config;

  if (!config) {
    throw new AppError("REPO_CONFIG_NOT_FOUND", 404, "仓库配置不存在");
  }

  const targetLanguages = config.targetLanguagesJson as string[];
  const source = await resolveSourceFiles(task);
  const progressTotal = source.changedFiles.length * targetLanguages.length;

  await updateTaskProgress(task.id, {
    progressTotal,
    changedFilesJson: source.changedFiles
  });

  await createTaskItems(task.id, source.changedFiles, targetLanguages);

  if (!source.changedFiles.length && !source.deletedFiles.length) {
    await prisma.repositorySyncState.upsert({
      where: { repoId: repo.id },
      create: {
        repoId: repo.id,
        lastSyncedSha: source.headSha,
        lastSuccessfulTaskId: task.id,
        lastSyncedAt: new Date()
      },
      update: {
        lastSyncedSha: source.headSha,
        lastSuccessfulTaskId: task.id,
        lastSyncedAt: new Date()
      }
    });

    await updateTaskProgress(task.id, {
      status: TaskStatus.succeeded,
      finishedAt: new Date(),
      currentFile: null,
      currentLanguage: null,
      commitRange: source.commitRange
    });
    await markRepositoryReady(repo.id);
    return;
  }

  const taskItems = await prisma.translationTaskItem.findMany({
    where: { taskId: task.id },
    orderBy: [{ filePath: "asc" }, { language: "asc" }]
  });

  const artifactWrites: Array<{ path: string; content?: string; delete?: boolean }> = [];
  let progressDone = 0;
  let progressFailed = 0;
  let firstItemError: string | null = null;

  for (const item of taskItems) {
    try {
      await updateTaskProgress(task.id, {
        currentLanguage: item.language,
        currentFile: item.filePath
      });

      await prisma.translationTaskItem.update({
        where: { id: item.id },
        data: {
          status: TaskItemStatus.running
        }
      });

      const sourceContent = await getFileContent({
        installationId: repo.installation.installationId,
        owner: repo.owner,
        repo: repo.name,
        path: item.filePath,
        ref: repo.baseBranch
      });

      const translatedContent = await translateMarkdown({
        markdown: sourceContent,
        sourceLanguage: repo.baseLanguage,
        targetLanguage: item.language,
        modelId: config.modelId
      });

      await prisma.translationTaskItem.update({
        where: { id: item.id },
        data: {
          status: TaskItemStatus.succeeded,
          sourceContent,
          translatedContent
        }
      });

      artifactWrites.push({
        path: item.outputPath ?? buildOutputPath(item.language, item.filePath),
        content: translatedContent
      });

      progressDone += 1;

      await updateTaskProgress(task.id, {
        progressDone
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "翻译任务项执行失败";
      firstItemError ??= message;

      await prisma.translationTaskItem.update({
        where: { id: item.id },
        data: {
          status: TaskItemStatus.failed,
          errorMessage: message
        }
      });

      progressFailed += 1;

      await updateTaskProgress(task.id, {
        progressFailed
      });
    }
  }

  for (const deletedFile of source.deletedFiles) {
    for (const language of targetLanguages) {
      artifactWrites.push({
        path: buildOutputPath(language, deletedFile),
        delete: true
      });
    }
  }

  const includesReadme = source.changedFiles.includes("README.md");
  let readmeNavigationPreview: string | null = null;

  if (config.readmeNavigationEnabled && includesReadme && progressDone > 0) {
    const sourceReadme = await getFileContent({
      installationId: repo.installation.installationId,
      owner: repo.owner,
      repo: repo.name,
      path: "README.md",
      ref: repo.baseBranch
    });

    const updatedReadme = updateReadmeNavigation(sourceReadme, targetLanguages);
    readmeNavigationPreview = updatedReadme;

    artifactWrites.push({
      path: "README.md",
      content: updatedReadme
    });
  }

  const taskResult = deriveTaskResult({
    progressDone,
    progressFailed,
    firstItemError,
    hasFileMutations: artifactWrites.length > 0
  });

  const configYaml = buildGitTransConfigFile({
    repo: repo.fullName,
    baseBranch: repo.baseBranch,
    baseLanguage: repo.baseLanguage,
    targetLanguages,
    includePaths: config.includePathsJson as string[],
    modelId: config.modelId,
    outputRoot: config.outputRoot,
    readmeNavigationEnabled: config.readmeNavigationEnabled,
    translationBranch: repo.translationBranch
  });

  const fileWrites = taskResult.shouldPublishArtifacts
    ? artifactWrites.concat([
        {
          path: ".gittrans.yml",
          content: configYaml
        },
        {
          path: ".github-global-ignore",
          content: config.ignoreRulesText
        }
      ])
    : artifactWrites;

  let prUrl: string | null = null;
  const finalStatus = taskResult.finalStatus;

  if (fileWrites.length > 0) {
    const commit = await commitFilesToBranch({
      installationId: repo.installation.installationId,
      owner: repo.owner,
      repo: repo.name,
      baseBranch: repo.baseBranch,
      targetBranch: repo.translationBranch,
      commitMessage:
        task.type === TaskType.full
          ? "docs: create translations"
          : "docs: update translations",
      files: fileWrites
    });

    const pr = await upsertPullRequest({
      installationId: repo.installation.installationId,
      owner: repo.owner,
      repo: repo.name,
      baseBranch: repo.baseBranch,
      headBranch: repo.translationBranch,
      title:
        task.type === TaskType.full
          ? "docs: create translations"
          : "docs: update translations",
      body: "This PR was generated by GitTrans MVP."
    });

    prUrl = pr.url;

    await prisma.pullRequestState.upsert({
      where: { repoId: repo.id },
      create: {
        repoId: repo.id,
        number: pr.number,
        url: pr.url,
        state: pr.state,
        headBranch: repo.translationBranch,
        baseBranch: repo.baseBranch,
        lastCommitSha: commit.commitSha
      },
      update: {
        number: pr.number,
        url: pr.url,
        state: pr.state,
        headBranch: repo.translationBranch,
        baseBranch: repo.baseBranch,
        lastCommitSha: commit.commitSha
      }
    });

    await prisma.repository.update({
      where: { id: repo.id },
      data: {
        currentPrNumber: pr.number
      }
    });
  }

  await prisma.repositorySyncState.upsert({
    where: { repoId: repo.id },
    create: {
      repoId: repo.id,
      lastSyncedSha: source.headSha,
      lastSuccessfulTaskId: finalStatus === TaskStatus.succeeded ? task.id : null,
      lastSyncedAt: finalStatus === TaskStatus.succeeded ? new Date() : null
    },
    update: {
      lastSyncedSha: source.headSha,
      lastSuccessfulTaskId: finalStatus === TaskStatus.succeeded ? task.id : undefined,
      lastSyncedAt: finalStatus === TaskStatus.succeeded ? new Date() : undefined
    }
  });

  await updateTaskProgress(task.id, {
    status: finalStatus,
    finishedAt: new Date(),
    currentFile: null,
    currentLanguage: null,
    prUrl,
    commitRange: source.commitRange,
    readmeNavigationPreview,
    errorSummary: taskResult.errorSummary
  });

  await markRepositoryReady(repo.id);
}

export async function runNextTask(workerId: string) {
  const task = await claimNextTask(workerId);

  if (!task) {
    return false;
  }

  logger.info({ taskId: task.id, workerId }, "Picked translation task");

  try {
    await processTask(task);
  } catch (error) {
    const message = error instanceof Error ? error.message : "任务执行失败";

    logger.error({ err: error, taskId: task.id }, "Task execution failed");

    await updateTaskProgress(task.id, {
      status: TaskStatus.failed,
      errorSummary: message,
      finishedAt: new Date(),
      currentFile: null,
      currentLanguage: null
    });
    await markRepositoryReady(task.repository.id);
  }

  return true;
}

export async function enqueueIncrementalTaskForWebhook(repoId: string) {
  const running = await prisma.translationTask.findFirst({
    where: {
      repoId,
      status: {
        in: [TaskStatus.pending, TaskStatus.running]
      }
    }
  });

  if (running) {
    return running;
  }

  return prisma.translationTask.create({
    data: {
      repoId,
      type: TaskType.incremental,
      triggerSource: TriggerSource.webhook,
      status: TaskStatus.pending
    }
  });
}
