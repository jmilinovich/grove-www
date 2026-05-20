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
import { FirstWriteModal } from "./first-write-modal";
import {
  WRITE_ARTIFACT_TYPES,
  readFirstWriteAck,
  writeFirstWriteAck,
} from "./first-write-ack";

// W3-REVIEW-1 — ReviewItem.
//
// This is the *detail* surface for a single review-state task. It's not
// the compact row from NeedsReviewList (that's the dashboard glance). It's
// the dedicated review canvas — used on the task-detail page and from
// "see all" expansion of needs-review. It renders the AI artifact in full
// fidelity, exposes the review actions with shortcut chips, and handles
// the first-write confirmation gate per-skill, per-vault.
//
// Per Scope Cop (PLAN.md W3-REVIEW-1): refine opens a MODAL with a
// <textarea> + Submit / Cancel — NOT an inline textarea. Confirmation
// for write-type artifacts is a one-time modal per (vault, skill), with
// the preference stored in localStorage so subsequent confirms skip the
// prompt.
//
// W-INBOX-2: action footer is dynamic. Decision-backed review tasks
// (with `task.options[]`) render one button per option plus refine +
// dismiss. Legacy review tasks (no `options`) keep the original four-
// verb set (confirm / refine / dismiss / mark-stale) so see-all keeps
// working during rollout. See needs-review-list.tsx for the matching
// rationale on the compact row.
//
// The RefineModal, FirstWriteModal, and first-write ack helpers are
// extracted to sibling files so BacklogIsland and TaskDetailClient can
// share the same gate behavior — see refine-modal.tsx,
// first-write-modal.tsx, first-write-ack.ts.

const MAX_OPTION_SHORTCUTS = 9;

function hasDynamicOptions(task: Task): boolean {
  return Array.isArray(task.options) && task.options.length > 0;
}

export interface ReviewItemProps {
  task: Task;
  skill: { id: string; slug: string; name: string };
  vaultSlug: string;
  /**
   * Dispatch the user's pick on a decision-backed review task. Called
   * with `optionId` matching one of the `task.options[].id` values.
   * Wired to `applyReviewTask` in the parent client island.
   */
  onApplyOption?: (optionId: string) => void;
  onConfirmDurable: () => void;
  onRefine: (refinement: string) => void;
  onDismiss: () => void;
  onMarkStale: () => void;
}

export function ReviewItem({
  task,
  skill,
  vaultSlug,
  onApplyOption,
  onConfirmDurable,
  onRefine,
  onDismiss,
  onMarkStale,
}: ReviewItemProps): JSX.Element {
  const [refineOpen, setRefineOpen] = useState(false);
  const [firstWriteOpen, setFirstWriteOpen] = useState(false);

  // We hold the artifact type at the call site so the modal copy can
  // mention the right surface ("write to your vault"). Computed once.
  const isWriteArtifact = task.result
    ? WRITE_ARTIFACT_TYPES.has(task.result.artifact.type)
    : false;

  const handleConfirmDurableClick = useCallback(() => {
    if (isWriteArtifact && !readFirstWriteAck(vaultSlug, skill.id)) {
      setFirstWriteOpen(true);
      return;
    }
    onConfirmDurable();
  }, [isWriteArtifact, vaultSlug, skill.id, onConfirmDurable]);

  const handleFirstWriteConfirm = useCallback(() => {
    writeFirstWriteAck(vaultSlug, skill.id);
    setFirstWriteOpen(false);
    onConfirmDurable();
  }, [vaultSlug, skill.id, onConfirmDurable]);

  const handleFirstWriteCancel = useCallback(() => {
    setFirstWriteOpen(false);
  }, []);

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
      if (!onApplyOption) return;
      onApplyOption(optionId);
    },
    [onApplyOption],
  );

  // If there's no result yet (shouldn't happen for review-state tasks
  // since they have to have run to be in review, but defensive), render
  // a placeholder rather than crash.
  if (!task.result) {
    // Some decision-backed tasks (disambiguation / link suggestions)
    // also legitimately have no `result` — only `options`. Render the
    // header + dynamic footer in that case so the user can still pick.
    if (hasDynamicOptions(task)) {
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
          <DynamicActionFooter
            options={task.options ?? []}
            onApplyOption={handleApplyOption}
            onRefine={() => setRefineOpen(true)}
            onDismiss={onDismiss}
          />
          {refineOpen ? (
            <RefineModal
              onSubmit={handleRefineSubmit}
              onCancel={handleRefineCancel}
            />
          ) : null}
        </article>
      );
    }
    return (
      <article
        className="bg-surface border border-surface-border rounded-md p-6"
        data-task-id={task.id}
      >
        <p className="font-sans text-detail text-ink/60">
          this task has no result yet
        </p>
      </article>
    );
  }

  const artifact = task.result.artifact;
  const provenance = task.result.provenance;
  const dynamic = hasDynamicOptions(task);

  return (
    <article
      className="bg-surface border border-surface-border rounded-md p-6"
      data-task-id={task.id}
      data-task-state={task.state}
      data-artifact-type={artifact.type}
      data-row-mode={dynamic ? "dynamic" : "legacy"}
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
      {dynamic ? (
        <DynamicActionFooter
          options={task.options ?? []}
          onApplyOption={handleApplyOption}
          onRefine={() => setRefineOpen(true)}
          onDismiss={onDismiss}
        />
      ) : (
        <LegacyActionFooter
          onConfirm={handleConfirmDurableClick}
          onRefine={() => setRefineOpen(true)}
          onDismiss={onDismiss}
          onMarkStale={onMarkStale}
        />
      )}

      {refineOpen ? (
        <RefineModal
          onSubmit={handleRefineSubmit}
          onCancel={handleRefineCancel}
        />
      ) : null}

      {firstWriteOpen ? (
        <FirstWriteModal
          skillName={skill.name}
          onConfirm={handleFirstWriteConfirm}
          onCancel={handleFirstWriteCancel}
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

interface LegacyActionFooterProps {
  onConfirm: () => void;
  onRefine: () => void;
  onDismiss: () => void;
  onMarkStale: () => void;
}

function LegacyActionFooter({
  onConfirm,
  onRefine,
  onDismiss,
  onMarkStale,
}: LegacyActionFooterProps): JSX.Element {
  return (
    <div
      className="mt-6 flex items-center justify-end gap-4 font-sans text-label"
      data-testid="review-actions-legacy"
    >
      <FooterAction onClick={onConfirm} label="confirm" shortcut="c" />
      <FooterAction onClick={onRefine} label="refine" shortcut="r" />
      <FooterAction onClick={onDismiss} label="dismiss" shortcut="x" />
      <FooterAction onClick={onMarkStale} label="stale" shortcut="s" />
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

interface FooterActionProps {
  onClick: () => void;
  label: string;
  shortcut: string;
}

function FooterAction({
  onClick,
  label,
  shortcut,
}: FooterActionProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-ink/60 hover:text-ink transition-colors"
    >
      <ShortcutChip keys={shortcut} />
      <span>{label}</span>
    </button>
  );
}
