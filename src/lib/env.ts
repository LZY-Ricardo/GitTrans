import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z
    .string()
    .default("mysql://gittrans:gittrans@127.0.0.1:3306/gittrans"),
  APP_ENCRYPTION_KEY: z.string().default("gittrans-dev-encryption-key-change-me"),
  SESSION_SECRET: z.string().default("gittrans-dev-session-secret-change-me"),
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_APP_SLUG: z.string().optional(),
  GITHUB_APP_CLIENT_ID: z.string().optional(),
  GITHUB_APP_CLIENT_SECRET: z.string().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().optional(),
  OPENROUTER_PLATFORM_API_KEY: z.string().optional(),
  WORKER_POLL_INTERVAL_MS: z.coerce.number().default(5000),
  TASK_LOCK_TIMEOUT_MS: z.coerce.number().default(10 * 60 * 1000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

const parsed = EnvSchema.parse(process.env);

/**
 * 从 private-key.pem 文件读取 GitHub App 私钥
 */
function loadPrivateKey(): string | undefined {
  try {
    const keyPath = resolve(process.cwd(), "private-key.pem");
    const keyContent = readFileSync(keyPath, "utf-8");
    return keyContent.trim();
  } catch {
    return undefined;
  }
}

export const env = {
  ...parsed,
  GITHUB_APP_PRIVATE_KEY: loadPrivateKey(),
};

export function hasGitHubAppConfig() {
  return Boolean(
    env.GITHUB_APP_ID &&
      env.GITHUB_APP_CLIENT_ID &&
      env.GITHUB_APP_CLIENT_SECRET &&
      env.GITHUB_APP_PRIVATE_KEY,
  );
}

export function hasGitHubWebhookConfig() {
  return Boolean(hasGitHubAppConfig() && env.GITHUB_WEBHOOK_SECRET);
}

export function hasOpenRouterConfig() {
  return Boolean(env.OPENROUTER_PLATFORM_API_KEY);
}
