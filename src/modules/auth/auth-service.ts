import { prisma } from "@/lib/prisma";
import { createSession, setSessionCookie } from "@/lib/session";
import { encryptText } from "@/lib/crypto";
import { exchangeCodeForUserToken, getGitHubUser } from "@/modules/github/github-service";

export async function signInWithGitHubCode(code: string) {
  const tokenData = await exchangeCodeForUserToken(code);
  const githubUser = await getGitHubUser(tokenData.accessToken);

  const user = await prisma.user.upsert({
    where: { githubLogin: githubUser.login },
    create: {
      name: githubUser.name ?? githubUser.login,
      email: githubUser.email,
      avatarUrl: githubUser.avatarUrl,
      githubLogin: githubUser.login,
      githubAccount: {
        create: {
          githubUserId: githubUser.id,
          login: githubUser.login,
          encryptedAccessToken: encryptText(tokenData.accessToken),
          encryptedRefreshToken: tokenData.refreshToken
            ? encryptText(tokenData.refreshToken)
            : null,
          accessTokenExpiresAt: tokenData.expiresAt,
          refreshTokenExpiresAt: tokenData.refreshTokenExpiresAt,
        },
      },
    },
    update: {
      name: githubUser.name ?? githubUser.login,
      email: githubUser.email,
      avatarUrl: githubUser.avatarUrl,
      githubAccount: {
        upsert: {
          create: {
            githubUserId: githubUser.id,
            login: githubUser.login,
            encryptedAccessToken: encryptText(tokenData.accessToken),
            encryptedRefreshToken: tokenData.refreshToken
              ? encryptText(tokenData.refreshToken)
              : null,
            accessTokenExpiresAt: tokenData.expiresAt,
            refreshTokenExpiresAt: tokenData.refreshTokenExpiresAt,
          },
          update: {
            githubUserId: githubUser.id,
            login: githubUser.login,
            encryptedAccessToken: encryptText(tokenData.accessToken),
            encryptedRefreshToken: tokenData.refreshToken
              ? encryptText(tokenData.refreshToken)
              : null,
            accessTokenExpiresAt: tokenData.expiresAt,
            refreshTokenExpiresAt: tokenData.refreshTokenExpiresAt,
          },
        },
      },
    },
  });

  const session = await createSession(user.id);
  await setSessionCookie(session.plainToken, session.expiresAt);

  return user;
}
