"use client";

import { useCallback, useMemo, useState, type JSX } from "react";
import { useRouter } from "next/navigation";
import type { Task } from "@/lib/grove-api.v2.types";
import { ShortcutChip } from "@/components/primitives/shortcut-chip";
import {
  useKeyboardShortcuts,
  type ShortcutBinding,
} from "@/lib/use-keyboard-shortcuts";
import { runTask, retryTask } from "@/app/(resident)/[atHandle]/[vaultSlug]/_actions/tasks";
import { reviewTask } from "@/app/(resident)/[atHandle]/[vaultSlug]/_actions/review";
import { FirstWriteModal } from "./first-write-modal";
import {
  WRITE_ARTIFACT_TYPES,
  readFirstWriteAck,
  writeFirstWriteAck,
} from "./first-write-ack";

// W3-TASK-1 — TaskDetail client island.
//
// Owns the page-level keyboard map and the primary-action button. Lives
// here (not in `task-detail.tsx`) so the parent can stay a server
// component and we ship a tiny JS payload for the interactive surface.
//
// Keyboard (per PLAN.md W3-TASK-1):
//   ↑/↓   cycle through related-notes focus index
//   Enter trigger the primary action (run / confirm / retry)
//   Esc   back to backlog
//
// Per D-15a: this island OWNS the focused-row keymap for its page.
// Per-row keymaps in BacklogList don't conflict because this page
// doesn't render BacklogList.

type PrimaryAction =
  | { kind: "run"; label: string }
  | { kind: "confirm"; label: string }
  | { kind: "retry"; label: string }
  | { kind: "none" };

interface TaskDetailClientProps {
  task: Task;
  vaultSlug: string;
  backHref: string;
  relatedCount: number;
  /**
   * Human-readable skill name for the first-write modal copy. Optional
   * because the upstream page may not have loaded the skill registry
   * yet — when absent we fall back to `task.skillId` so the modal still
   * names the source.
   */
  skillName?: string;
}

function primaryActionForState(state: Task["state"]): PrimaryAction {
  switch (state) {
    case "pending":
      return { kind: "run", label: "run" };
    case "review":
      return { kind: "confirm", label: "confirm" };
    case "failed":
      return { kind: "retry", label: "retry" };
    default:
      return { kind: "none" };
  }
}

export function TaskDetailClient({
  task,
  vaultSlug,
  backHref,
  relatedCount,
  skillName,
}: TaskDetailClientProps): JSX.Element {
  const router = useRouter();
  const primary = primaryActionForState(task.state);
  // Focus index for related notes — -1 means no row focused.
  const [, setRelatedFocus] = useState<number>(-1);
  const [firstWriteOpen, setFirstWriteOpen] = useState(false);

  const fireConfirmDurable = useCallback(() => {
    void reviewTask(task.id, { kind: "confirm-durable" }, vaultSlug).catch(
      (err: unknown) => {
        // eslint-disable-next-line no-console
        console.error("reviewTask(confirm-durable) failed", err);
      },
    );
  }, [task.id, vaultSlug]);

  const triggerPrimary = useCallback(() => {
    if (primary.kind === "none") return;
    if (primary.kind === "run") {
      void runTask(task.id, vaultSlug).catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.error("runTask failed", err);
      });
      return;
    }
    if (primary.kind === "retry") {
      void retryTask(task.id, vaultSlug).catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.error("retryTask failed", err);
      });
      return;
    }
    // confirm-durable on a review task. Gate write artifacts behind the
    // per-(vault, skill) first-write modal — same behavior as
    // BacklogIsland so the keyboard path and the click path can't bypass
    // each other.
    const isWrite =
      task.result != null && WRITE_ARTIFACT_TYPES.has(task.result.artifact.type);
    if (isWrite && !readFirstWriteAck(vaultSlug, task.skillId)) {
      setFirstWriteOpen(true);
      return;
    }
    fireConfirmDurable();
  }, [primary.kind, task.id, task.skillId, task.result, vaultSlug, fireConfirmDurable]);

  const handleFirstWriteConfirm = useCallback(() => {
    writeFirstWriteAck(vaultSlug, task.skillId);
    setFirstWriteOpen(false);
    fireConfirmDurable();
  }, [vaultSlug, task.skillId, fireConfirmDurable]);

  const handleFirstWriteCancel = useCallback(() => {
    setFirstWriteOpen(false);
  }, []);

  const goBack = useCallback(() => {
    router.push(backHref);
  }, [router, backHref]);

  const cycleRelated = useCallback(
    (direction: 1 | -1) => {
      if (relatedCount === 0) return;
      setRelatedFocus((prev) => {
        if (prev < 0) return direction === 1 ? 0 : relatedCount - 1;
        return (prev + direction + relatedCount) % relatedCount;
      });
    },
    [relatedCount],
  );

  const bindings = useMemo<ShortcutBinding[]>(() => {
    return [
      {
        key: "ArrowDown",
        description: "cycle to next related note",
        when: () => relatedCount > 0,
        handler: () => cycleRelated(1),
      },
      {
        key: "ArrowUp",
        description: "cycle to previous related note",
        when: () => relatedCount > 0,
        handler: () => cycleRelated(-1),
      },
      {
        key: "Enter",
        description: "trigger primary action",
        when: () => primary.kind !== "none",
        handler: triggerPrimary,
      },
      {
        key: "Esc",
        description: "back to backlog",
        handler: goBack,
      },
    ];
  }, [relatedCount, primary.kind, triggerPrimary, goBack, cycleRelated]);

  useKeyboardShortcuts(bindings);

  return (
    <>
      <footer
        data-testid="task-detail-footer"
        className="mt-4 flex items-center justify-end gap-4 font-sans text-label"
      >
        <a
          href={backHref}
          className="inline-flex items-center gap-1.5 text-ink/60 hover:text-ink transition-colors"
          data-testid="task-back"
        >
          <ShortcutChip keys="Esc" />
          <span>back</span>
        </a>
        {primary.kind !== "none" ? (
          <button
            type="button"
            onClick={triggerPrimary}
            className="inline-flex items-center gap-1.5 text-ink hover:text-moss transition-colors"
            data-testid="task-primary-action"
            data-action={primary.kind}
          >
            <ShortcutChip keys="Enter" />
            <span>{primary.label}</span>
          </button>
        ) : null}
      </footer>
      {firstWriteOpen ? (
        <FirstWriteModal
          skillName={skillName ?? task.skillId}
          onConfirm={handleFirstWriteConfirm}
          onCancel={handleFirstWriteCancel}
        />
      ) : null}
    </>
  );
}
