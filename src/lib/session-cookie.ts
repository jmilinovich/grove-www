/**
 * Session cookie helpers.
 *
 * `__Host-` cookies are pinned to the exact origin: they require `Secure`,
 * forbid a `Domain` attribute, and demand `Path=/`. That makes them immune
 * to subdomain shadowing, where a sibling like `staging.grove.md` could
 * otherwise plant a `grove_token` cookie that the canonical origin would
 * accept. We migrate the session cookie to the prefixed name, but read
 * both names during the rollover so existing logged-in users don't get
 * bounced to /login the first time they hit the new server.
 *
 * In dev the prefix is impossible — `Secure` requires HTTPS and Next's
 * dev server runs over HTTP — so we keep the legacy name locally.
 */

import type { NextResponse } from "next/server";

export const HOST_COOKIE_NAME = "__Host-grove_token";
export const LEGACY_COOKIE_NAME = "grove_token";

const MAX_AGE_30D = 60 * 60 * 24 * 30;

interface CookieJar {
  get(name: string): { value: string } | undefined;
}

interface SessionCookieValue {
  name: string;
  value: string;
}

/**
 * Read the session cookie, preferring the `__Host-` prefixed name and
 * falling back to the legacy name. Returns the value plus the name it
 * came from, so callers can decide whether to rewrite on the response.
 */
export function getSessionCookie(jar: CookieJar): SessionCookieValue | null {
  const host = jar.get(HOST_COOKIE_NAME);
  if (host?.value) return { name: HOST_COOKIE_NAME, value: host.value };
  const legacy = jar.get(LEGACY_COOKIE_NAME);
  if (legacy?.value) return { name: LEGACY_COOKIE_NAME, value: legacy.value };
  return null;
}

/**
 * True when the runtime can serve `__Host-` cookies. `__Host-` requires
 * `Secure` which browsers refuse to set over plain HTTP — the dev server
 * uses HTTP, so we keep the unprefixed name locally.
 */
export function canUseHostPrefix(): boolean {
  if (process.env.NODE_ENV === "production") return true;
  // Vercel preview deployments are HTTPS even though NODE_ENV !== production.
  if (process.env.VERCEL) return true;
  return false;
}

/** Name to use when *setting* a fresh session cookie. */
export function activeSessionCookieName(): string {
  return canUseHostPrefix() ? HOST_COOKIE_NAME : LEGACY_COOKIE_NAME;
}

/**
 * Set the session cookie with the appropriate name and clear the legacy
 * one. Always-on `Secure` is required when the `__Host-` prefix is in
 * play; the legacy branch keeps the existing behavior (Secure only in
 * production) so dev still works over HTTP.
 */
export function setSessionCookie(
  response: NextResponse,
  encryptedValue: string,
  maxAgeSeconds: number = MAX_AGE_30D,
): void {
  const useHost = canUseHostPrefix();
  response.cookies.set(useHost ? HOST_COOKIE_NAME : LEGACY_COOKIE_NAME, encryptedValue, {
    httpOnly: true,
    secure: useHost ? true : process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: maxAgeSeconds,
  });
  if (useHost) {
    // Migration window: stomp any pre-existing legacy cookie so the user
    // doesn't carry both forward and so a stale legacy cookie can't shadow
    // a newer __Host- value if this code path runs again.
    clearLegacyCookie(response);
  }
}

/**
 * Clear both the prefixed and legacy session cookies — used on logout
 * and any other "session ended" signal. Cookies must be cleared with
 * the same attributes they were set with, so we mirror the set flags.
 */
export function clearSessionCookies(response: NextResponse): void {
  if (canUseHostPrefix()) {
    response.cookies.set(HOST_COOKIE_NAME, "", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
  }
  clearLegacyCookie(response);
}

function clearLegacyCookie(response: NextResponse): void {
  response.cookies.set(LEGACY_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
