import { activeScopeFromMe, scopedPath, type MeResponse } from "./vault-context";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

export interface WhoamiResponse {
  key_id: string;
  key_name: string;
  scopes: string[];
  vault_id: string | null;
  trail: { id: string; name: string } | null;
}

export type Role = "owner" | "non-owner";

export async function fetchWhoami(apiKey: string): Promise<WhoamiResponse | null> {
  try {
    const res = await fetch(`${API_URL}/v1/whoami`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as WhoamiResponse;
  } catch {
    return null;
  }
}

export async function fetchMe(apiKey: string): Promise<MeResponse | null> {
  try {
    const res = await fetch(`${API_URL}/v1/me`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as MeResponse;
  } catch {
    return null;
  }
}

export function roleFromWhoami(whoami: WhoamiResponse | null): Role {
  return whoami?.trail ? "non-owner" : "owner";
}

// Accept only same-origin relative paths — `/foo`, `/foo?q=1`, `/foo#h`.
// Reject `//evil.com` (protocol-relative), `https://evil.com` (absolute),
// `/\evil.com` (some parsers normalize this to a host), or anything not
// starting with a single `/`.
export function isSafeRelativePath(p: string | null | undefined): p is string {
  if (!p) return false;
  if (p.length < 1 || p[0] !== "/") return false;
  if (p.length >= 2 && (p[1] === "/" || p[1] === "\\")) return false;
  return true;
}

/**
 * Default landing for a role when `/v1/me` hasn't been fetched yet. Owners
 * go to the bare `/dashboard` shim which 301s to their MRU vault; trail
 * users go to `/home`. Prefer `landingPathForUser` when /v1/me is already
 * in hand, so we can skip the shim hop.
 */
export function landingPathForRole(role: Role): string {
  return role === "owner" ? "/dashboard" : "/home";
}

/**
 * Landing path that already knows the user's MRU vault. Saves one redirect
 * hop through the bare-route shim by going straight to
 * `/@<handle>/<slug>/dashboard`. Falls back to the bare role default when
 * /v1/me is missing or the user has no vaults yet.
 */
export function landingPathForUser(role: Role, me: MeResponse | null): string {
  if (role === "non-owner") return "/home";
  const scope = activeScopeFromMe(me);
  if (!scope) return "/dashboard";
  return scopedPath(scope.handle, scope.slug, "/dashboard");
}

export function resolveLandingPath(role: Role, requested: string | null | undefined): string {
  if (isSafeRelativePath(requested)) return requested;
  return landingPathForRole(role);
}

/**
 * Same as `resolveLandingPath` but prefers the scoped landing when /v1/me
 * is available. Explicit ?redirect=/foo still wins when safe — a user who
 * asked for /profile gets /profile (which itself 301s to scoped).
 */
export function resolveLandingPathForUser(
  role: Role,
  requested: string | null | undefined,
  me: MeResponse | null,
): string {
  if (isSafeRelativePath(requested)) return requested;
  return landingPathForUser(role, me);
}
