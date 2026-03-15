// @ts-nocheck
import { App, Octokit } from "octokit";
import { createHmac, timingSafeEqual } from "node:crypto";

import { AppError } from "@/lib/errors";
import { env, hasGitHubAppConfig, hasGitHubWebhookConfig } from "@/lib/env";
import { logger } from "@/lib/logger";
import { normalizePath } from "@/lib/paths";

type GitHubUser = {
  id: string;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
};

type TokenExchangeResult = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  refreshTokenExpiresAt?: Date;
};

type RepositoryTreeItem = {
  path: string;
  type: "file" | "dir";
};

let appInstance: App | null = null;

function requireGitHubConfig() {
  if (!hasGitHubAppConfig()) {
    throw new AppError("GITHUB_NOT_CONFIGURED", 503, "GitHub App 尚未配置");
  }
}

export function getGitHubApp() {
  requireGitHubConfig();

  if (!appInstance) {
    appInstance = new App({
      appId: env.GITHUB_APP_ID!,
      privateKey: env.GITHUB_APP_PRIVATE_KEY!,
      oauth: {
        clientId: env.GITHUB_APP_CLIENT_ID!,
        clientSecret: env.GITHUB_APP_CLIENT_SECRET!,
      },
      webhooks: {
        secret: env.GITHUB_WEBHOOK_SECRET ?? "disabled",
      },
    });
  }

  return appInstance;
}

export function buildGitHubUserAuthorizationUrl(state: string) {
  requireGitHubConfig();

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", env.GITHUB_APP_CLIENT_ID!);
  url.searchParams.set("redirect_uri", `${env.APP_BASE_URL}/api/auth/github/callback`);
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeCodeForUserToken(code: string): Promise<TokenExchangeResult> {
  requireGitHubConfig();

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_APP_CLIENT_ID,
      client_secret: env.GITHUB_APP_CLIENT_SECRET,
      code,
      redirect_uri: `${env.APP_BASE_URL}/api/auth/github/callback`,
    }),
  });

  if (!response.ok) {
    throw new AppError("GITHUB_TOKEN_EXCHANGE_FAILED", 502, "GitHub 登录换取令牌失败");
  }

  const data = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    refresh_token_expires_in?: number;
    error?: string;
  };

  if (!data.access_token) {
    throw new AppError(
      "GITHUB_TOKEN_EXCHANGE_FAILED",
      502,
      data.error ? `GitHub 登录失败: ${data.error}` : "GitHub 登录失败",
    );
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    refreshTokenExpiresAt: data.refresh_token_expires_in
      ? new Date(Date.now() + data.refresh_token_expires_in * 1000)
      : undefined,
  };
}

export async function getGitHubUser(userToken: string): Promise<GitHubUser> {
  const octokit = new Octokit({ auth: userToken });
  const { data } = await octokit.rest.users.getAuthenticated();

  return {
    id: String(data.id),
    login: data.login,
    name: data.name,
    email: data.email,
    avatarUrl: data.avatar_url,
  };
}

export async function listUserInstallations(userToken: string) {
  const octokit = new Octokit({ auth: userToken });
  const { data } = await octokit.request("GET /user/installations");

  return data.installations.map((installation) => {
    const account = installation.account as
      | {
          login?: string;
          slug?: string;
          name?: string;
          type?: string;
        }
      | undefined;

    return {
      installationId: String(installation.id),
      accountLogin: account?.login ?? account?.slug ?? account?.name ?? "unknown",
      accountType: account?.type ?? "Enterprise",
      repositoriesCount: installation.repository_selection === "all" ? null : null,
      installUrl: `https://github.com/apps/${installation.app_slug}/installations/${installation.id}`,
    };
  });
}

export async function getInstallationOctokit(installationId: string) {
  const app = getGitHubApp();
  return app.getInstallationOctokit(Number(installationId));
}

export async function listInstallationRepositories(options: {
  installationId: string;
  page: number;
  pageSize: number;
  query?: string;
}) {
  const octokit = await getInstallationOctokit(options.installationId);
  const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({
    per_page: Math.min(options.pageSize, 100),
    page: options.page,
  });

  const query = options.query?.trim().toLowerCase();

  const items = data.repositories
    .filter((repository) => {
      if (!query) {
        return true;
      }

      return repository.full_name.toLowerCase().includes(query);
    })
    .map((repository) => ({
      githubRepoId: String(repository.id),
      owner: repository.owner.login,
      name: repository.name,
      fullName: repository.full_name,
      defaultBranch: repository.default_branch,
      private: repository.private,
    }));

  return {
    items,
    total: data.total_count,
  };
}

