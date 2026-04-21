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

export function landingPathForRole(role: Role): string {
  return role === "owner" ? "/dashboard" : "/home";
}

export function resolveLandingPath(role: Role, requested: string | null | undefined): string {
  if (isSafeRelativePath(requested)) return requested;
  return landingPathForRole(role);
}
