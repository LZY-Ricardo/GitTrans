import { LANGUAGE_OPTIONS, MODEL_OPTIONS, getLanguageByCode } from "@/modules/catalog/bootstrap";
import type {
  BootstrapPayload,
  DemoSession,
  FileTreeItem,
  ImportableRepository,
  InstallationSummary,
  RepoConfig,
  RepoDetail,
  RepoSummary,
  TaskDetail,
  TaskPreview,
  TaskProgress,
  TaskSummary,
} from "@/modules/mvp/contracts";

const session: DemoSession = {
  authenticated: true,
  user: {
    id: "u_123",
    name: "Yupi",
    githubLogin: "liyupi",
    avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
  },
  githubApp: {
    installUrl: "https://github.com/apps/gittrans/installations/new",
  },
};

const bootstrap: BootstrapPayload = {
  languages: LANGUAGE_OPTIONS,
  models: MODEL_OPTIONS,
  features: {
    byokEnabled: false,
    autoSyncEnabled: false,
  },
};

const installations: InstallationSummary[] = [
  {
    installationId: "10001",
    accountLogin: "liyupi",
    accountType: "User",
    repositoriesCount: 12,
    installUrl: "https://github.com/apps/gittrans/installations/10001",
  },
  {
    installationId: "10002",
    accountLogin: "acme-docs",
    accountType: "Organization",
    repositoriesCount: 8,
    installUrl: "https://github.com/apps/gittrans/installations/10002",
  },
];

const importableRepositories: ImportableRepository[] = [
  {
    githubRepoId: "123456",
    owner: "liyupi",
    name: "ai-guide",
    fullName: "liyupi/ai-guide",
    defaultBranch: "main",
    private: false,
    alreadyImported: true,
  },
  {
    githubRepoId: "187654",
    owner: "acme-docs",
    name: "docs-kit",
    fullName: "acme-docs/docs-kit",
    defaultBranch: "main",
    private: false,
    alreadyImported: false,
  },
  {
    githubRepoId: "297601",
    owner: "acme-docs",
    name: "global-handbook",
    fullName: "acme-docs/global-handbook",
    defaultBranch: "master",
    private: false,
    alreadyImported: false,
  },
];

const repos: RepoSummary[] = [
  {
    id: "repo_123",
    fullName: "liyupi/ai-guide",
    defaultBranch: "main",
    baseBranch: "main",
    baseLanguage: "zh-CN",
    targetLanguages: ["en", "ja"],
    status: "ready",
    currentTask: null,
    currentPrUrl: "https://github.com/liyupi/ai-guide/pull/10",
    lastSyncedAt: "2026-03-15T08:00:00Z",
  },
  {
    id: "repo_456",
    fullName: "acme-docs/docs-kit",
    defaultBranch: "main",
    baseBranch: "main",
    baseLanguage: "en",
    targetLanguages: ["zh-CN", "ja", "fr"],
    status: "running",
    currentTask: {
      id: "task_456",
      status: "running",
    },
    currentPrUrl: "https://github.com/acme-docs/docs-kit/pull/42",
    lastSyncedAt: "2026-03-14T15:10:00Z",
  },
  {
    id: "repo_789",
    fullName: "open-source-labs/agent-playbook",
    defaultBranch: "main",
    baseBranch: "docs",
    baseLanguage: "zh-CN",
    targetLanguages: ["en"],
    status: "error",
    currentTask: {
      id: "task_999",
      status: "failed",
    },
    currentPrUrl: null,
    lastSyncedAt: null,
  },
];

