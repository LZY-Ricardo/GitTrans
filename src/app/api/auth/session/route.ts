import { success } from "@/lib/api";
import { env } from "@/lib/env";
import { getCurrentSession } from "@/lib/session";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return success({
      authenticated: false,
      user: null,
      githubApp: {
        installUrl: env.GITHUB_APP_SLUG
          ? `https://github.com/apps/${env.GITHUB_APP_SLUG}/installations/new`
          : null
      }
    });
  }

  return success({
    authenticated: true,
    user: {
      id: session.user.id,
      name: session.user.name,
      githubLogin: session.user.githubLogin,
      avatarUrl: session.user.avatarUrl
    },
    githubApp: {
      installUrl: env.GITHUB_APP_SLUG
        ? `https://github.com/apps/${env.GITHUB_APP_SLUG}/installations/new`
        : null
    }
  });
}
