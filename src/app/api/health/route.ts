import { success } from "@/lib/api";
import { hasGitHubAppConfig, hasOpenRouterConfig } from "@/lib/env";

export async function GET() {
  return success({
    status: "ok",
    integrations: {
      githubConfigured: hasGitHubAppConfig(),
      openRouterConfigured: hasOpenRouterConfig()
    }
  });
}