const repoDetails: Record<string, RepoDetail> = {
  repo_123: {
    id: "repo_123",
    fullName: "liyupi/ai-guide",
    defaultBranch: "main",
    baseBranch: "main",
    baseLanguage: "zh-CN",
    targetLanguages: ["en", "ja"],
    status: "ready",
    translationBranch: "gittrans/main",
    currentPr: {
      number: 10,
      url: "https://github.com/liyupi/ai-guide/pull/10",
      state: "open",
    },
    syncState: {
      lastSyncedSha: "abc123f",
      lastSyncedAt: "2026-03-15T08:00:00Z",
    },
    latestTask: {
      id: "task_123",
      type: "full",
      status: "succeeded",
      createdAt: "2026-03-15T07:50:00Z",
    },
  },
  repo_456: {
    id: "repo_456",
    fullName: "acme-docs/docs-kit",
    defaultBranch: "main",
    baseBranch: "main",
    baseLanguage: "en",
    targetLanguages: ["zh-CN", "ja", "fr"],
    status: "running",
    translationBranch: "gittrans/main",
    currentPr: {
      number: 42,
      url: "https://github.com/acme-docs/docs-kit/pull/42",
      state: "open",
    },
    syncState: {
      lastSyncedSha: "de45aa8",
      lastSyncedAt: "2026-03-14T15:10:00Z",
    },
    latestTask: {
      id: "task_456",
      type: "incremental",
      status: "running",
      createdAt: "2026-03-15T08:10:00Z",
    },
  },
  repo_789: {
    id: "repo_789",
    fullName: "open-source-labs/agent-playbook",
    defaultBranch: "main",
    baseBranch: "docs",
    baseLanguage: "zh-CN",
    targetLanguages: ["en"],
    status: "error",
    translationBranch: "gittrans/docs",
    currentPr: null,
    syncState: {
      lastSyncedSha: null,
      lastSyncedAt: null,
    },
    latestTask: {
      id: "task_999",
      type: "full",
      status: "failed",
      createdAt: "2026-03-14T12:40:00Z",
    },
  },
};

const repoConfigs: Record<string, RepoConfig> = {
  repo_123: {
    repoId: "repo_123",
    baseBranch: "main",
    baseLanguage: "zh-CN",
    targetLanguages: ["en", "ja"],
    includePaths: ["README.md", "docs/**"],
    ignoreRulesText: "CHANGELOG.md\ndocs/internal/\n",
    modelId: "openai/gpt-5.2",
    outputRoot: "translations",
    readmeNavigationEnabled: true,
    usePlatformKey: true,
  },
  repo_456: {
    repoId: "repo_456",
    baseBranch: "main",
    baseLanguage: "en",
    targetLanguages: ["zh-CN", "ja", "fr"],
    includePaths: ["README.md", "docs/**", "packages/site/content/**"],
    ignoreRulesText: "docs/archive/\npackages/site/content/snippets/internal.md\n",
    modelId: "openai/gpt-5.2",
    outputRoot: "translations",
    readmeNavigationEnabled: true,
    usePlatformKey: true,
  },
  repo_789: {
    repoId: "repo_789",
    baseBranch: "docs",
    baseLanguage: "zh-CN",
    targetLanguages: ["en"],
    includePaths: ["README.md", "docs/**"],
    ignoreRulesText: "docs/legacy/\n",
    modelId: "openai/gpt-5.2",
    outputRoot: "translations",
    readmeNavigationEnabled: true,
    usePlatformKey: true,
  },
};

const repoFiles: Record<string, FileTreeItem[]> = {
  repo_123: [
    { path: "README.md", type: "file", translatable: true, selected: true, ignored: false },
    { path: "docs", type: "dir", translatable: false, selected: true, ignored: false },
    { path: "docs/guide.md", type: "file", translatable: true, selected: true, ignored: false },
    { path: "docs/setup.md", type: "file", translatable: true, selected: true, ignored: false },
    {
      path: "docs/internal",
      type: "dir",
      translatable: false,
      selected: false,
      ignored: true,
      reason: "matched_ignore_rule",
    },
    {
      path: "docs/internal/plan.md",
      type: "file",
      translatable: true,
      selected: false,
      ignored: true,
      reason: "matched_ignore_rule",
    },
    { path: "scripts/sync.ts", type: "file", translatable: false, selected: false, ignored: false },
  ],
  repo_456: [
    { path: "README.md", type: "file", translatable: true, selected: true, ignored: false },
    { path: "docs", type: "dir", translatable: false, selected: true, ignored: false },
    { path: "docs/getting-started.md", type: "file", translatable: true, selected: true, ignored: false },
    { path: "docs/reference.md", type: "file", translatable: true, selected: true, ignored: false },
    { path: "packages/site/content", type: "dir", translatable: false, selected: true, ignored: false },
    {
      path: "packages/site/content/snippets/internal.md",
      type: "file",
      translatable: true,
      selected: false,
      ignored: true,
      reason: "matched_ignore_rule",
    },
  ],
  repo_789: [
    { path: "README.md", type: "file", translatable: true, selected: true, ignored: false },
    { path: "docs", type: "dir", translatable: false, selected: true, ignored: false },
    { path: "docs/overview.md", type: "file", translatable: true, selected: true, ignored: false },
    {
      path: "docs/legacy/2019-plan.md",
      type: "file",
      translatable: true,
      selected: false,
      ignored: true,
      reason: "matched_ignore_rule",
    },
  ],
};

