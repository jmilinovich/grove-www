import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getSessionCookie } from "./session-cookie";

const DEV_SECRET = "grove-dev-secret-do-not-use-in-production";

function getSecret(): Buffer {
  const raw = process.env.AUTH_SECRET;
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      // Falling back to the committed dev string in prod means anyone
      // who reads the repo can decrypt captured `grove_token` cookies
      // and recover the raw API key they wrap. Fail loudly at boot
      // instead of silently downgrading.
      throw new Error(
        "AUTH_SECRET is required in production. Refusing to fall back to the dev constant.",
      );
    }
    return createHash("sha256").update(DEV_SECRET).digest();
  }
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
  // Dual-read window: prefer the `__Host-` prefixed cookie, fall back to
  // the legacy unprefixed name so sessions issued before the rollover
  // keep working until the user re-authenticates.
  const session = getSessionCookie(cookies);
  if (!session) return null;
  try {
    return decryptKey(session.value);
  } catch {
    return null;
  }
}
