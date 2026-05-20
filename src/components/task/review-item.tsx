"use client";

import {
  useCallback,
  useState,
  type JSX,
  type MouseEvent as ReactMouseEvent,
} from "react";
import type { ReviewOption, Task } from "@/lib/grove-api.v2.types";
import { Button } from "@/components/primitives/button";
import { ProvenanceBadge } from "@/components/primitives/provenance-badge";
import { ShortcutChip } from "@/components/primitives/shortcut-chip";
import { RefineModal } from "./refine-modal";

// W3-REVIEW-1 — ReviewItem.
//
// This is the *detail* surface for a single review-state task. It's not
// the compact row from NeedsReviewList (that's the dashboard glance). It's
// the dedicated review canvas — used on the task-detail page and from
// "see all" expansion of needs-review. It renders the AI artifact in full
// fidelity, exposes the review actions with shortcut chips, and dispatches
// the user's pick on a decision-backed task.
//
// Per Scope Cop (PLAN.md W3-REVIEW-1): refine opens a MODAL with a
// <textarea> + Submit / Cancel — NOT an inline textarea.
//
// Every review-state task ships with `task.options` (S-INBOX-9 bridge
// guarantees this on the server). The action footer renders one button
// per option plus refine + dismiss. The legacy four-verb fallback
// (confirm / refine / dismiss / mark-stale) was retired in C-INBOX-1
// after M-INBOX-1 dismissed the last legacy queue on prod.
//
// The RefineModal is extracted to a sibling file so BacklogIsland and
// TaskDetailClient can share the same modal — see refine-modal.tsx.

const MAX_OPTION_SHORTCUTS = 9;

export interface ReviewItemProps {
  task: Task;
  skill: { id: string; slug: string; name: string };
  vaultSlug: string;
  /**
   * Dispatch the user's pick on a decision-backed review task. Called
   * with `optionId` matching one of the `task.options[].id` values.
   * Wired to `applyReviewTask` in the parent client island.
   */
  onApplyOption: (optionId: string) => void;
  onRefine: (refinement: string) => void;
  onDismiss: () => void;
}

export function ReviewItem({
  task,
  skill,
  onApplyOption,
  onRefine,
  onDismiss,
}: ReviewItemProps): JSX.Element {
  const [refineOpen, setRefineOpen] = useState(false);

  const handleRefineSubmit = useCallback(
    (refinement: string) => {
      setRefineOpen(false);
      onRefine(refinement);
    },
    [onRefine],
  );

  const handleRefineCancel = useCallback(() => {
    setRefineOpen(false);
  }, []);

  const handleApplyOption = useCallback(
    (optionId: string) => {
      onApplyOption(optionId);
    },
    [onApplyOption],
  );

  // Every review task should have `options` post-C-INBOX-1; assert in
  // dev so a schema regression surfaces loudly.
  const options = task.options;
  if (process.env.NODE_ENV !== "production" && (!options || options.length === 0)) {
    throw new Error(
      `ReviewItem: review task ${task.id} has no options. Every review task must have task.options populated server-side (S-INBOX-9 bridge).`,
    );
  }
  if (!options || options.length === 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `ReviewItem: review task ${task.id} has no options; rendering header-only card`,
    );
  }

  // If there's no result yet (decision-backed disambiguation / link
  // suggestions legitimately have no `result` — only `options`), render
  // the header + dynamic footer.
  if (!task.result) {
    return (
      <article
        className="bg-surface border border-surface-border rounded-md p-6"
        data-task-id={task.id}
        data-task-state={task.state}
        data-row-mode="dynamic"
      >
        <header className="flex items-baseline gap-2 flex-wrap">
          <span className="font-sans font-medium text-label text-moss">
            {skill.name}
          </span>
          <h2 className="font-serif font-medium text-subhead text-ink leading-snug">
            {task.title}
          </h2>
        </header>
        {task.needsReviewReason ? (
          <p className="mt-2 font-sans text-detail text-ink/60">
            {task.needsReviewReason}
          </p>
        ) : null}
        {options && options.length > 0 ? (
          <DynamicActionFooter
            options={options}
            onApplyOption={handleApplyOption}
            onRefine={() => setRefineOpen(true)}
            onDismiss={onDismiss}
          />
        ) : null}
        {refineOpen ? (
          <RefineModal
            onSubmit={handleRefineSubmit}
            onCancel={handleRefineCancel}
          />
        ) : null}
      </article>
    );
  }

  const artifact = task.result.artifact;
  const provenance = task.result.provenance;

  return (
    <article
      className="bg-surface border border-surface-border rounded-md p-6"
      data-task-id={task.id}
      data-task-state={task.state}
      data-artifact-type={artifact.type}
      data-row-mode="dynamic"
    >
      {/* Header: skill + title + provenance badge */}
      <header className="flex items-baseline gap-2 flex-wrap">
        <span className="font-sans font-medium text-label text-moss">
          {skill.name}
        </span>
        <h2 className="font-serif font-medium text-subhead text-ink leading-snug">
          {task.title}
        </h2>
        <span className="ml-auto">
          <ProvenanceBadge
            voice={provenance.voice}
            by={provenance.by}
            writtenAt={provenance.writtenAt}
            source={provenance.source}
            basis={provenance.basis}
            reason={provenance.reason}
          />
        </span>
      </header>

      {task.needsReviewReason ? (
        <p className="mt-2 font-sans text-detail text-ink/60">
          {task.needsReviewReason}
        </p>
      ) : null}

      {/* Artifact body */}
      <div className="mt-6">
        {artifact.type === "note-change" ? (
          <NoteChangeView
            notePath={artifact.notePath}
            diff={
              // The mock currently sets only `surfaceText` for note-change
              // tasks; once api.grove.md returns a real diff payload this
              // will become a structured object. For v2 we render either
              // the diff text or the surface fallback in a split layout
              // so the responsive grammar is locked in.
              undefined
            }
            fallbackText={artifact.surfaceText}
          />
        ) : artifact.type === "surface" ? (
          <SurfaceView
            text={artifact.surfaceText ?? ""}
            sourceNotes={task.sourceNotes ?? []}
          />
        ) : (
          // note-create / note-link / concept-merge: for v2 we render the
          // surface-text summary in the same prose treatment as `surface`.
          // The full preview UI for those types lands in a follow-up PR;
          // the shape stays consistent so we don't have to rewire the
          // header / footer.
          <SurfaceView
            text={artifact.surfaceText ?? ""}
            sourceNotes={task.sourceNotes ?? []}
          />
        )}
      </div>

      {/* Action footer */}
      {options && options.length > 0 ? (
        <DynamicActionFooter
          options={options}
          onApplyOption={handleApplyOption}
          onRefine={() => setRefineOpen(true)}
          onDismiss={onDismiss}
        />
      ) : null}

      {refineOpen ? (
        <RefineModal
          onSubmit={handleRefineSubmit}
          onCancel={handleRefineCancel}
        />
      ) : null}
    </article>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────

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
  return (
    <div
      className="mt-6 flex flex-wrap items-center justify-end gap-3"
      data-testid="review-actions-dynamic"
    >
      {options.slice(0, MAX_OPTION_SHORTCUTS).map((option, idx) => (
        <OptionButton
          key={option.id}
          option={option}
          shortcut={String(idx + 1)}
          onClick={() => onApplyOption(option.id)}
        />
      ))}
      {options.length > MAX_OPTION_SHORTCUTS
        ? options.slice(MAX_OPTION_SHORTCUTS).map((option) => (
            <OptionButton
              key={option.id}
              option={option}
              shortcut={null}
              onClick={() => onApplyOption(option.id)}
            />
          ))
        : null}
      <GhostFooterAction onClick={onRefine} label="refine" shortcut="r" />
      <GhostFooterAction onClick={onDismiss} label="dismiss" shortcut="d" />
    </div>
  );
}

