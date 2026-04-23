/**
 * Vault-context helpers for the multi-vault scope (`/@<handle>/<slug>/...`).
 *
 * The grove-server `/v1/me` response carries a `vaults` array ordered by
 * `last_active_at DESC, joined_at DESC` — but SQLite sorts NULL `last_active`
 * values last in DESC order, so first-time users whose last_active is NULL
 * land on the most *recently joined* vault rather than the *earliest-joined*.
 *
 * This module re-picks the active vault in JS so we get stable, documented
 * behavior per PLAN.md P8-B3: MRU when present, else earliest-joined ASC.
 */

export interface VaultEntry {
  id: string;
  slug: string;
  name: string;
  role: "owner" | "member" | "viewer";
  owner_handle: string;
  joined_at?: string;
  last_active_at?: string | null;
}

function ts(v: string | null | undefined): number | null {
  if (!v) return null;
  const n = new Date(v).getTime();
  return Number.isFinite(n) ? n : null;
}

/**
 * Pick the active vault for a signed-in user:
 *  1. Vault with the most recent `last_active_at` (MRU).
 *  2. Fallback: vault with the *earliest* `joined_at` — first-time users
 *     land on whichever vault they joined first, not whichever sorted first
 *     by the DB's DESC ordering.
 *  3. Last resort: vaults[0] (for callers who still trust the array order).
 */
export function resolveActiveVault(vaults: VaultEntry[]): VaultEntry | null {
  if (vaults.length === 0) return null;

  const withActive = vaults
    .map((v) => ({ v, t: ts(v.last_active_at) }))
    .filter((x): x is { v: VaultEntry; t: number } => x.t !== null);
  if (withActive.length > 0) {
    withActive.sort((a, b) => b.t - a.t);
    return withActive[0].v;
  }

  const withJoin = vaults
    .map((v) => ({ v, t: ts(v.joined_at) }))
    .filter((x): x is { v: VaultEntry; t: number } => x.t !== null);
  if (withJoin.length > 0) {
    withJoin.sort((a, b) => a.t - b.t);
    return withJoin[0].v;
  }

  return vaults[0];
}

export interface MeResponse {
  handle?: string | null;
  username?: string | null;
  vaults?: VaultEntry[];
}

/**
 * Resolve `{handle, slug}` for a redirect into the scoped shell given a
 * /v1/me payload. Returns null if the user has no vaults — callers should
 * send those users to /login or a "no vault" landing instead.
 */
export function activeScopeFromMe(
  me: MeResponse | null | undefined,
): { handle: string; slug: string } | null {
  if (!me) return null;
  const vaults = me.vaults ?? [];
  const vault = resolveActiveVault(vaults);
  if (!vault) return null;
  const handle = me.handle ?? me.username ?? vault.owner_handle;
  if (!handle) return null;
  return { handle, slug: vault.slug };
}

/**
 * Build `/@<handle>/<slug><subPath>` preserving a leading slash on subPath.
 * Pass `""` for the vault root. Tolerates `handle` arriving with or without a
 * leading `@` — Next.js captures the `[atHandle]` route segment as `"@jm"`,
 * but `activeScopeFromMe` / `/v1/me` return bare `"jm"`; both are valid inputs.
 */
export function scopedPath(handle: string, slug: string, subPath = ""): string {
  const bareHandle = handle.startsWith("@") ? handle.slice(1) : handle;
  const trimmed =
    subPath.length === 0 || subPath.startsWith("/") ? subPath : `/${subPath}`;
  return `/@${bareHandle}/${slug}${trimmed}`;
}
