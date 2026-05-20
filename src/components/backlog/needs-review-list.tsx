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
import type { ReviewOption, Task, Skill } from "@/lib/grove-api.v2.types";
import { Button } from "@/components/primitives/button";
import { ShortcutChip } from "@/components/primitives/shortcut-chip";
import {
  useKeyboardShortcuts,
  type ShortcutBinding,
} from "@/lib/use-keyboard-shortcuts";

// W2-LIST-1 — NeedsReviewList composite.
//
// Per PLAN.md D-15a: this list owns the focused-row keymap. TaskCard is
// a dumb primitive; the review surface has its own action vocabulary
// that doesn't match TaskCard's run/defer/dismiss. Rather than fight
// that mismatch by remapping callbacks, we render an inline compact row
// tuned to the review action set. TaskCard stays uninvolved — its
// semantic seam is for pending-state surfaces (BacklogList), not the
// review queue.
//
// Every review-state task now ships with `task.options` (S-INBOX-9
// bridge guarantees this on the server). Rows render one button per
// option plus refine + dismiss. The legacy four-verb fallback row
// (confirm / refine / dismiss / mark-stale) was retired in C-INBOX-1
// after M-INBOX-1 dismissed the last legacy queue on prod.
//
// Layout (SPEC §6, PLAN W2-LIST-1):
//
//   NEEDS REVIEW (3)
//     [skill-chip] disambiguate Anna             [link to Anna Chen] [link to Anna Kim] [do not link] [refine] [dismiss]
//     [skill-chip] mark perishable as durable?   [confirm] [refine] [dismiss] [stale]
//     [skill-chip] 3 dup people detected         [link to ...] [...] [refine] [dismiss]
//     see all 3 ▸
//
// Up to 5 visible rows. "see all N ▸" shown when N > 5 (placeholder
// href "#" for v2 per PLAN.md). The section returns null when there
// are zero review tasks so the empty case doesn't leave a header
// staring at the user.

const MAX_VISIBLE = 5;
const MAX_OPTION_SHORTCUTS = 9;

export interface NeedsReviewListProps {
  reviewTasks: Task[];
  skillsBySlug: Record<string, Skill>;
  /**
   * Dispatch the user's pick on a decision-backed review task. Called
   * with `(taskId, optionId)` where `optionId` matches one of the
   * `task.options[].id` values. Wired to `applyReviewTask` in the
   * client shell.
   */
  onApplyOption: (taskId: string, optionId: string) => void;
  onRefine: (taskId: string) => void;
  onDismiss: (taskId: string) => void;
  /**
   * Destination for the "see all N" link when totalCount exceeds the
   * visible window. Optional — when omitted the link falls back to "#"
   * for tests/storybook that don't have routing context.
   */
  seeAllHref?: string;
}

