import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextResponse } from "next/server";
import {
  HOST_COOKIE_NAME,
  LEGACY_COOKIE_NAME,
  activeSessionCookieName,
  canUseHostPrefix,
  clearSessionCookies,
  getSessionCookie,
  setSessionCookie,
} from "@/lib/session-cookie";

function jar(values: Record<string, string>) {
  return {
    get(name: string) {
      const v = values[name];
      return v === undefined ? undefined : { value: v };
    },
  };
}

describe("getSessionCookie dual-read", () => {
  it("prefers __Host- when both are set", () => {
    const got = getSessionCookie(jar({ [HOST_COOKIE_NAME]: "new", [LEGACY_COOKIE_NAME]: "old" }));
    expect(got).toEqual({ name: HOST_COOKIE_NAME, value: "new" });
  });

  it("falls back to legacy when only legacy is set", () => {
    const got = getSessionCookie(jar({ [LEGACY_COOKIE_NAME]: "legacy" }));
    expect(got).toEqual({ name: LEGACY_COOKIE_NAME, value: "legacy" });
  });

  it("returns null when neither cookie is set", () => {
    expect(getSessionCookie(jar({}))).toBeNull();
  });
});

describe("setSessionCookie", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVercel = process.env.VERCEL;

  beforeEach(() => {
    delete process.env.VERCEL;
  });

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
    if (originalVercel === undefined) {
      delete process.env.VERCEL;
    } else {
      process.env.VERCEL = originalVercel;
    }
  });

  it("uses __Host- prefix and Secure in production, also clears legacy", () => {
    (process.env as Record<string, string>).NODE_ENV = "production";
    expect(canUseHostPrefix()).toBe(true);
    expect(activeSessionCookieName()).toBe(HOST_COOKIE_NAME);

    const res = NextResponse.json({ ok: true });
    setSessionCookie(res, "ENCRYPTED");

    const setCookies = res.headers.getSetCookie?.() ?? [res.headers.get("set-cookie") ?? ""];
    const joined = setCookies.join("\n");

    expect(joined).toContain(`${HOST_COOKIE_NAME}=ENCRYPTED`);
    expect(joined).toContain("Secure");
    expect(joined).toContain("SameSite=strict");
    expect(joined).toContain("Path=/");
    expect(joined).not.toMatch(/Domain=/i);
    // Legacy cookie should be cleared in the same response.
    expect(joined).toMatch(new RegExp(`${LEGACY_COOKIE_NAME}=;`));
  });

  it("falls back to legacy cookie name in dev (no HTTPS)", () => {
    (process.env as Record<string, string>).NODE_ENV = "development";
    expect(canUseHostPrefix()).toBe(false);
    expect(activeSessionCookieName()).toBe(LEGACY_COOKIE_NAME);

    const res = NextResponse.json({ ok: true });
    setSessionCookie(res, "ENCRYPTED");

    const setCookies = res.headers.getSetCookie?.() ?? [res.headers.get("set-cookie") ?? ""];
    const joined = setCookies.join("\n");
    expect(joined).toContain(`${LEGACY_COOKIE_NAME}=ENCRYPTED`);
    expect(joined).not.toContain(HOST_COOKIE_NAME);
    // Dev: no Secure flag (HTTPS not available).
    expect(joined).not.toContain("Secure");
  });
});

describe("clearSessionCookies", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
  });

  it("clears both cookies in production", () => {
    (process.env as Record<string, string>).NODE_ENV = "production";
    const res = NextResponse.json({ ok: true });
    clearSessionCookies(res);
    const setCookies = res.headers.getSetCookie?.() ?? [res.headers.get("set-cookie") ?? ""];
    const joined = setCookies.join("\n");
    expect(joined).toMatch(new RegExp(`${HOST_COOKIE_NAME}=;`));
    expect(joined).toMatch(new RegExp(`${LEGACY_COOKIE_NAME}=;`));
  });
});
