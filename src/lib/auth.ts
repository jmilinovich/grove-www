import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const DEV_SECRET = "grove-dev-secret-do-not-use-in-production";

function getSecret(): Buffer {
  const raw = process.env.AUTH_SECRET ?? DEV_SECRET;
  return createHash("sha256").update(raw).digest();
}

export function encryptKey(key: string): string {
  const secret = getSecret();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secret, iv);
  const encrypted = Buffer.concat([cipher.update(key, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // iv (12) + tag (16) + ciphertext
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptKey(encoded: string): string {
  const secret = getSecret();
  const buf = Buffer.from(encoded, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", secret, iv);
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext) + decipher.final("utf8");
}

export function getApiKey(cookies: { get: (name: string) => { value: string } | undefined }): string | null {
  const cookie = cookies.get("grove_token");
  if (!cookie?.value) return null;
  try {
    return decryptKey(cookie.value);
  } catch {
    return null;
  }
}
