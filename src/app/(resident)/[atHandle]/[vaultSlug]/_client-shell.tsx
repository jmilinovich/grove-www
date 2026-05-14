"use client";

import { useMemo, type ReactNode } from "react";
import { useBacklogPolling } from "@/lib/use-backlog-polling";
import {
  useKeyboardShortcuts,
  type ShortcutBinding,
} from "@/lib/use-keyboard-shortcuts";
import { NeedsReviewList } from "@/components/backlog/needs-review-list";
import { BacklogList } from "@/components/backlog/backlog-list";
import type { BacklogPayload, Skill } from "@/lib/grove-api.v2.types";
import {
  runTask,
  deferTask,
  dismissTask,
} from "./_actions/tasks";

// Client-island boundary for the v2 vault homepage (W1-ROUTE-1 + W2-PAGE-1).
//
// The parent `page.tsx` is a server component (per PLAN D + Architect
// panel decision). This shell wraps the server-rendered tree and is the
// single mount point for cross-cutting client behavior:
//
//  - `useBacklogPolling()` refreshes RSC data every 15s while visible,
//    pausing on tab hide.
//  - `useKeyboardShortcuts([...])` registers the global, page-level
//    shortcuts. Per D-15a, per-row keymaps live on the parent list
//    components (NeedsReviewList / BacklogList), so this shell only
//    binds the truly global keys — `⌘/` (cheatsheet) and `Esc`
//    (modal-dismiss tree). Both are placeholders in W2; the cheatsheet
//    sheet itself ships in W3-SHORT-1.
//
// The shell also exports a `<BacklogIsland />` client component that
// owns the action-handler wrappers around the Server Actions. The page
// passes raw data to the island; the island wires onRun/onDefer/onDismiss
// to `runTask`/`deferTask`/`dismissTask` with the vaultSlug closed over,
// and renders <NeedsReviewList /> and <BacklogList /> as a single
// client-rendered subtree. Review-domain actions (confirm-durable,
// refine, mark-stale) are W3-REVIEW-1; in W2 they log a stub so the
// keymap binds and the UI is exercisable end-to-end.

interface ClientShellProps {
  children: ReactNode;
}

export default function ClientShell({ children }: ClientShellProps) {
  useBacklogPolling({ intervalMs: 15000 });

  const shortcuts = useMemo<ShortcutBinding[]>(
    () => [
      {
        key: "⌘/",
        description: "Show keyboard shortcuts cheatsheet",
        handler: () => {
          // Placeholder — W3-SHORT-1 wires the real cheatsheet sheet.
          // Until then the binding still exists so the keymap surfaces
          // in browser muscle memory and the W3 swap is purely a UI
          // change (the wiring is already done).
          // eslint-disable-next-line no-console
          console.log("shortcuts cheatsheet coming in W3");
        },
        preventDefault: true,
      },
      {
        key: "Esc",
        description: "Dismiss open modal / overlay",
        handler: () => {
          // No-op stub. The real modal-dismiss tree (cheatsheet sheet,
          // refine modal, etc.) lands alongside W3-SHORT-1 + W3-REVIEW-1.
          // Lists already own their own Esc semantics where they need
          // them (e.g. CapacityStrip collapses its panel on Esc).
        },
      },
    ],
    [],
  );

  useKeyboardShortcuts(shortcuts);

  return <>{children}</>;
}

// ─── BacklogIsland ────────────────────────────────────────────────────
//
// Bridge from the server-rendered page to the two client lists. Lives
// here (in `_client-shell.tsx`) so the W2-PAGE-1 lane stays a one-file
// edit — both the global shortcuts and the action wrappers are
// page-level client concerns, and giving them their own file would
// double the import surface for very little structural gain. If
// W3-REVIEW-1 grows the review-side handlers materially, this island
// is the natural extraction point.

export interface BacklogIslandProps {
  data: BacklogPayload;
  vaultSlug: string;
}

export function BacklogIsland({ data, vaultSlug }: BacklogIslandProps) {
  const skillsBySlug = useMemo<Record<string, Skill>>(() => {
    return Object.fromEntries(data.skills.map((s) => [s.slug, s]));
  }, [data.skills]);

  // Task-domain handlers. Each wrapper closes over `vaultSlug` and
  // fires the Server Action without awaiting — the list APIs are
  // synchronous-looking (onRun(id): void). On error we just log; a
  // proper <Toast /> + useOptimistic revert is W2-ACTIONS. For now
  // any error is visible in the console and the next 15s poll will
  // reconcile UI state from the server.
  //
  // `deferTask` takes a `until` ISO timestamp. The lists don't yet
  // have a picker (W2-PAGE-1 is composition-only), so we hard-code a
  // 2-weeks-out value matching the W2 PR description. W3-FAIL-1 / the
  // proper defer UI replaces this with a real selector.
  const handleRun = (taskId: string) => {
    void runTask(taskId, vaultSlug).catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error("runTask failed", err);
    });
  };
  const handleDefer = (taskId: string) => {
    void deferTask(taskId, "2026-06-01", vaultSlug).catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error("deferTask failed", err);
    });
  };
  const handleDismiss = (taskId: string) => {
    void dismissTask(taskId, vaultSlug).catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error("dismissTask failed", err);
    });
  };
  // `onOpen` is the navigate-to-detail handler. W3-TASK-1 owns the
  // task detail route; until then we log so the keymap binding (Enter
  // in BacklogList) doesn't silently drop on the floor.
  const handleOpen = (taskId: string) => {
    // eslint-disable-next-line no-console
    console.log("open task", taskId, "— wires up in W3-TASK-1");
  };

  // Review-domain handlers — W3-REVIEW-1 will replace these stubs with
  // calls into `_actions/review.ts`. They log here so the
  // `c / r / x / s` keymap binds cleanly and the review surface is
  // visually exercisable end-to-end in W2.
  const handleConfirmDurable = (taskId: string) => {
    // eslint-disable-next-line no-console
    console.log("confirm-durable", taskId, "— wires up in W3-REVIEW-1");
  };
  const handleRefine = (taskId: string) => {
    // eslint-disable-next-line no-console
    console.log("refine", taskId, "— wires up in W3-REVIEW-1");
  };
  const handleReviewDismiss = (taskId: string) => {
    // eslint-disable-next-line no-console
    console.log("review-dismiss", taskId, "— wires up in W3-REVIEW-1");
  };
  const handleMarkStale = (taskId: string) => {
    // eslint-disable-next-line no-console
    console.log("mark-stale", taskId, "— wires up in W3-REVIEW-1");
  };

  return (
    <>
      <NeedsReviewList
        reviewTasks={data.reviewTasks}
        skillsBySlug={skillsBySlug}
        onConfirmDurable={handleConfirmDurable}
        onRefine={handleRefine}
        onDismiss={handleReviewDismiss}
        onMarkStale={handleMarkStale}
      />
      <BacklogList
        pendingTasks={data.pendingTasks}
        clearedTasks={data.clearedTasks}
        skillsBySlug={skillsBySlug}
        onRun={handleRun}
        onDefer={handleDefer}
        onDismiss={handleDismiss}
        onOpen={handleOpen}
      />
    </>
  );
}
