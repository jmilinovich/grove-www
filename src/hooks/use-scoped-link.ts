"use client";

import { useParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { scopedPath } from "@/lib/vault-context";

/**
 * Derive the current `{atHandle, vaultSlug}` from Next.js route params and
 * expose a `link(subPath)` helper that builds `/@<handle>/<slug><subPath>`
 * without hardcoding either segment. Components that live inside the
 * `(resident)/[atHandle]/[vaultSlug]/...` tree use this so their internal
 * links follow the current scope — no lookups or window-global reads.
 *
 * If params are missing (component is rendered outside the scope, e.g. a
 * bare redirect shim or /home), `link(...)` returns the un-scoped subPath
 * as a graceful fallback — callers can also read `ready` to branch
 * explicitly when they need a hard guarantee.
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

  return useMemo(
    () => ({
      atHandle,
      vaultSlug,
      ready: Boolean(atHandle && vaultSlug),
      link,
    }),
    [atHandle, vaultSlug, link],
  );
}