export async function getRepositoryByFullName(options: {
  installationId: string;
  owner: string;
  repo: string;
}) {
  const octokit = await getInstallationOctokit(options.installationId);
  const { data } = await octokit.rest.repos.get({
    owner: options.owner,
    repo: options.repo,
  });

  return {
    githubRepoId: String(data.id),
    owner: data.owner.login,
    name: data.name,
    fullName: data.full_name,
    defaultBranch: data.default_branch,
    private: data.private,
  };
}

export async function getBranchHead(options: {
  installationId: string;
  owner: string;
  repo: string;
  branch: string;
}) {
  const octokit = await getInstallationOctokit(options.installationId);
  const { data } = await octokit.rest.repos.getBranch({
    owner: options.owner,
    repo: options.repo,
    branch: options.branch,
  });

  return {
    sha: data.commit.sha,
    treeSha: data.commit.commit.tree.sha,
  };
}

async function walkRepositoryContents(options: {
  installationId: string;
  owner: string;
  repo: string;
  ref: string;
  path?: string;
}): Promise<RepositoryTreeItem[]> {
  const octokit = await getInstallationOctokit(options.installationId);
  const { data } = await octokit.rest.repos.getContent({
    owner: options.owner,
    repo: options.repo,
    path: options.path ?? "",
    ref: options.ref,
  });

  if (!Array.isArray(data)) {
    return [];
  }

  const results: RepositoryTreeItem[] = [];

  for (const item of data) {
    if (item.type === "dir") {
      results.push({ path: normalizePath(item.path), type: "dir" });
      const childItems = await walkRepositoryContents({
        ...options,
        path: item.path,
      });
      results.push(...childItems);
    }

    if (item.type === "file") {
      results.push({ path: normalizePath(item.path), type: "file" });
    }
  }

  return results;
}

export async function getRepositoryTree(options: {
  installationId: string;
  owner: string;
  repo: string;
  ref: string;
}) {
  const octokit = await getInstallationOctokit(options.installationId);
  const branch = await getBranchHead({
    installationId: options.installationId,
    owner: options.owner,
    repo: options.repo,
    branch: options.ref,
  });
  const tree = await octokit.rest.git.getTree({
    owner: options.owner,
    repo: options.repo,
    tree_sha: branch.treeSha,
    recursive: "true",
  });

  if (tree.data.truncated) {
    logger.warn(
      { repo: `${options.owner}/${options.repo}`, ref: options.ref },
      "Git tree response truncated, falling back to contents walk",
    );
    return walkRepositoryContents(options);
  }

  return tree.data.tree
    .filter((item) => Boolean(item.path))
    .map((item) => ({
      path: normalizePath(item.path!),
      type: item.type === "tree" ? "dir" : "file",
    })) as RepositoryTreeItem[];
}

export async function getFileContent(options: {
  installationId: string;
  owner: string;
  repo: string;
  path: string;
  ref: string;
}) {
  const octokit = await getInstallationOctokit(options.installationId);
  const response = await octokit.request(
    "GET /repos/{owner}/{repo}/contents/{path}",
    {
      owner: options.owner,
      repo: options.repo,
      path: options.path,
      ref: options.ref,
      mediaType: {
        format: "raw",
      },
    },
  );

  return typeof response.data === "string"
    ? response.data
    : Buffer.from((response.data as { content: string }).content, "base64").toString("utf8");
}

export async function compareCommits(options: {
  installationId: string;
  owner: string;
  repo: string;
  base: string;
  head: string;
}) {
  const octokit = await getInstallationOctokit(options.installationId);
  const { data } = await octokit.rest.repos.compareCommitsWithBasehead({
    owner: options.owner,
    repo: options.repo,
    basehead: `${options.base}...${options.head}`,
  });

  return {
    aheadBy: data.ahead_by,
    files:
      data.files?.map((file) => ({
        path: normalizePath(file.filename),
        status: file.status ?? "modified",
      })) ?? [],
  };
}

