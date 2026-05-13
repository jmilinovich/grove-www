"use client";

import { useState, useTransition, type JSX } from "react";
import type { Task } from "@/lib/grove-api.v2.types";

// W3-FAIL-1 — FailedTaskBanner.
//
// Optional homepage strip that surfaces when one or more tasks are in
// the `failed` state. Per DESIGN.md, failure isn't urgent enough for
// harvest (the warning accent) — failure in Grove is a gentle nudge,
// not an alarm. So the banner sits in cream/earth: ink-on-surface with
// a quiet border, the language of a margin note rather than a system
// alert.
//
// Per PLAN.md W3-FAIL-1: "view" deep-links to a filtered backlog (out
// of scope for v2 — `#` placeholder per Scope Cop), "retry all" loops
// and calls the retryTask Server Action for each failed task.
//
// The action is passed in as a prop so this client component stays
// pure — it doesn't import a server-action module directly, which
// keeps it composable with whatever wraps it on the homepage (e.g.
// the page can bind vaultSlug into a closure before passing).
//
// Hidden when there are zero failed tasks. The parent is responsible
// for filtering `tasks` to just the failed ones — the banner does not
// re-filter (D-19: keep primitives dumb).

export interface FailedTaskBannerProps {
  failedTasks: Task[];
  onRetry: (taskId: string) => Promise<void>;
  /**
   * Override the deep-link target for "view". Defaults to `#` per
   * Scope Cop — the filtered-backlog route is a v2.5 surface.
   */
  viewHref?: string;
}

export function FailedTaskBanner({
  failedTasks,
  onRetry,
  viewHref = "#",
}: FailedTaskBannerProps): JSX.Element | null {
  const [isPending, startTransition] = useTransition();
  const [retryError, setRetryError] = useState<string | null>(null);

  if (failedTasks.length === 0) {
    return null;
  }

  const count = failedTasks.length;
  const noun = count === 1 ? "task" : "tasks";

  const onRetryAll = () => {
    setRetryError(null);
    startTransition(async () => {
      // Sequential rather than Promise.all — retries are user-visible
      // state changes that the backend serialises anyway. Doing them
      // in parallel against the mock works, but against a live API
      // a per-task ordering keeps optimistic UI updates legible and
      // avoids hammering the rate-limit with a burst. The list is
      // O(small) by construction (failed tasks are rare).
      for (const task of failedTasks) {
        try {
          await onRetry(task.id);
        } catch (err) {
          setRetryError(
            err instanceof Error ? err.message : "retry failed",
          );
          return;
        }
      }
    });
  };

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="failed-task-banner"
      className="bg-surface border border-surface-border rounded-md px-4 py-3 font-sans text-label text-ink/60 flex items-center justify-between gap-4"
    >
      <span className="text-earth">
        {count} {noun} failed today.
      </span>
      <span className="inline-flex items-center gap-4">
        <a
          href={viewHref}
          className="text-moss hover:text-ink transition-colors"
        >
          view
        </a>
        <span aria-hidden="true" className="text-ink/40">
          ·
        </span>
        <button
          type="button"
          onClick={onRetryAll}
          disabled={isPending}
          className="text-moss hover:text-ink transition-colors disabled:text-ink/40 disabled:cursor-not-allowed"
        >
          {isPending ? "retrying…" : "retry all"}
        </button>
      </span>
      {retryError ? (
        <span role="alert" className="sr-only">
          {retryError}
        </span>
      ) : null}
    </div>
  );
}
