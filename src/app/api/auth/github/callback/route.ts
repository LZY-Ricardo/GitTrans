import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isAppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getCurrentSession } from "@/lib/session";
import { signInWithGitHubCode } from "@/modules/auth/auth-service";

const STATE_COOKIE = "gittrans_oauth_state";

export async function GET(request: Request) {
  // The GitHub OAuth "code" is one-time. Users sometimes refresh the callback URL
  // or navigate back/forward, which would otherwise hard-fail. If the user is
  // already authenticated, we can safely continue to the dashboard.
  try {
    const existingSession = await getCurrentSession();
    if (existingSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } catch (error) {
    logger.warn({ err: error }, "Failed to read existing session in GitHub callback");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    cookieStore.delete(STATE_COOKIE);
    return NextResponse.redirect(new URL("/?error=github_auth_failed", request.url));
  }

  try {
    await signInWithGitHubCode(code);
    cookieStore.delete(STATE_COOKIE);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    logger.error({ err: error }, "GitHub OAuth callback failed");
    cookieStore.delete(STATE_COOKIE);

    const errorCode =
      isAppError(error) && error.code === "GITHUB_NETWORK_UNREACHABLE"
        ? "github_network_unreachable"
        : "github_auth_failed";

    return NextResponse.redirect(new URL(`/?error=${errorCode}`, request.url));
  }
}
