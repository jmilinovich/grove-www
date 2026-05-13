"use client";

import {
  useCallback,
  useMemo,
  useState,
  type JSX,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import Link from "next/link";
import type { Task, Skill } from "@/lib/grove-api.v2.types";
import { ShortcutChip } from "@/components/primitives/shortcut-chip";
import {
  useKeyboardShortcuts,
  type ShortcutBinding,
} from "@/lib/use-keyboard-shortcuts";

// W2-LIST-1 — NeedsReviewList composite.
//
// Per PLAN.md D-15a: this list owns the focused-row keymap. TaskCard is
// a dumb primitive; the review surface has its own action vocabulary
// (`c` confirm, `r` refine, `x` dismiss, `s` mark-stale) that doesn't
// match TaskCard's run/defer/dismiss. Rather than fight that mismatch
// by remapping callbacks, we render an inline compact row tuned to the
// review action set. TaskCard stays uninvolved — its semantic seam is
// for pending-state surfaces (BacklogList), not the review queue.
//
// Layout (SPEC §6, PLAN W2-LIST-1):
//
//   NEEDS REVIEW (3)
//     [skill-chip] merge concepts? "Pappu" ≈ "Aparna"     [c/r/x/s]
//     [skill-chip] mark perishable as durable? (12d old)  [c/r/x/s]
//     [skill-chip] 3 dup people detected                  [c/r/x/s]
//     see all 3 ▸
//
// Up to 5 visible rows. "see all N ▸" shown when N > 5 (placeholder
// href "#" for v2 per PLAN.md). The section returns null when there
// are zero review tasks so the empty case doesn't leave a header
// staring at the user.

const MAX_VISIBLE = 5;

export interface NeedsReviewListProps {
  reviewTasks: Task[];
  skillsBySlug: Record<string, Skill>;
  onConfirmDurable: (taskId: string) => void;
  onRefine: (taskId: string) => void;
  onDismiss: (taskId: string) => void;
  onMarkStale: (taskId: string) => void;
}

export function NeedsReviewList({
  reviewTasks,
  skillsBySlug,
  onConfirmDurable,
  onRefine,
  onDismiss,
  onMarkStale,
}: NeedsReviewListProps): JSX.Element | null {
  // Hooks must run before any early-return for empty state.
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const visible = reviewTasks.slice(0, MAX_VISIBLE);
  const visibleCount = visible.length;
  const totalCount = reviewTasks.length;
  const hasMore = totalCount > MAX_VISIBLE;

  // If the visible window shrinks (e.g. an action removed a task and
  // the parent re-renders with a shorter list), clamp focusedIndex so
  // we don't dispatch keys against a stale id.
  const safeFocusedIndex =
    focusedIndex >= 0 && focusedIndex < visibleCount ? focusedIndex : -1;

  const focusedTaskId =
    safeFocusedIndex >= 0 ? visible[safeFocusedIndex]?.id ?? null : null;

  const fireForFocused = useCallback(
    (fn: (taskId: string) => void) => {
      if (!focusedTaskId) return;
      fn(focusedTaskId);
    },
    [focusedTaskId],
  );

  const bindings = useMemo<ShortcutBinding[]>(() => {
    const hasFocus = () => safeFocusedIndex >= 0;
    const moveDown = () => {
      setFocusedIndex((prev) =>
        prev < 0 ? 0 : Math.min(prev + 1, visibleCount - 1),
      );
    };
    const moveUp = () => {
      setFocusedIndex((prev) => Math.max(0, prev - 1));
    };
    return [
      {
        key: "j",
        description: "needs-review · focus next row",
        when: () => visibleCount > 0,
        handler: moveDown,
      },
      {
        key: "ArrowDown",
        description: "needs-review · focus next row",
        when: () => visibleCount > 0,
        handler: moveDown,
      },
      {
        key: "k",
        description: "needs-review · focus previous row",
        when: () => visibleCount > 0,
        handler: moveUp,
      },
      {
        key: "ArrowUp",
        description: "needs-review · focus previous row",
        when: () => visibleCount > 0,
        handler: moveUp,
      },
      {
        key: "c",
        description: "needs-review · confirm durable",
        when: hasFocus,
        handler: () => fireForFocused(onConfirmDurable),
      },
      {
        key: "r",
        description: "needs-review · refine",
        when: hasFocus,
        handler: () => fireForFocused(onRefine),
      },
      {
        key: "x",
        description: "needs-review · dismiss",
        when: hasFocus,
        handler: () => fireForFocused(onDismiss),
      },
      {
        key: "s",
        description: "needs-review · mark stale",
        when: hasFocus,
        handler: () => fireForFocused(onMarkStale),
      },
    ];
  }, [
    visibleCount,
    safeFocusedIndex,
    fireForFocused,
    onConfirmDurable,
    onRefine,
    onDismiss,
    onMarkStale,
  ]);

  useKeyboardShortcuts(bindings);

  if (totalCount === 0) return null;

  return (
    <section
      aria-labelledby="needs-review-heading"
      className="border-b border-surface-border"
    >
      <header className="px-6 pt-6 pb-3">
        <h2
          id="needs-review-heading"
          className="font-sans font-medium text-label text-ink lowercase"
        >
          needs review <span className="text-ink/60">({totalCount})</span>
        </h2>
      </header>

      <ul className="px-6 pb-6 flex flex-col gap-2">
        {visible.map((task, idx) => {
          const skill = task.skillId ? skillsBySlug[task.skillId] : undefined;
          const isFocused = idx === safeFocusedIndex;
          return (
            <ReviewRow
              key={task.id}
              task={task}
              skill={skill}
              focused={isFocused}
              onSelect={() => setFocusedIndex(idx)}
              onConfirm={() => onConfirmDurable(task.id)}
              onRefine={() => onRefine(task.id)}
              onDismiss={() => onDismiss(task.id)}
              onMarkStale={() => onMarkStale(task.id)}
            />
          );
        })}

        {hasMore ? (
          <li className="pt-1">
            <a
              href="#"
              className="font-sans text-label text-ink/60 hover:text-ink transition-colors"
            >
              see all {totalCount} ▸
            </a>
          </li>
        ) : null}
      </ul>
    </section>
  );
}

interface ReviewRowProps {
  task: Task;
  skill: Skill | undefined;
  focused: boolean;
  onSelect: () => void;
  onConfirm: () => void;
  onRefine: () => void;
  onDismiss: () => void;
  onMarkStale: () => void;
}

function ReviewRow({
  task,
  skill,
  focused,
  onSelect,
  onConfirm,
  onRefine,
  onDismiss,
  onMarkStale,
}: ReviewRowProps): JSX.Element {
  // Focused state mirrors TaskCard's convention: a moss left-border
  // that doesn't reflow neighbors. The row container is a plain <div>
  // (not a button) so we can nest <button> action elements inside it
  // without breaking the interactive-in-interactive rule. Click + key
  // handlers on the wrapper provide the "click row to focus it"
  // affordance; the action buttons are real, focusable buttons.
  const rowClasses = [
    "bg-surface border border-surface-border rounded-md p-4",
    "hover:bg-surface-hover hover:border-ink",
    "border-l-2",
    focused ? "border-l-moss" : "border-l-transparent",
    "transition-colors",
    "cursor-pointer",
  ].join(" ");

  const onRowClick = () => onSelect();
  const onRowKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    // Enter/Space on the container is purely for keyboard users
    // tab-stepping the row; the `j/k/c/r/x/s` keymap is handled by
    // the parent's useKeyboardShortcuts.
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={onRowClick}
        onKeyDown={onRowKeyDown}
        className={rowClasses}
        data-task-id={task.id}
        data-focused={focused ? "true" : "false"}
        aria-pressed={focused}
      >
        <div className="flex items-baseline gap-2 flex-wrap">
          {skill ? (
            <SkillChip slug={skill.slug} name={skill.name} />
          ) : (
            <span className="font-sans font-medium text-label text-ink/60">
              {task.skillId}
            </span>
          )}
          <h3 className="font-serif text-subhead text-ink leading-snug">
            {task.title}
          </h3>
        </div>

        {task.needsReviewReason ? (
          <p className="mt-1 font-sans text-detail text-ink/60">
            {task.needsReviewReason}
          </p>
        ) : null}

        {task.sourceNotes && task.sourceNotes.length > 0 ? (
          <p className="mt-1 font-sans text-detail text-ink/60">
            from{" "}
            {task.sourceNotes.map((note, idx) => (
              <span key={`${note}-${idx}`}>
                <span className="text-ink border-b border-surface-border">
                  {note}
                </span>
                {idx < (task.sourceNotes?.length ?? 0) - 1 ? ", " : null}
              </span>
            ))}
          </p>
        ) : null}

        {focused ? (
          <div className="mt-3 flex items-center justify-end gap-4 font-sans text-label">
            <RowAction onClick={onConfirm} label="confirm" shortcut="c" />
            <RowAction onClick={onRefine} label="refine" shortcut="r" />
            <RowAction onClick={onDismiss} label="dismiss" shortcut="x" />
            <RowAction onClick={onMarkStale} label="stale" shortcut="s" />
          </div>
        ) : null}
      </div>
    </li>
  );
}

interface SkillChipProps {
  slug: string;
  name: string;
}

function SkillChip({ slug, name }: SkillChipProps): JSX.Element {
  // Wrap the link so a click on the chip doesn't also trip the row's
  // select handler. The skill chip is its own affordance per SPEC §2.
  return (
    <Link
      href={`/skills/${slug}`}
      onClick={(e) => e.stopPropagation()}
      className="font-sans font-medium text-label text-moss hover:text-ink transition-colors"
    >
      {name}
    </Link>
  );
}

interface RowActionProps {
  onClick: () => void;
  label: string;
  shortcut: string;
}

function RowAction({ onClick, label, shortcut }: RowActionProps): JSX.Element {
  // Stop propagation so clicking the action doesn't *also* re-select
  // the row through the surrounding row container. The keymap is the
  // canonical path; click here is the mouse-fallback.
  const handleClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onClick();
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-ink/60 hover:text-ink transition-colors"
    >
      <ShortcutChip keys={shortcut} />
      <span>{label}</span>
    </button>
  );
}
