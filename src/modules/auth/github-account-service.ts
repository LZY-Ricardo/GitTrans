import { decryptText } from "@/lib/crypto";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function getUserGitHubAccessToken(userId: string) {
  const account = await prisma.gitHubAccount.findUnique({
    where: { userId },
  });

  if (!account?.encryptedAccessToken) {
    throw new AppError("GITHUB_ACCOUNT_MISSING", 403, "当前用户未绑定 GitHub 账号");
  }

  return decryptText(account.encryptedAccessToken);
}