const repoTasks: Record<string, TaskSummary[]> = {
  repo_123: [
    {
      id: "task_123",
      type: "full",
      status: "succeeded",
      progressTotal: 20,
      progressDone: 20,
      createdAt: "2026-03-15T07:50:00Z",
      finishedAt: "2026-03-15T08:05:00Z",
      prUrl: "https://github.com/liyupi/ai-guide/pull/10",
    },
    {
      id: "task_122",
      type: "incremental",
      status: "succeeded",
      progressTotal: 6,
      progressDone: 6,
      createdAt: "2026-03-14T10:10:00Z",
      finishedAt: "2026-03-14T10:16:00Z",
      prUrl: "https://github.com/liyupi/ai-guide/pull/9",
    },
  ],
  repo_456: [
    {
      id: "task_456",
      type: "incremental",
      status: "running",
      progressTotal: 8,
      progressDone: 3,
      createdAt: "2026-03-15T08:10:00Z",
      finishedAt: null,
      prUrl: "https://github.com/acme-docs/docs-kit/pull/42",
    },
    {
      id: "task_455",
      type: "full",
      status: "succeeded",
      progressTotal: 36,
      progressDone: 36,
      createdAt: "2026-03-13T02:00:00Z",
      finishedAt: "2026-03-13T02:42:00Z",
      prUrl: "https://github.com/acme-docs/docs-kit/pull/38",
    },
  ],
  repo_789: [
    {
      id: "task_999",
      type: "full",
      status: "failed",
      progressTotal: 12,
      progressDone: 7,
      createdAt: "2026-03-14T12:40:00Z",
      finishedAt: "2026-03-14T13:11:00Z",
      prUrl: null,
    },
  ],
};

const taskDetails: Record<string, TaskDetail> = {
  task_123: {
    id: "task_123",
    repoId: "repo_123",
    type: "full",
    status: "succeeded",
    triggerSource: "manual",
    progressTotal: 20,
    progressDone: 20,
    progressFailed: 0,
    targetLanguages: ["en", "ja"],
    changedFiles: ["README.md", "docs/guide.md", "docs/setup.md"],
    currentLanguage: null,
    currentFile: null,
    prUrl: "https://github.com/liyupi/ai-guide/pull/10",
    readmeNavigationPreview:
      "## 🌐 多语言版本 / Translations\n\n[English](./translations/en/README.md) | [日本語](./translations/ja/README.md)\n",
    errorSummary: null,
    createdAt: "2026-03-15T07:50:00Z",
    startedAt: "2026-03-15T07:50:05Z",
    finishedAt: "2026-03-15T08:05:00Z",
  },
  task_456: {
    id: "task_456",
    repoId: "repo_456",
    type: "incremental",
    status: "running",
    triggerSource: "manual",
    progressTotal: 8,
    progressDone: 3,
    progressFailed: 0,
    targetLanguages: ["zh-CN", "ja", "fr"],
    changedFiles: ["README.md", "docs/getting-started.md", "packages/site/content/intro.md"],
    currentLanguage: "ja",
    currentFile: "docs/getting-started.md",
    prUrl: "https://github.com/acme-docs/docs-kit/pull/42",
    readmeNavigationPreview:
      "## 🌐 多语言版本 / Translations\n\n[简体中文](./translations/zh-CN/README.md) | [日本語](./translations/ja/README.md) | [Français](./translations/fr/README.md)\n",
    errorSummary: null,
    createdAt: "2026-03-15T08:10:00Z",
    startedAt: "2026-03-15T08:10:05Z",
    finishedAt: null,
  },
  task_999: {
    id: "task_999",
    repoId: "repo_789",
    type: "full",
    status: "failed",
    triggerSource: "manual",
    progressTotal: 12,
    progressDone: 7,
    progressFailed: 2,
    targetLanguages: ["en"],
    changedFiles: ["README.md", "docs/overview.md"],
    currentLanguage: null,
    currentFile: null,
    prUrl: null,
    readmeNavigationPreview: "## 🌐 多语言版本 / Translations\n\n[English](./translations/en/README.md)\n",
    errorSummary: "2 个文件在术语保护阶段触发了模型输出校验失败，请检查 Prompt 与 Markdown fenced block。",
    createdAt: "2026-03-14T12:40:00Z",
    startedAt: "2026-03-14T12:40:03Z",
    finishedAt: "2026-03-14T13:11:00Z",
  },
};

