"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type JSX,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import type { Task, TaskArtifactType } from "@/lib/grove-api.v2.types";
import { Button } from "@/components/primitives/button";
import { ProvenanceBadge } from "@/components/primitives/provenance-badge";
import { ShortcutChip } from "@/components/primitives/shortcut-chip";

// W3-REVIEW-1 — ReviewItem.
//
// This is the *detail* surface for a single review-state task. It's not
// the compact row from NeedsReviewList (that's the dashboard glance). It's
// the dedicated review canvas — used on the task-detail page and from
// "see all" expansion of needs-review. It renders the AI artifact in full
// fidelity, exposes the four review actions with shortcut chips, and
// handles the first-write confirmation gate per-skill, per-vault.
//
// Per Scope Cop (PLAN.md W3-REVIEW-1): refine opens a MODAL with a
// <textarea> + Submit / Cancel — NOT an inline textarea. Confirmation
// for write-type artifacts is a one-time modal per (vault, skill), with
// the preference stored in localStorage so subsequent confirms skip the
// prompt.
//
// Action vocabulary: `c` confirm-durable, `r` refine, `x` dismiss,
// `s` mark-stale. Same as NeedsReviewList — see needs-review-list.tsx
// for the rationale on why the review surface doesn't map onto the
// run/defer/dismiss vocabulary of TaskCard.

// Artifact types that write to the vault (vs surface-only output that
// doesn't touch any note). confirm-durable on a write artifact is what
// actually applies the diff / creates the note / wires the wikilink, so
// these need the one-time per-skill heads-up modal.
const WRITE_ARTIFACT_TYPES: ReadonlySet<TaskArtifactType> = new Set([
  "note-change",
  "note-create",
  "note-link",
  "concept-merge",
]);

function firstWriteFlagKey(vaultSlug: string, skillId: string): string {
  // Namespaced per (vault, skill). Stored as the literal string "1" once
  // the user has confirmed the first write for that skill in that vault.
  return `grove.first-write-ack.${vaultSlug}.${skillId}`;
}

function readFirstWriteAck(vaultSlug: string, skillId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      window.localStorage.getItem(firstWriteFlagKey(vaultSlug, skillId)) === "1"
    );
  } catch {
    // Private-mode Safari throws on localStorage access; treat as "not
    // acknowledged" so we err on the side of showing the heads-up modal.
    return false;
  }
}

function writeFirstWriteAck(vaultSlug: string, skillId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(firstWriteFlagKey(vaultSlug, skillId), "1");
  } catch {
    // Same — silently ignore. Worst case the user sees the modal again
    // on the next confirm, which is benign.
  }
}

export interface ReviewItemProps {
  task: Task;
  skill: { id: string; slug: string; name: string };
  vaultSlug: string;
  onConfirmDurable: () => void;
  onRefine: (refinement: string) => void;
  onDismiss: () => void;
  onMarkStale: () => void;
}

export function ReviewItem({
  task,
  skill,
  vaultSlug,
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

  // If there's no result yet (shouldn't happen for review-state tasks
  // since they have to have run to be in review, but defensive), render
  // a placeholder rather than crash.
  if (!task.result) {
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

  return (
    <article
      className="bg-surface border border-surface-border rounded-md p-6"
      data-task-id={task.id}
      data-task-state={task.state}
      data-artifact-type={artifact.type}
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
      <div className="mt-6 flex items-center justify-end gap-4 font-sans text-label">
        <FooterAction
          onClick={handleConfirmDurableClick}
          label="confirm"
          shortcut="c"
        />
        <FooterAction
          onClick={() => setRefineOpen(true)}
          label="refine"
          shortcut="r"
        />
        <FooterAction onClick={onDismiss} label="dismiss" shortcut="x" />
        <FooterAction onClick={onMarkStale} label="stale" shortcut="s" />
      </div>

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

// ─── Refine modal ──────────────────────────────────────────────────────

interface RefineModalProps {
  onSubmit: (refinement: string) => void;
  onCancel: () => void;
}

function RefineModal({ onSubmit, onCancel }: RefineModalProps): JSX.Element {
  const [text, setText] = useState("");
  const headingId = useId();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Focus the textarea on mount so the user can start typing immediately.
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Esc → cancel. Bound to the modal dialog element so it doesn't
  // collide with the parent surface's keymap.
  const onDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  };

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      // Don't submit an empty refinement; this mirrors how the API will
      // reject an empty `refinement` field. Re-focus to nudge.
      textareaRef.current?.focus();
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 p-4"
      onKeyDown={onDialogKeyDown}
      data-testid="refine-modal"
    >
      <div className="w-full max-w-md bg-surface border border-surface-border rounded-md p-6">
        <h3
          id={headingId}
          className="font-serif font-medium text-subhead text-ink"
        >
          refine this artifact
        </h3>
        <p className="mt-2 font-sans text-detail text-ink/60">
          what should the skill do differently next time?
        </p>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mt-4 w-full min-h-32 bg-cream border border-surface-border rounded-md p-3 font-sans text-base text-ink resize-y focus:outline-none focus:border-ink"
          placeholder="e.g. rephrase as durable; drop the hedge"
          data-testid="refine-textarea"
        />
        <div className="mt-4 flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
            data-testid="refine-cancel"
          >
            cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            data-testid="refine-submit"
          >
            submit
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── First-write confirmation modal ────────────────────────────────────

interface FirstWriteModalProps {
  skillName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function FirstWriteModal({
  skillName,
  onConfirm,
  onCancel,
}: FirstWriteModalProps): JSX.Element {
  const headingId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Focus the confirm button on mount so Enter accepts. We query the
  // button by data-testid from the dialog root because the shared
  // `<Button>` primitive doesn't forward refs (it uses
  // ComponentPropsWithoutRef<"button">). Querying after mount is the
  // sanctioned escape hatch here.
  useEffect(() => {
    const confirmButton = dialogRef.current?.querySelector<HTMLButtonElement>(
      '[data-testid="first-write-confirm"]',
    );
    confirmButton?.focus();
  }, []);

  const onDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 p-4"
      onKeyDown={onDialogKeyDown}
      data-testid="first-write-modal"
    >
      <div className="w-full max-w-md bg-surface border border-surface-border rounded-md p-6">
        <h3
          id={headingId}
          className="font-serif font-medium text-subhead text-ink"
        >
          first write for {skillName}
        </h3>
        <p className="mt-3 font-sans text-base text-ink">
          this skill will write to your vault. continue?
        </p>
        <p className="mt-2 font-sans text-detail text-ink/60">
          you won&apos;t see this prompt again for this skill.
        </p>
        <div className="mt-4 flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
            data-testid="first-write-cancel"
          >
            cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onConfirm}
            data-testid="first-write-confirm"
          >
            continue
          </Button>
        </div>
      </div>
    </div>
  );
}
