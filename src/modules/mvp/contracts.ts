import type { LanguageOption, ModelOption } from "@/modules/catalog/bootstrap";

export type DemoSession = {
  authenticated: boolean;
  user: {
    id: string;
    name: string;
    githubLogin: string;
    avatarUrl: string;
  };
  githubApp: {
    installUrl: string;
  };
};

export type BootstrapPayload = {
  languages: LanguageOption[];
  models: ModelOption[];
  features: {
    byokEnabled: boolean;
    autoSyncEnabled: boolean;
  };
};

export type InstallationSummary = {
  installationId: string;
  accountLogin: string;
  accountType: string;
  repositoriesCount: number;
  installUrl: string;
};

export type ImportableRepository = {
  githubRepoId: string;
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  private: boolean;
  alreadyImported: boolean;
};

export type RepoStatus = "ready" | "running" | "error" | "disconnected";
export type TaskType = "full" | "incremental";
export type TaskStatus = "pending" | "running" | "succeeded" | "failed" | "cancelled";

export type RepoSummary = {
  id: string;
  fullName: string;
  defaultBranch: string;
  baseBranch: string;
  baseLanguage: string;
  targetLanguages: string[];
  status: RepoStatus;
  currentTask: {
    id: string;
    status: TaskStatus;
  } | null;
  currentPrUrl: string | null;
  lastSyncedAt: string | null;
};

export type RepoDetail = {
  id: string;
  fullName: string;
  defaultBranch: string;
  baseBranch: string;
  baseLanguage: string;
  targetLanguages: string[];
  status: RepoStatus;
  translationBranch: string;
  currentPr: {
    number: number;
    url: string;
    state: "open" | "closed";
  } | null;
  syncState: {
    lastSyncedSha: string | null;
    lastSyncedAt: string | null;
  };
  latestTask: {
    id: string;
    type: TaskType;
    status: TaskStatus;
    createdAt: string;
  } | null;
};

export type RepoConfig = {
  repoId: string;
  baseBranch: string;
  baseLanguage: string;
  targetLanguages: string[];
  includePaths: string[];
  ignoreRulesText: string;
  modelId: string;
  outputRoot: string;
  readmeNavigationEnabled: boolean;
  usePlatformKey: boolean;
};

export type FileTreeItem = {
  path: string;
  type: "file" | "dir";
  translatable: boolean;
  selected: boolean;
  ignored: boolean;
  reason?: string;
};

export type TaskSummary = {
  id: string;
  type: TaskType;
  status: TaskStatus;
  progressTotal: number;
  progressDone: number;
  createdAt: string;
  finishedAt: string | null;
  prUrl: string | null;
};

export type TaskDetail = {
  id: string;
  repoId: string;
  type: TaskType;
  status: TaskStatus;
  triggerSource: "manual" | "webhook" | "system";
  progressTotal: number;
  progressDone: number;
  progressFailed: number;
  targetLanguages: string[];
  changedFiles: string[];
  currentLanguage: string | null;
  currentFile: string | null;
  prUrl: string | null;
  readmeNavigationPreview: string;
  errorSummary: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
};

export type TaskProgress = {
  taskId: string;
  status: TaskStatus;
  percent: number;
  progressTotal: number;
  progressDone: number;
  progressFailed: number;
  currentLanguage: string | null;
  currentFile: string | null;
  prUrl: string | null;
};

export type TaskPreview = {
  sourcePath: string;
  targetLanguage: string;
  targetPath: string;
  sourceContent: string;
  translatedContent: string;
};
