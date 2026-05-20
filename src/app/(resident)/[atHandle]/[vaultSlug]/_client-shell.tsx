"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useBacklogPolling } from "@/lib/use-backlog-polling";
import {
  useKeyboardShortcuts,
  type ShortcutBinding,
} from "@/lib/use-keyboard-shortcuts";
import { NeedsReviewList } from "@/components/backlog/needs-review-list";
import { BacklogList } from "@/components/backlog/backlog-list";
import type { BacklogPayload, Skill } from "@/lib/grove-api.v2.types";
import { RefineModal } from "@/components/task/refine-modal";
import {
  runTask,
  deferTask,
  dismissTask,
} from "./_actions/tasks";
import {
  applyReviewTask,
  refineReviewTask,
  dismissReviewTask,
} from "./_actions/review";

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
          // refine modal, etc.) lands alongside W3-SHORT-1.
          // Lists already own their own Esc semantics where they need
          // them (e.g. CapacityStrip collapses its panel on Esc).
          // The refine modal on this page binds Esc to its own dialog
          // root, so it handles its own dismiss.
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
// Bridge from the server-rendered page to the two client lists. Owns:
//  - Task-domain action wrappers (run / defer / dismiss) that call into
//    `_actions/tasks.ts` Server Actions with the vaultSlug closed over.
//  - Review-domain action wrappers (apply / refine / dismiss) that call
//    into `_actions/review.ts`. The refine modal lives at this layer so
//    the compact NeedsReviewList rows don't have to host their own
//    dialog.

export interface BacklogIslandProps {
  data: BacklogPayload;
  vaultSlug: string;
  seeAllReviewHref: string;
}

export function BacklogIsland({
  data,
  vaultSlug,
  seeAllReviewHref,
}: BacklogIslandProps) {
  const skillsBySlug = useMemo<Record<string, Skill>>(() => {
    return Object.fromEntries(data.skills.map((s) => [s.slug, s]));
  }, [data.skills]);

  // ─── Modal state ────────────────────────────────────────────────
  // `refineForTaskId` holds the id of the review task the refine modal
  // is collecting input for; null means closed.
  const [refineForTaskId, setRefineForTaskId] = useState<string | null>(null);

  // ─── Task-domain handlers ───────────────────────────────────────
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
  const handleOpen = (taskId: string) => {
    // eslint-disable-next-line no-console
    console.log("open task", taskId, "— wires up in W3-TASK-1");
  };

  // ─── Review-domain handlers ─────────────────────────────────────
  // Decision-backed tasks flow through `applyReviewTask(taskId, optionId)`;
  // refine routes to `refineReviewTask(taskId, refinement)`; dismiss
  // routes to `dismissReviewTask(taskId)`. The legacy verb-shape path
  // was retired in C-INBOX-1 after M-INBOX-1 mass-dismissed the prod
  // legacy queue.

  const handleApplyOption = useCallback(
    (taskId: string, optionId: string) => {
      void applyReviewTask(taskId, optionId, vaultSlug).catch(
        (err: unknown) => {
          // eslint-disable-next-line no-console
          console.error("applyReviewTask failed", err);
        },
      );
    },
    [vaultSlug],
  );

  const handleRefine = useCallback((taskId: string) => {
    setRefineForTaskId(taskId);
  }, []);

  const handleRefineSubmit = useCallback(
    (refinement: string) => {
      const taskId = refineForTaskId;
      if (!taskId) return;
      void refineReviewTask(taskId, refinement, vaultSlug).catch(
        (err: unknown) => {
          // eslint-disable-next-line no-console
          console.error("refineReviewTask failed", err);
        },
      );
      setRefineForTaskId(null);
    },
    [refineForTaskId, vaultSlug],
  );

  const handleReviewDismiss = useCallback(
    (taskId: string) => {
      void dismissReviewTask(taskId, vaultSlug).catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.error("dismissReviewTask failed", err);
      });
    },
    [vaultSlug],
  );

  return (
    <>
      <NeedsReviewList
        reviewTasks={data.reviewTasks}
        skillsBySlug={skillsBySlug}
        seeAllHref={seeAllReviewHref}
        onApplyOption={handleApplyOption}
        onRefine={handleRefine}
        onDismiss={handleReviewDismiss}
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
      {refineForTaskId ? (
        <RefineModal
          onSubmit={handleRefineSubmit}
          onCancel={() => setRefineForTaskId(null)}
        />
      ) : null}
    </>
  );
}