const taskPreviews: Record<string, TaskPreview[]> = {
  task_123: [
    {
      sourcePath: "README.md",
      targetLanguage: "en",
      targetPath: "translations/en/README.md",
      sourceContent: "# GitTrans\n一键把 GitHub 文档翻译成多语言，并持续保持同步。",
      translatedContent: "# GitTrans\nTranslate GitHub docs into multiple languages and keep them continuously in sync.",
    },
    {
      sourcePath: "README.md",
      targetLanguage: "ja",
      targetPath: "translations/ja/README.md",
      sourceContent: "# GitTrans\n一键把 GitHub 文档翻译成多语言，并持续保持同步。",
      translatedContent: "# GitTrans\nGitHub ドキュメントを多言語に翻訳し、継続的に同期します。",
    },
    {
      sourcePath: "docs/guide.md",
      targetLanguage: "en",
      targetPath: "translations/en/docs/guide.md",
      sourceContent: "## 接入流程\n1. 登录 GitTrans\n2. 选择仓库\n3. 启动首次全量翻译",
      translatedContent: "## Onboarding Flow\n1. Sign in to GitTrans\n2. Select a repository\n3. Start the first full translation run",
    },
  ],
  task_456: [
    {
      sourcePath: "README.md",
      targetLanguage: "zh-CN",
      targetPath: "translations/zh-CN/README.md",
      sourceContent: "# Docs Kit\nReusable documentation starter for developer portals.",
      translatedContent: "# Docs Kit\n面向开发者门户的可复用文档站脚手架。",
    },
    {
      sourcePath: "docs/getting-started.md",
      targetLanguage: "ja",
      targetPath: "translations/ja/docs/getting-started.md",
      sourceContent: "## First Sync\nThe worker compares the latest commit range and only translates changed Markdown files.",
      translatedContent: "## 初回同期\nWorker は最新の commit 範囲を比較し、変更された Markdown ファイルのみを翻訳します。",
    },
    {
      sourcePath: "packages/site/content/intro.md",
      targetLanguage: "fr",
      targetPath: "translations/fr/packages/site/content/intro.md",
      sourceContent: "### Output Strategy\nTranslations are written under translations/{lang}/...",
      translatedContent: "### Stratégie de sortie\nLes traductions sont écrites dans translations/{lang}/...",
    },
  ],
  task_999: [
    {
      sourcePath: "README.md",
      targetLanguage: "en",
      targetPath: "translations/en/README.md",
      sourceContent: "# Agent Playbook\n沉淀多代理协作模式与提示词策略。",
      translatedContent: "# Agent Playbook\nCapture multi-agent collaboration patterns and prompt strategies.",
    },
  ],
};

export async function getDemoSession() {
  return session;
}

export async function getBootstrapPayload() {
  return bootstrap;
}

export async function listInstallations() {
  return installations;
}

export async function listImportableRepositories() {
  return importableRepositories;
}

export async function listRepos() {
  return repos;
}

export async function getRepoDetail(repoId: string) {
  return repoDetails[repoId] ?? null;
}

export async function getRepoConfig(repoId: string) {
  return repoConfigs[repoId] ?? null;
}

export async function getRepoFiles(repoId: string) {
  return repoFiles[repoId] ?? [];
}

export async function getRepoTasks(repoId: string) {
  return repoTasks[repoId] ?? [];
}

export async function getTaskDetail(taskId: string) {
  return taskDetails[taskId] ?? null;
}

export async function getTaskProgress(taskId: string): Promise<TaskProgress | null> {
  const task = taskDetails[taskId];

  if (!task) {
    return null;
  }

  const percent =
    task.progressTotal === 0 ? 0 : Math.round((task.progressDone / task.progressTotal) * 100);

  return {
    taskId: task.id,
    status: task.status,
    percent,
    progressTotal: task.progressTotal,
    progressDone: task.progressDone,
    progressFailed: task.progressFailed,
    currentLanguage: task.currentLanguage,
    currentFile: task.currentFile,
    prUrl: task.prUrl,
  };
}

export async function getTaskPreviews(taskId: string) {
  return taskPreviews[taskId] ?? [];
}

export function getLanguageLabel(code: string) {
  const language = getLanguageByCode(code);
  return language ? `${language.name} · ${language.englishName}` : code;
}
