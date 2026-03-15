import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { buildGitHubUserAuthorizationUrl } from "@/modules/github/github-service";

const STATE_COOKIE = "gittrans_oauth_state";

export async function GET() {
  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10
  });

  return NextResponse.redirect(buildGitHubUserAuthorizationUrl(state));
}
