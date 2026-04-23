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
 * Normalize a handle segment to its bare form (no leading `@`, URL-decoded).
 *
 * Handles arrive in every shape callers produce:
 *   - bare:          `"jm"`          (from /v1/me.handle / .username)
 *   - with @:        `"@jm"`         (historical route-param shape)
 *   - URL-encoded:   `"%40jm"`       (Next.js 16 useParams returns this —
 *                                     it does not decode reserved chars)
 *   - doubly bad:    `"@%40jm"`      (from one round-trip through a
 *                                     broken caller; be forgiving)
 *
 * Shared by `scopedPath` and `userScopedPath` — no duplicated normalization.
 */
function normalizeHandle(raw: string): string {
  let h: string;
  try {
    h = decodeURIComponent(raw);
  } catch {
    h = raw;
  }
  // Strip any leading @s the input may already carry.
  while (h.startsWith("@")) h = h.slice(1);
  return h;
}

/**
 * Build the bare handle form (no leading `@`). Thin public wrapper around
 * `normalizeHandle` kept for callers that want the handle on its own (e.g.
 * to embed in a longer URL or show in UI chrome).
 */
export function bareHandle(handle: string): string {
  return normalizeHandle(handle);
}

function trimmedSub(subPath: string): string {
  if (subPath.length === 0) return "";
  return subPath.startsWith("/") ? subPath : `/${subPath}`;
}

export function scopedPath(handle: string, slug: string, subPath = ""): string {
  const h = normalizeHandle(handle);
  return `/@${h}/${slug}${trimmedSub(subPath)}`;
}

/**
 * Build `/@<handle><subPath>` for user-scoped pages whose underlying data is
 * the signed-in user (profile, settings/vaults, cross-vault keys, …). These
 * routes live one level up from the vault-scoped `/@<h>/<slug>/...` tree
 * because the `<slug>` segment would lie about the resource — P8-B6 hoisted
 * them out of the `[vaultSlug]` subtree.
 *
 * Pass `""` for the handle root itself.
 */
export function userScopedPath(handle: string, subPath = ""): string {
  const h = normalizeHandle(handle);
  return `/@${h}${trimmedSub(subPath)}`;
}
