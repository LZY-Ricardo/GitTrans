import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

import { AppError } from "@/lib/errors";
import { hashToken } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "gittrans_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export async function createSession(userId: string) {
  const plainToken = randomUUID();
  const tokenHash = hashToken(plainToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return {
    plainToken,
    expiresAt,
  };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const tokenHash = hashToken(sessionToken);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          githubAccount: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => null);
    await clearSessionCookie();
    return null;
  }

  return session;
}

export async function requireCurrentUser() {
  const session = await getCurrentSession();

  if (!session) {
    throw new AppError("UNAUTHORIZED", 401, "未登录或登录已失效");
  }

  return session.user;
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    const tokenHash = hashToken(sessionToken);
    await prisma.session.deleteMany({ where: { tokenHash } });
  }

  await clearSessionCookie();
}
