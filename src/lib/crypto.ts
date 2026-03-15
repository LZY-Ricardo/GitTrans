import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { env } from "@/lib/env";

function deriveKey(secret: string) {
  return createHash("sha256").update(secret).digest();
}

export function encryptText(plainText: string) {
  const iv = randomBytes(12);
  const key = deriveKey(env.APP_ENCRYPTION_KEY);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptText(cipherText: string) {
  const raw = Buffer.from(cipherText, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const key = deriveKey(env.APP_ENCRYPTION_KEY);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function hashToken(token: string) {
  return createHash("sha256").update(`${token}:${env.SESSION_SECRET}`).digest("hex");
}
