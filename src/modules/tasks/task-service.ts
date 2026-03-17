import { TaskItemStatus, TaskStatus, TaskType, TriggerSource } from "@prisma/client";

import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getRepositoryForUser } from "@/modules/repos/repo-service";

export async function listTasksForRepository(options: {
  repoId: string;
  userId: string;
  page: number;
  pageSize: number;
}) {
  await getRepositoryForUser(options.repoId, options.userId);

  const [items, total] = await prisma.$transaction([
    prisma.translationTask.findMany({
      where: { repoId: options.repoId },
      orderBy: { createdAt: "desc" },
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize
    }),
    prisma.translationTask.count({
      where: { repoId: options.repoId }
    })
  ]);

  return {
    items: items.map((task) => ({
      id: task.id,
      type: task.type,
      status: task.status,
      progressTotal: task.progressTotal,
      progressDone: task.progressDone,
      createdAt: task.createdAt,
      finishedAt: task.finishedAt,
      prUrl: task.prUrl
    })),
    pagination: {
      page: options.page,
      pageSize: options.pageSize,
      total
    }
  };
}

export async function createTask(options: {
  repoId: string;
  userId: string;
  type: TaskType;
  triggerSource?: TriggerSource;
}) {
  const repo = await getRepositoryForUser(options.repoId, options.userId);

  const runningTask = await prisma.translationTask.findFirst({
    where: {
      repoId: repo.id,
      status: {
        in: [TaskStatus.pending, TaskStatus.running]
      }
    }
  });

  if (runningTask) {
    throw new AppError("TASK_CONFLICT", 409, "当前仓库已有运行中的任务");
  }

  const task = await prisma.translationTask.create({
    data: {
      repoId: repo.id,
      type: options.type,
      triggerSource: options.triggerSource ?? TriggerSource.manual,
      status: TaskStatus.pending,
      targetLanguagesJson: repo.config?.targetLanguagesJson ?? [],
      modelId: repo.config?.modelId ?? null
    }
  });

  await prisma.repository.update({
    where: { id: repo.id },
    data: {
      status: "running"
    }
  });

  return task;
}

export async function getTaskForUser(taskId: string, userId: string) {
  const task = await prisma.translationTask.findFirst({
    where: {
      id: taskId,
      repository: {
        userId
      }
    },
    include: {
      repository: {
        include: {
          config: true
        }
      },
      items: {
        orderBy: [{ filePath: "asc" }, { language: "asc" }]
      }
    }
  });

  if (!task) {
    throw new AppError("TASK_NOT_FOUND", 404, "任务不存在");
  }

  return task;
}

export async function getTaskDetail(taskId: string, userId: string) {
  const task = await getTaskForUser(taskId, userId);

  return {
    id: task.id,
    repoId: task.repoId,
    type: task.type,
    status: task.status,
    triggerSource: task.triggerSource,
    progressTotal: task.progressTotal,
    progressDone: task.progressDone,
    progressFailed: task.progressFailed,
    targetLanguages: (task.targetLanguagesJson as string[]) ?? [],
    changedFiles: (task.changedFilesJson as string[]) ?? [],
    currentLanguage: task.currentLanguage,
    currentFile: task.currentFile,
    prUrl: task.prUrl,
    readmeNavigationPreview: task.readmeNavigationPreview,
    errorSummary: task.errorSummary,
    createdAt: task.createdAt,
    startedAt: task.startedAt,
    finishedAt: task.finishedAt
  };
}

export async function getTaskProgress(taskId: string, userId: string) {
  const task = await getTaskForUser(taskId, userId);
  const percent =
    task.progressTotal > 0
      ? Math.round(((task.progressDone + task.progressFailed) / task.progressTotal) * 100)
      : task.status === TaskStatus.succeeded
        ? 100
        : 0;

  return {
    taskId: task.id,
    status: task.status,
    percent,
    progressTotal: task.progressTotal,
    progressDone: task.progressDone,
    progressFailed: task.progressFailed,
    currentLanguage: task.currentLanguage,
    currentFile: task.currentFile,
    prUrl: task.prUrl
  };
}

export async function getTaskPreview(options: {
  taskId: string;
  userId: string;
  path: string;
  lang: string;
}) {
  await getTaskForUser(options.taskId, options.userId);

  const item = await prisma.translationTaskItem.findFirst({
    where: {
      taskId: options.taskId,
      filePath: options.path,
      language: options.lang
    }
  });

  if (!item) {
    throw new AppError("TASK_PREVIEW_NOT_FOUND", 404, "预览内容不存在");
  }

  return {
    sourcePath: item.filePath,
    targetLanguage: item.language,
    targetPath: item.outputPath,
    sourceContent: item.sourceContent,
    translatedContent: item.translatedContent
  };
}

export async function listTaskPreviews(taskId: string, userId: string) {
  await getTaskForUser(taskId, userId);

  const items = await prisma.translationTaskItem.findMany({
    where: {
      taskId,
      status: TaskItemStatus.succeeded,
      sourceContent: {
        not: null
      },
      translatedContent: {
        not: null
      }
    },
    orderBy: [{ filePath: "asc" }, { language: "asc" }],
    take: 12
  });

  return items.map((item) => ({
    sourcePath: item.filePath,
    targetLanguage: item.language,
    targetPath: item.outputPath ?? "",
    sourceContent: item.sourceContent ?? "",
    translatedContent: item.translatedContent ?? ""
  }));
}
