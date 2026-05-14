import type { JSX } from "react";
import Link from "next/link";
import type { Task } from "@/lib/grove-api.v2.types";
import { formatScheduledTime } from "@/lib/format-time";
import { ShortcutChip } from "./shortcut-chip";

// W1-PRIM-2 — TaskCard primitive.
//
// Per PLAN.md D-15a: TaskCard does NOT register keyboard shortcuts itself.
// It receives optional callbacks; the parent list (NeedsReviewList,
// BacklogList, SkillsPage) owns `useKeyboardShortcuts` for the focused
// row. `r` means "run" on Pending but "refine" on Review — the collision
// resolves at the parent. That's why every callback is optional and
// every shortcut visualization is opt-in via the `shortcuts` prop.
//
// Layout (from PLAN.md W1-PRIM-2):
//   ┌───────────────────────────────────────────────────────────┐
//   │ [skill-chip]  Weekly journal patterns                     │
//   │  weekly · runs tonight 11pm · ~14m                        │
//   │  from your journal entries                                │
//   │                          [r] run  [e] defer  [d] dismiss  │
//   └───────────────────────────────────────────────────────────┘

interface TaskCardProps {
  task: Task;
  skill: { slug: string; name: string };
  onRun?: () => void;
  onDefer?: () => void;
  onDismiss?: () => void;
  onOpen?: () => void;
  onRetry?: () => void;
  focused?: boolean;
  shortcuts?: {
    run?: string;
    defer?: string;
    dismiss?: string;
    retry?: string;
  };
}

export function TaskCard({
  task,
  skill,
  onRun,
  onDefer,
  onDismiss,
  onOpen,
  onRetry,
  focused = false,
  shortcuts,
}: TaskCardProps): JSX.Element {
  const isFailed = task.state === "failed";

  // Card surface: design-system `card` token. `border-l-2 border-l-moss`
  // is the focused-state marker (D-15a parent-managed; no shadow per
  // DESIGN.md). Use border-l-transparent in the default state so the
  // overall border width is stable and focus doesn't reflow neighbors.
  const cardClasses = [
    "bg-surface border border-surface-border rounded-md p-6",
    "hover:bg-surface-hover hover:border-ink",
    "border-l-2",
    focused ? "border-l-moss" : "border-l-transparent",
    "transition-colors",
  ].join(" ");

  return (
    <article
      className={cardClasses}
      data-task-id={task.id}
      data-task-state={task.state}
      data-focused={focused ? "true" : "false"}
    >
      {/* Header row: skill chip + title */}
      <div className="flex items-baseline gap-2 flex-wrap">
        {isFailed ? (
          <span className="font-sans font-medium text-label text-ink/60">
            failed
          </span>
        ) : (
          <Link
            href={`/skills/${skill.slug}`}
            className="font-sans font-medium text-label text-moss hover:text-ink transition-colors"
          >
            {skill.name}
          </Link>
        )}
        <h3 className="font-serif font-medium text-subhead text-ink leading-snug">
          {onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              className="text-left hover:text-earth transition-colors"
            >
              {task.title}
            </button>
          ) : (
            task.title
          )}
        </h3>
      </div>

      {/* Failed state: error message one-liner under title */}
      {isFailed && task.errorMessage ? (
        <p className="mt-2 font-sans text-detail text-earth">
          {task.errorMessage}
        </p>
      ) : null}

      {/* Metadata row (hidden on failed) */}
      {!isFailed ? (
        <p className="mt-2 font-sans text-detail text-ink/60">
          {formatMetaRow(task)}
        </p>
      ) : null}

      {/* Source notes — wikilink-styled */}
      {!isFailed && task.sourceNotes && task.sourceNotes.length > 0 ? (
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

      {/* Action row */}
      <div className="mt-4 flex items-center justify-end gap-4 font-sans text-label">
        {isFailed ? (
          <>
            {onRetry ? (
              <ActionButton
                onClick={onRetry}
                label="retry"
                shortcut={shortcuts?.retry}
              />
            ) : null}
            {onDismiss ? (
              <ActionButton
                onClick={onDismiss}
                label="dismiss"
                shortcut={shortcuts?.dismiss}
              />
            ) : null}
          </>
        ) : (
          <>
            {onRun ? (
              <ActionButton
                onClick={onRun}
                label="run"
                shortcut={shortcuts?.run}
              />
            ) : null}
            {onDefer ? (
              <ActionButton
                onClick={onDefer}
                label="defer"
                shortcut={shortcuts?.defer}
              />
            ) : null}
            {onDismiss ? (
              <ActionButton
                onClick={onDismiss}
                label="dismiss"
                shortcut={shortcuts?.dismiss}
              />
            ) : null}
          </>
        )}
      </div>
    </article>
  );
}

interface ActionButtonProps {
  onClick: () => void;
  label: string;
  shortcut?: string;
}

function ActionButton({ onClick, label, shortcut }: ActionButtonProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-ink/60 hover:text-ink transition-colors"
    >
      {shortcut ? <ShortcutChip keys={shortcut} /> : null}
      <span>{label}</span>
    </button>
  );
}

function formatMetaRow(task: Task): string {
  const parts: string[] = [];
  if (task.scheduledFor) {
    parts.push(`runs ${formatScheduledTime(task.scheduledFor)}`);
  }
  parts.push(`~${task.estimatedMinutes}m`);
  return parts.join(" · ");
}
