import type { JSX } from "react";
import type { Task } from "@/lib/grove-api.v2.types";
import { ProvenanceBadge } from "@/components/primitives/provenance-badge";
import { formatScheduledTime } from "@/lib/format-time";
import { TaskDetailClient } from "./task-detail-client";

// W3-TASK-1 — TaskDetail view.
//
// Server-component shell: renders title, description, state badge,
// scheduled-for, run history (startedAt → completedAt + actualMinutes),
// related notes (from `task.sourceNotes`), and the provenance badge if
// the task has a result. The footer's primary-action button + the
// keyboard map (↑/↓ cycle related notes, Enter primary action, Esc
// back to backlog) are owned by a small client island (`<TaskDetailClient />`)
// so this component can stay a server component and ship as much HTML
// as possible on first paint.
//
// Primary-action mapping (per W3-TASK-1 spec):
//   pending  → Run     (calls runTask)
//   review   → Confirm (will call confirm-durable in W3-REVIEW-1; stub today)
//   failed   → Retry   (calls retryTask)
//   done     → none
//   dismissed → none
//   running  → none (transient; UI shows the state but no action)

interface TaskDetailProps {
  task: Task;
  vaultSlug: string;
  backHref: string;
}

export function TaskDetail({ task, vaultSlug, backHref }: TaskDetailProps): JSX.Element {
  const provenance = task.result?.provenance ?? null;
  const sourceNotes = task.sourceNotes ?? [];

  return (
    <article className="flex flex-col gap-8" data-testid="task-detail" data-task-id={task.id}>
      {/* Header */}
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3 flex-wrap font-sans text-detail text-ink/60">
          <StateBadge state={task.state} />
          {task.scheduledFor ? (
            <span data-testid="task-scheduled">
              runs {formatScheduledTime(task.scheduledFor)}
            </span>
          ) : null}
          {task.estimatedMinutes ? <span>~{task.estimatedMinutes}m</span> : null}
        </div>
        <h1 className="font-serif font-medium text-title text-ink leading-tight">
          {task.title}
        </h1>
        {task.description ? (
          <p className="font-sans text-body text-ink/60 leading-relaxed">
            {task.description}
          </p>
        ) : null}
      </header>

      {/* Failure-mode banner */}
      {task.state === "failed" && task.errorMessage ? (
        <section
          data-testid="task-error"
          className="border border-surface-border rounded-md p-4 bg-surface"
        >
          <p className="font-sans text-detail text-earth">{task.errorMessage}</p>
        </section>
      ) : null}

      {/* Run history */}
      {task.startedAt || task.completedAt ? (
        <section
          aria-labelledby="task-run-history"
          data-testid="task-run-history"
          className="flex flex-col gap-2"
        >
          <h2
            id="task-run-history"
            className="font-sans font-medium text-label text-ink lowercase"
          >
            run history
          </h2>
          <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 font-sans text-detail text-ink/60">
            {task.startedAt ? (
              <>
                <dt className="font-mono">started</dt>
                <dd className="font-mono text-ink">{task.startedAt}</dd>
              </>
            ) : null}
            {task.completedAt ? (
              <>
                <dt className="font-mono">completed</dt>
                <dd className="font-mono text-ink">{task.completedAt}</dd>
              </>
            ) : null}
            {task.actualMinutes !== null ? (
              <>
                <dt className="font-mono">duration</dt>
                <dd className="font-mono text-ink">{task.actualMinutes}m</dd>
              </>
            ) : null}
          </dl>
        </section>
      ) : null}

      {/* Result + provenance */}
      {task.result || provenance ? (
        <section
          aria-labelledby="task-result"
          data-testid="task-result"
          className="flex flex-col gap-3"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <h2
              id="task-result"
              className="font-sans font-medium text-label text-ink lowercase"
            >
              result
            </h2>
            {provenance ? (
              <ProvenanceBadge
                voice={provenance.voice}
                by={provenance.by}
                writtenAt={provenance.writtenAt}
                source={provenance.source}
                reason={provenance.reason}
                basis={provenance.basis}
              />
            ) : null}
          </div>
          {task.result?.artifact.surfaceText ? (
            <p className="font-sans text-body text-ink leading-relaxed">
              {task.result.artifact.surfaceText}
            </p>
          ) : null}
          {task.result?.artifact.notePath ? (
            <p className="font-sans text-detail text-ink/60">
              note:{" "}
              <span className="text-ink border-b border-surface-border">
                {task.result.artifact.notePath}
              </span>
            </p>
          ) : null}
        </section>
      ) : null}

      {/* Related notes */}
      {sourceNotes.length > 0 ? (
        <section
          aria-labelledby="task-related"
          data-testid="task-related-notes"
          className="flex flex-col gap-2"
        >
          <h2
            id="task-related"
            className="font-sans font-medium text-label text-ink lowercase"
          >
            related notes
          </h2>
          <ul className="flex flex-col gap-1 font-sans text-detail" role="list">
            {sourceNotes.map((note, idx) => (
              <li key={`${note}-${idx}`} data-related-index={idx}>
                <span className="text-ink border-b border-surface-border">{note}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Footer — keyboard map + primary action live in the client island. */}
      <TaskDetailClient
        task={task}
        vaultSlug={vaultSlug}
        backHref={backHref}
        relatedCount={sourceNotes.length}
      />
    </article>
  );
}

// Small inline state badge. Color matches DESIGN.md tokens — moss for
// active/in-flight, harvest for needs-attention, earth for failed,
// ink/60 for terminal.
function StateBadge({ state }: { state: Task["state"] }): JSX.Element {
  const label =
    state === "pending"
      ? "pending"
      : state === "running"
      ? "running"
      : state === "review"
      ? "needs review"
      : state === "done"
      ? "done"
      : state === "dismissed"
      ? "dismissed"
      : "failed";
  const tone =
    state === "review"
      ? "text-harvest"
      : state === "failed"
      ? "text-earth"
      : state === "pending" || state === "running"
      ? "text-moss"
      : "text-ink/60";
  const className = [
    "inline-flex items-center bg-surface border border-surface-border rounded-sm font-mono text-detail px-1.5 py-0.5",
    tone,
  ].join(" ");
  return (
    <span className={className} data-testid="task-state-badge" data-state={state}>
      {label}
    </span>
  );
}
