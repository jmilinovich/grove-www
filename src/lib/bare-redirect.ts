import { activeScopeFromMe, scopedPath, type MeResponse } from "./vault-context";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

/**
 * Resolve the viewer's MRU vault via /v1/me and return the scoped URL to
 * redirect to. Returns null when we can't resolve (no key, API down, no
 * vaults) so the caller can fall back to /login or a generic landing.
 *
 * `subPath` is the portion *after* the bare root (e.g. `/keys`). Pass `""`
 * to target the root itself (`/dashboard` → `/@handle/slug/dashboard`).
 * `search` includes the leading `?`; pass `""` when absent.
 */
export async function resolveScopedRedirect(
  apiKey: string,
  root: string,
  subPath: string,
  search: string,
): Promise<string | null> {
  let me: MeResponse | null = null;
  try {
    const res = await fetch(`${API_URL}/v1/me`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    me = (await res.json()) as MeResponse;
  } catch {
    return null;
  }
  const scope = activeScopeFromMe(me);
  if (!scope) return null;
  const tail = subPath.length === 0 || subPath.startsWith("/") ? subPath : `/${subPath}`;
  return scopedPath(scope.handle, scope.slug, `${root}${tail}`) + (search ?? "");
}