export async function commitFilesToBranch(options: {
  installationId: string;
  owner: string;
  repo: string;
  baseBranch: string;
  targetBranch: string;
  commitMessage: string;
  files: Array<{ path: string; content?: string; delete?: boolean }>;
}) {
  const octokit = await getInstallationOctokit(options.installationId);
  const targetRef = `heads/${options.targetBranch}`;
  const baseRef = `heads/${options.baseBranch}`;

  let refData;
  let targetExists = true;

  try {
    const { data } = await octokit.rest.git.getRef({
      owner: options.owner,
      repo: options.repo,
      ref: targetRef,
    });
    refData = data;
  } catch {
    targetExists = false;
    const { data } = await octokit.rest.git.getRef({
      owner: options.owner,
      repo: options.repo,
      ref: baseRef,
    });
    refData = data;
  }

  const { data: baseCommit } = await octokit.rest.git.getCommit({
    owner: options.owner,
    repo: options.repo,
    commit_sha: refData.object.sha,
  });

  const treeEntries = await Promise.all(
    options.files.map(async (file) => {
      if (file.delete) {
        return {
          path: normalizePath(file.path),
          mode: "100644" as const,
          type: "blob" as const,
          sha: null,
        };
      }

      const blob = await octokit.rest.git.createBlob({
        owner: options.owner,
        repo: options.repo,
        content: file.content ?? "",
        encoding: "utf-8",
      });

      return {
        path: normalizePath(file.path),
        mode: "100644" as const,
        type: "blob" as const,
        sha: blob.data.sha,
      };
    }),
  );

  const newTree = await octokit.rest.git.createTree({
    owner: options.owner,
    repo: options.repo,
    base_tree: baseCommit.tree.sha,
    tree: treeEntries,
  });

  const newCommit = await octokit.rest.git.createCommit({
    owner: options.owner,
    repo: options.repo,
    message: options.commitMessage,
    tree: newTree.data.sha,
    parents: [refData.object.sha],
  });

  if (targetExists) {
    await octokit.rest.git.updateRef({
      owner: options.owner,
      repo: options.repo,
      ref: targetRef,
      sha: newCommit.data.sha,
    });
  } else {
    await octokit.rest.git.createRef({
      owner: options.owner,
      repo: options.repo,
      ref: `refs/${targetRef}`,
      sha: newCommit.data.sha,
    });
  }

  return {
    commitSha: newCommit.data.sha,
  };
}

export async function upsertPullRequest(options: {
  installationId: string;
  owner: string;
  repo: string;
  baseBranch: string;
  headBranch: string;
  title: string;
  body: string;
}) {
  const octokit = await getInstallationOctokit(options.installationId);
  const openPulls = await octokit.rest.pulls.list({
    owner: options.owner,
    repo: options.repo,
    state: "open",
    base: options.baseBranch,
    head: `${options.owner}:${options.headBranch}`,
    per_page: 1,
  });

  if (openPulls.data[0]) {
    const pr = openPulls.data[0];
    const { data } = await octokit.rest.pulls.update({
      owner: options.owner,
      repo: options.repo,
      pull_number: pr.number,
      title: options.title,
      body: options.body,
    });

    return {
      number: data.number,
      url: data.html_url,
      state: data.state,
    };
  }

  const { data } = await octokit.rest.pulls.create({
    owner: options.owner,
    repo: options.repo,
    title: options.title,
    body: options.body,
    base: options.baseBranch,
    head: options.headBranch,
  });

  return {
    number: data.number,
    url: data.html_url,
    state: data.state,
  };
}

export function verifyWebhookSignature(payload: string, signatureHeader?: string) {
  if (!hasGitHubWebhookConfig()) {
    throw new AppError("GITHUB_WEBHOOK_NOT_CONFIGURED", 503, "GitHub Webhook 尚未配置");
  }

  if (!signatureHeader) {
    return false;
  }

  const [prefix, digest] = signatureHeader.split("=");

  if (prefix !== "sha256" || !digest) {
    return false;
  }

  const expected = createHmac("sha256", env.GITHUB_WEBHOOK_SECRET!)
    .update(payload)
    .digest("hex");

  return timingSafeEqual(Buffer.from(expected), Buffer.from(digest));
}
