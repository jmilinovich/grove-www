"use client";

import { useParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  activeScopeFromMe,
  scopedPath,
  userScopedPath,
} from "@/lib/vault-context";
import { useMe } from "@/contexts/me-context";

/**
 * Derive the current `{atHandle, vaultSlug}` from Next.js route params and
 * expose link helpers that build scoped URLs without hardcoding segments.
 *
 * - `link(subPath)` → `/@<handle>/<slug><subPath>` (vault-scoped; needs both
 *   segments; falls back to the un-scoped `subPath` when outside the scope).
 * - `userLink(subPath)` → `/@<handle><subPath>` (user-scoped; needs only the
 *   handle; falls back to `subPath` when outside any scope). Added in P8-B6
 *   for pages hoisted out of the `[vaultSlug]` subtree (profile,
 *   settings/vaults, …).
 *
 * Components that live under `(resident)/[atHandle]/[vaultSlug]/...` use
 * `link()` for internal nav. Components that need to point at a user-scoped
 * page regardless of whether a vault is in the current URL use `userLink()`.
 *
 * **Effective vault slug** — the `[atHandle]/[...path]` catch-all handles
 * both legacy unscoped paths (`/@jm/Resources/...`) and vault-scoped
 * paths (`/@jm/test-vault/Resources/...`). On the scoped variant the
 * slug lives in `params.path[0]`, not `params.vaultSlug`, so client
 * components reading only `params.vaultSlug` would drop the scope and
 * rebuild links without it. Check `params.path[0]` against the viewer's
 * vaults list (via `useMe`) to recover the slug and keep every
 * downstream link in-scope.
 */
export function useScopedLink() {
  const params = useParams();
  const { me } = useMe();
  const atHandle = typeof params?.atHandle === "string" ? params.atHandle : null;
  const directSlug =
    typeof params?.vaultSlug === "string" ? params.vaultSlug : null;
  const rawPath = params?.path;
  const pathArr = Array.isArray(rawPath) ? (rawPath as string[]) : [];
  const firstSegment = pathArr[0]
    ? (() => {
        try {
          return decodeURIComponent(pathArr[0]);
        } catch {
          return pathArr[0];
        }
      })()
    : null;
  const vaultSlug = useMemo(() => {
    if (directSlug) return directSlug;
    if (
      firstSegment &&
      me?.vaults?.some((v) => v.slug === firstSegment)
    ) {
      return firstSegment;
    }
    return null;
  }, [directSlug, firstSegment, me]);

  // `vaultSlug` is null on genuinely user-scoped routes (profile,
  // settings/vaults, public share pages). Components that need *some*
  // vault to build links (sidebar, header icons) fall back to the
  // viewer's MRU vault so they stay useful instead of emitting
  // un-scoped `/@<handle>/<folder>` links that drop through the
  // legacy catch-all.
  const fallbackSlug = useMemo(() => {
    if (vaultSlug) return vaultSlug;
    return activeScopeFromMe(me ?? null)?.slug ?? null;
  }, [vaultSlug, me]);

  const link = useCallback(
    (subPath: string) => {
      if (!atHandle || !vaultSlug) return subPath;
      return scopedPath(atHandle, vaultSlug, subPath);
    },
    [atHandle, vaultSlug],
  );

  const userLink = useCallback(
    (subPath: string) => {
      if (!atHandle) return subPath;
      return userScopedPath(atHandle, subPath);
    },
    [atHandle],
  );

  return useMemo(
    () => ({
      atHandle,
      vaultSlug,
      /**
       * MRU vault slug to use when the current route isn't vault-scoped
       * (profile, settings/vaults, public share). Same as `vaultSlug`
       * when the URL already has a scope. Consumers that render chrome
       * (sidebar, header icons) should prefer this so they never emit
       * un-scoped `/@<handle>/<folder>` links.
       */
      fallbackSlug,
      ready: Boolean(atHandle && vaultSlug),
      link,
      userLink,
    }),
    [atHandle, vaultSlug, fallbackSlug, link, userLink],
  );
}