interface OptionButtonProps {
  option: ReviewOption;
  shortcut: string | null;
  onClick: () => void;
}

function OptionButton({ option, shortcut, onClick }: OptionButtonProps): JSX.Element {
  const handleClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onClick();
  };
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleClick}
      data-testid={`review-option-${option.id}`}
      data-option-source={option.source}
      title={option.description ?? undefined}
    >
      {shortcut ? <ShortcutChip keys={shortcut} /> : null}
      <span>{option.label}</span>
    </Button>
  );
}

interface GhostFooterActionProps {
  onClick: () => void;
  label: string;
  shortcut: string;
}

function GhostFooterAction({
  onClick,
  label,
  shortcut,
}: GhostFooterActionProps): JSX.Element {
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

interface NoteChangeViewProps {
  notePath: string | undefined;
  diff: string | undefined;
  fallbackText: string | undefined;
}

function NoteChangeView({
  notePath,
  diff,
  fallbackText,
}: NoteChangeViewProps): JSX.Element {
  // Responsive split: desktop = side-by-side, mobile = stacked. Per
  // PLAN.md W3-REVIEW-1: `flex md:flex-row flex-col`. The "before" pane
  // is the path / current note label; the "after" pane carries the diff
  // (or, for v2 mock data, the surface-text fallback that names what
  // would change).
  const after = diff ?? fallbackText ?? "(no preview available)";

  return (
    <div className="flex flex-col md:flex-row gap-4" data-testid="note-change-split">
      <div
        className="flex-1 bg-cream border border-surface-border rounded-md p-4"
        data-testid="note-change-before"
      >
        <p className="font-mono text-detail text-ink/60">before</p>
        <p className="mt-2 font-mono text-detail text-ink break-all">
          {notePath ?? "(unknown path)"}
        </p>
      </div>
      <div
        className="flex-1 bg-cream border border-surface-border rounded-md p-4"
        data-testid="note-change-after"
      >
        <p className="font-mono text-detail text-ink/60">after</p>
        <pre className="mt-2 whitespace-pre-wrap font-mono text-detail text-ink">
          {after}
        </pre>
      </div>
    </div>
  );
}

interface SurfaceViewProps {
  text: string;
  sourceNotes: string[];
}

function SurfaceView({ text, sourceNotes }: SurfaceViewProps): JSX.Element {
  return (
    <div>
      <p
        className="font-serif text-base text-ink leading-relaxed"
        data-testid="surface-text"
      >
        {text}
      </p>
      {sourceNotes.length > 0 ? (
        <p className="mt-4 font-sans text-detail text-ink/60">
          from{" "}
          {sourceNotes.map((note, idx) => (
            <span key={`${note}-${idx}`}>
              <span className="text-ink border-b border-surface-border">
                {note}
              </span>
              {idx < sourceNotes.length - 1 ? ", " : null}
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}