export function NeedsReviewList({
  reviewTasks,
  skillsBySlug,
  onApplyOption,
  onRefine,
  onDismiss,
  seeAllHref,
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

  const focusedTask =
    safeFocusedIndex >= 0 ? visible[safeFocusedIndex] ?? null : null;
  const focusedTaskId = focusedTask?.id ?? null;

  const fireForFocused = useCallback(
    (fn: (taskId: string) => void) => {
      if (!focusedTaskId) return;
      fn(focusedTaskId);
    },
    [focusedTaskId],
  );

  const fireOptionForFocused = useCallback(
    (optionIndex: number) => {
      if (!focusedTask || !focusedTaskId) return;
      const opts = focusedTask.options;
      if (!opts || optionIndex >= opts.length) return;
      onApplyOption(focusedTaskId, opts[optionIndex].id);
    },
    [focusedTask, focusedTaskId, onApplyOption],
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
    // Number-key bindings for dynamic options. We register 1..9
    // regardless of how many options the focused task actually has —
    // the `when` predicate gates dispatch by both focus AND option
    // count, so pressing `4` on a row with 3 options is a no-op.
    const numberBindings: ShortcutBinding[] = [];
    for (let i = 0; i < MAX_OPTION_SHORTCUTS; i++) {
      const key = String(i + 1);
      numberBindings.push({
        key,
        description: `needs-review · apply option ${i + 1}`,
        when: () =>
          hasFocus() && (focusedTask?.options?.length ?? 0) > i,
        handler: () => fireOptionForFocused(i),
      });
    }
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
      ...numberBindings,
      {
        key: "r",
        description: "needs-review · refine",
        when: hasFocus,
        handler: () => fireForFocused(onRefine),
      },
      {
        key: "d",
        description: "needs-review · dismiss",
        when: hasFocus,
        handler: () => fireForFocused(onDismiss),
      },
    ];
  }, [
    visibleCount,
    safeFocusedIndex,
    focusedTask,
    fireForFocused,
    fireOptionForFocused,
    onRefine,
    onDismiss,
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
              onApplyOption={(optionId) => onApplyOption(task.id, optionId)}
              onRefine={() => onRefine(task.id)}
              onDismiss={() => onDismiss(task.id)}
            />
          );
        })}

        {hasMore ? (
          <li className="pt-1">
            <a
              href={seeAllHref ?? "#"}
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
  onApplyOption: (optionId: string) => void;
  onRefine: () => void;
  onDismiss: () => void;
}

function ReviewRow({
  task,
  skill,
  focused,
  onSelect,
  onApplyOption,
  onRefine,
  onDismiss,
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
    // tab-stepping the row; the action keymap is handled by
    // the parent's useKeyboardShortcuts.
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  };

  // Every review task has `options` post-C-INBOX-1; assert in dev so a
  // schema regression surfaces loudly. In prod we render zero buttons
  // (the row still shows skill + title + reason) rather than crashing
  // the dashboard if a stray legacy task slips through.
  const options = task.options;
  if (!options || options.length === 0) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        `NeedsReviewList: review task ${task.id} has no options. Every review task must have task.options populated server-side (S-INBOX-9 bridge).`,
      );
    }
    // eslint-disable-next-line no-console
    console.warn(
      `NeedsReviewList: review task ${task.id} has no options; rendering header-only row`,
    );
  }

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
        data-row-mode="dynamic"
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

        {focused && options && options.length > 0 ? (
          <DynamicActionFooter
            options={options}
            onApplyOption={onApplyOption}
            onRefine={onRefine}
            onDismiss={onDismiss}
          />
        ) : null}
      </div>
    </li>
  );
}

interface DynamicActionFooterProps {
  options: ReviewOption[];
  onApplyOption: (optionId: string) => void;
  onRefine: () => void;
  onDismiss: () => void;
}

function DynamicActionFooter({
  options,
  onApplyOption,
  onRefine,
  onDismiss,
}: DynamicActionFooterProps): JSX.Element {
  // Buttons wrap on narrow viewports per DESIGN.md ("On mobile (<640px),
  // buttons wrap to next row"). `gap-3` matches the refine-modal footer
  // and is the smallest sanctioned grid gap.
  return (
    <div
      className="mt-3 flex flex-wrap items-center justify-end gap-3"
      data-testid="review-actions-dynamic"
    >
      {options.slice(0, MAX_OPTION_SHORTCUTS).map((option, idx) => (
        <OptionButton
          key={option.id}
          option={option}
          shortcut={String(idx + 1)}
          onClick={(e) => {
            e.stopPropagation();
            onApplyOption(option.id);
          }}
        />
      ))}
      {/* Options beyond 1..9 are still clickable, just shortcut-less. */}
      {options.length > MAX_OPTION_SHORTCUTS
        ? options.slice(MAX_OPTION_SHORTCUTS).map((option) => (
            <OptionButton
              key={option.id}
              option={option}
              shortcut={null}
              onClick={(e) => {
                e.stopPropagation();
                onApplyOption(option.id);
              }}
            />
          ))
        : null}
      <GhostAction
        onClick={(e) => {
          e.stopPropagation();
          onRefine();
        }}
        label="refine"
        shortcut="r"
      />
      <GhostAction
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        label="dismiss"
        shortcut="d"
      />
    </div>
  );
}

interface OptionButtonProps {
  option: ReviewOption;
  shortcut: string | null;
  onClick: (e: ReactMouseEvent<HTMLButtonElement>) => void;
}

function OptionButton({
  option,
  shortcut,
  onClick,
}: OptionButtonProps): JSX.Element {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={onClick}
      data-testid={`review-option-${option.id}`}
      data-option-source={option.source}
      title={option.description ?? undefined}
    >
      {shortcut ? <ShortcutChip keys={shortcut} /> : null}
      <span>{option.label}</span>
    </Button>
  );
}

interface GhostActionProps {
  onClick: (e: ReactMouseEvent<HTMLButtonElement>) => void;
  label: string;
  shortcut: string;
}

function GhostAction({ onClick, label, shortcut }: GhostActionProps): JSX.Element {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      data-testid={`review-ghost-${label}`}
    >
      <ShortcutChip keys={shortcut} />
      <span>{label}</span>
    </Button>
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
