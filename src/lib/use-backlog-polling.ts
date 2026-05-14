"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageVisibility } from "./use-page-visibility";

const DEFAULT_INTERVAL_MS = 15_000;

/**
 * Side-effect hook that calls `router.refresh()` every `intervalMs`
 * (default 15s) while the page is visible. Pauses when the tab is
 * hidden; resumes as soon as visibility is regained.
 *
 * Intended for the resident backlog list — keeps task/skill state
 * fresh against the upstream Grove API without burning cycles in
 * background tabs.
 *
 * Returns nothing. Mount once per page.
 */
export function useBacklogPolling(opts?: { intervalMs?: number }): void {
  const intervalMs =
    typeof opts?.intervalMs === "number" && opts.intervalMs > 0
      ? opts.intervalMs
      : DEFAULT_INTERVAL_MS;
  const visible = usePageVisibility();
  const router = useRouter();

  useEffect(() => {
    if (!visible) return;

    const handle = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => {
      clearInterval(handle);
    };
  }, [visible, intervalMs, router]);
}
