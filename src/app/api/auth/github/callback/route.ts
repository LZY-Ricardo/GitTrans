import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { signInWithGitHubCode } from "@/modules/auth/auth-service";

const STATE_COOKIE = "gittrans_oauth_state";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/?error=github_auth_failed", request.url));
  }

  await signInWithGitHubCode(code);
  cookieStore.delete(STATE_COOKIE);

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
