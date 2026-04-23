"use client";

import { useParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { scopedPath, userScopedPath } from "@/lib/vault-context";

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
 */
export function useScopedLink() {
  const params = useParams();
  const atHandle = typeof params?.atHandle === "string" ? params.atHandle : null;
  const vaultSlug = typeof params?.vaultSlug === "string" ? params.vaultSlug : null;

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
      ready: Boolean(atHandle && vaultSlug),
      link,
      userLink,
    }),
    [atHandle, vaultSlug, link, userLink],
  );
}
