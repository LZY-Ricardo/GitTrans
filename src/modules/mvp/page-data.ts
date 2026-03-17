import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { isAppError } from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import { LANGUAGE_OPTIONS, MODEL_OPTIONS } from "@/modules/catalog/bootstrap";
import type {
  BootstrapPayload,
  DemoSession,
  FileTreeItem,
  InstallationSummary,
  RepoDetail,
  RepoSummary,
  TaskDetail,
  TaskSummary,
} from "@/modules/mvp/contracts";
import {
  getRepositoryConfig,
  getRepositoryFiles,
  getRepositorySummary,
  listAccessibleInstallationsForUser,
  listRepositoriesForUser,
} from "@/modules/repos/repo-service";
import {
  getTaskDetail,
  getTaskProgress,
  listTaskPreviews,
  listTasksForRepository,
} from "@/modules/tasks/task-service";

function serializeDate(value?: Date | string | null) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function getGitHubInstallUrl() {
  return env.GITHUB_APP_SLUG
    ? `https://github.com/apps/${env.GITHUB_APP_SLUG}/installations/new`
    : null;
}

function mapRepoSummary(repo: Awaited<ReturnType<typeof listRepositoriesForUser>>[number]): RepoSummary {
  return {
    ...repo,
    lastSyncedAt: serializeDate(repo.lastSyncedAt),
  };
}

function mapRepoDetail(repo: Awaited<ReturnType<typeof getRepositorySummary>>): RepoDetail {
  return {
    ...repo,
    currentPr: repo.currentPr
      ? {
          ...repo.currentPr,
          state: repo.currentPr.state === "closed" ? "closed" : "open",
        }
      : null,
    syncState: {
      ...repo.syncState,
      lastSyncedAt: serializeDate(repo.syncState.lastSyncedAt),
    },
    latestTask: repo.latestTask
      ? {
          ...repo.latestTask,
          createdAt: serializeDate(repo.latestTask.createdAt) ?? new Date().toISOString(),
        }
      : null,
  };
}

function mapTaskSummary(
  task: Awaited<ReturnType<typeof listTasksForRepository>>["items"][number],
): TaskSummary {
  return {
    ...task,
    createdAt: serializeDate(task.createdAt) ?? new Date().toISOString(),
    finishedAt: serializeDate(task.finishedAt),
  };
}

function mapTaskDetail(task: Awaited<ReturnType<typeof getTaskDetail>>): TaskDetail {
  return {
    ...task,
    readmeNavigationPreview: task.readmeNavigationPreview ?? "",
    createdAt: serializeDate(task.createdAt) ?? new Date().toISOString(),
    startedAt: serializeDate(task.startedAt),
    finishedAt: serializeDate(task.finishedAt),
  };
}

export function getBootstrapPayload(): BootstrapPayload {
  return {
    languages: LANGUAGE_OPTIONS,
    models: MODEL_OPTIONS,
    features: {
      byokEnabled: false,
      autoSyncEnabled: false,
    },
  };
}

export async function getCurrentSessionPayload(): Promise<DemoSession | null> {
  const session = await getCurrentSession();

  if (!session) {
    return null;
  }

  return {
    authenticated: true,
    user: {
      id: session.user.id,
      name: session.user.name,
      githubLogin: session.user.githubLogin,
      avatarUrl: session.user.avatarUrl ?? "",
    },
    githubApp: {
      installUrl: getGitHubInstallUrl(),
    },
  };
}

export async function requirePageUser() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/");
  }

  return session.user;
}

export async function getDashboardPageData() {
  const user = await requirePageUser();
  const repos = await listRepositoriesForUser(user.id);
  let installations: InstallationSummary[] = [];
  let installationsError: string | null = null;

  try {
    installations = (await listAccessibleInstallationsForUser(user.id)).map((item) => ({
      ...item,
      repositoriesCount: item.repositoriesCount ?? null,
    }));
  } catch (error) {
    installationsError = error instanceof Error ? error.message : "读取 GitHub 安装列表失败";
  }

  return {
    repos: repos.map(mapRepoSummary),
    installations,
    installationsError,
    installUrl: getGitHubInstallUrl(),
  };
}

export async function getRepoPageData(repoId: string) {
  const user = await requirePageUser();
  const [repo, config, tasks] = await Promise.all([
    getRepositorySummary(repoId, user.id),
    getRepositoryConfig(repoId, user.id),
    listTasksForRepository({
      repoId,
      userId: user.id,
      page: 1,
      pageSize: 20,
    }),
  ]);

  return {
    repo: mapRepoDetail(repo),
    config,
    tasks: tasks.items.map(mapTaskSummary),
  };
}

export async function getRepoConfigPageData(repoId: string) {
  const user = await requirePageUser();
  const [repo, config] = await Promise.all([
    getRepositorySummary(repoId, user.id),
    getRepositoryConfig(repoId, user.id),
  ]);

  let files: FileTreeItem[] = [];
  let filesError: string | null = null;

  try {
    files = (await getRepositoryFiles(repoId, user.id, repo.baseBranch)).items.map((item) => ({
      ...item,
      reason: item.reason ?? undefined,
    }));
  } catch (error) {
    filesError =
      error instanceof Error &&
      error.message.includes("installationId option is required")
        ? "当前仓库尚未完成有效的 GitHub 安装授权，暂时无法读取实时文件树。"
        : "当前仓库暂时无法读取 GitHub 文件树，请确认 GitHub App 安装与仓库权限后重试。";
  }

  return {
    repo: mapRepoDetail(repo),
    config,
    files,
    filesError,
    bootstrap: getBootstrapPayload(),
  };
}

export async function getTaskPageData(taskId: string) {
  const user = await requirePageUser();
  const task = await getTaskDetail(taskId, user.id);
  const [repo, progress, previews] = await Promise.all([
    getRepositorySummary(task.repoId, user.id),
    getTaskProgress(taskId, user.id),
    listTaskPreviews(taskId, user.id),
  ]);

  return {
    task: mapTaskDetail(task),
    repo: mapRepoDetail(repo),
    progress,
    previews,
  };
}

export async function getSettingsPageData() {
  return {
    session: await getCurrentSessionPayload(),
    bootstrap: getBootstrapPayload(),
  };
}

export function isNotFoundError(error: unknown) {
  return isAppError(error) && error.status === 404;
}
