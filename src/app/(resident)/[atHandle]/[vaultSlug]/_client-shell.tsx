"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useBacklogPolling } from "@/lib/use-backlog-polling";
import {
  useKeyboardShortcuts,
  type ShortcutBinding,
} from "@/lib/use-keyboard-shortcuts";
import { NeedsReviewList } from "@/components/backlog/needs-review-list";
import { BacklogList } from "@/components/backlog/backlog-list";
import type { BacklogPayload, Skill, Task } from "@/lib/grove-api.v2.types";
import { RefineModal } from "@/components/task/refine-modal";
import { FirstWriteModal } from "@/components/task/first-write-modal";
import {
  WRITE_ARTIFACT_TYPES,
  readFirstWriteAck,
  writeFirstWriteAck,
} from "@/components/task/first-write-ack";
import {
  runTask,
  deferTask,
  dismissTask,
} from "./_actions/tasks";
import { reviewTask } from "./_actions/review";

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
          // The refine/first-write modals on this page bind Esc to
          // their own dialog root, so they handle their own dismiss.
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
//  - Review-domain action wrappers (confirm-durable / refine / dismiss /
//    mark-stale) that call into `_actions/review.ts`. The refine modal
//    and the first-write confirmation modal live at this layer so the
//    compact NeedsReviewList rows don't have to host their own dialogs.

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

  // Index by both id and slug — `Task.skillId` is the skill's id in the
  // mock fixtures, but live api.grove.md may emit either. Indexing by
  // both lets us look up safely from a review-action callback regardless
  // of which surface the upstream task came from.
  const skillsByKey = useMemo<Record<string, Skill>>(() => {
    const out: Record<string, Skill> = {};
    for (const s of data.skills) {
      out[s.id] = s;
      out[s.slug] = s;
    }
    return out;
  }, [data.skills]);

  const reviewTasksById = useMemo<Record<string, Task>>(() => {
    return Object.fromEntries(data.reviewTasks.map((t) => [t.id, t]));
  }, [data.reviewTasks]);

  // ─── Modal state ────────────────────────────────────────────────
  // `refineForTaskId` holds the id of the review task the refine modal
  // is collecting input for; null means closed. Same for first-write.
  const [refineForTaskId, setRefineForTaskId] = useState<string | null>(null);
  const [firstWriteForTaskId, setFirstWriteForTaskId] = useState<string | null>(
    null,
  );

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
  const fireConfirmDurable = useCallback(
    (taskId: string) => {
      void reviewTask(taskId, { kind: "confirm-durable" }, vaultSlug).catch(
        (err: unknown) => {
          // eslint-disable-next-line no-console
          console.error("reviewTask(confirm-durable) failed", err);
        },
      );
    },
    [vaultSlug],
  );

  const handleConfirmDurable = useCallback(
    (taskId: string) => {
      const task = reviewTasksById[taskId];
      const skill = task ? skillsByKey[task.skillId] : undefined;
      const skillKey = skill?.id ?? task?.skillId;
      const isWrite =
        task?.result != null &&
        WRITE_ARTIFACT_TYPES.has(task.result.artifact.type);
      if (isWrite && skillKey && !readFirstWriteAck(vaultSlug, skillKey)) {
        setFirstWriteForTaskId(taskId);
        return;
      }
      fireConfirmDurable(taskId);
    },
    [reviewTasksById, skillsByKey, vaultSlug, fireConfirmDurable],
  );

  const handleRefine = useCallback((taskId: string) => {
    setRefineForTaskId(taskId);
  }, []);

  const handleRefineSubmit = useCallback(
    (refinement: string) => {
      const taskId = refineForTaskId;
      if (!taskId) return;
      void reviewTask(taskId, { kind: "refine", refinement }, vaultSlug).catch(
        (err: unknown) => {
          // eslint-disable-next-line no-console
          console.error("reviewTask(refine) failed", err);
        },
      );
      setRefineForTaskId(null);
    },
    [refineForTaskId, vaultSlug],
  );

  const handleReviewDismiss = useCallback(
    (taskId: string) => {
      void reviewTask(taskId, { kind: "dismiss" }, vaultSlug).catch(
        (err: unknown) => {
          // eslint-disable-next-line no-console
          console.error("reviewTask(dismiss) failed", err);
        },
      );
    },
    [vaultSlug],
  );

  const handleMarkStale = useCallback(
    (taskId: string) => {
      void reviewTask(taskId, { kind: "mark-stale" }, vaultSlug).catch(
        (err: unknown) => {
          // eslint-disable-next-line no-console
          console.error("reviewTask(mark-stale) failed", err);
        },
      );
    },
    [vaultSlug],
  );

  const handleFirstWriteConfirm = useCallback(() => {
    const taskId = firstWriteForTaskId;
    if (!taskId) return;
    const task = reviewTasksById[taskId];
    const skill = task ? skillsByKey[task.skillId] : undefined;
    const skillKey = skill?.id ?? task?.skillId;
    if (skillKey) writeFirstWriteAck(vaultSlug, skillKey);
    fireConfirmDurable(taskId);
    setFirstWriteForTaskId(null);
  }, [
    firstWriteForTaskId,
    reviewTasksById,
    skillsByKey,
    vaultSlug,
    fireConfirmDurable,
  ]);

  const firstWriteSkillName = useMemo(() => {
    const task = firstWriteForTaskId
      ? reviewTasksById[firstWriteForTaskId]
      : null;
    const skill = task ? skillsByKey[task.skillId] : undefined;
    return skill?.name ?? task?.skillId ?? "this skill";
  }, [firstWriteForTaskId, reviewTasksById, skillsByKey]);

  return (
    <>
      <NeedsReviewList
        reviewTasks={data.reviewTasks}
        skillsBySlug={skillsBySlug}
        seeAllHref={seeAllReviewHref}
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
      {refineForTaskId ? (
        <RefineModal
          onSubmit={handleRefineSubmit}
          onCancel={() => setRefineForTaskId(null)}
        />
      ) : null}
      {firstWriteForTaskId ? (
        <FirstWriteModal
          skillName={firstWriteSkillName}
          onConfirm={handleFirstWriteConfirm}
          onCancel={() => setFirstWriteForTaskId(null)}
        />
      ) : null}
    </>
  );
}
