import type { JSX } from "react";
import type { GroveProvenance } from "@/lib/grove-api.v2.types";
import { ProvenanceBadge } from "@/components/primitives/provenance-badge";

// W3-PROV-1 — ProvenanceStrip: inline column of read-only ProvenanceBadge chips
// rendered next to AI-touched segments of a note, with a footer deeplink to the
// backlog when perishable segments are present.
//
// Scope (per PLAN.md W3-PROV-1 task block):
//   - Render one ProvenanceBadge per AI-authored segment (voice !== 'legacy-unknown').
//   - Hide segments authored without provenance signal ('legacy-unknown').
//   - When at least one segment is perishable, show a footer link:
//       "this note has N perishable segments — review in your queue ›"
//     The link's href is a placeholder for v2 — it lands on the backlog
//     homepage `/{atHandle}/{vault}`. Filter logic is deferred to v3.
//   - Return null entirely when there are no AI-authored segments to display.
//
// Read-only by design. No popover/interactive toggling beyond the badge itself
// (the badge is itself a disclosure button — that mechanic is owned by
// W1-PRIM-1 ProvenanceBadge).
//
// Integration (deferred — coordinated with the existing markdown rendering
// pipeline in `src/app/(resident)/[atHandle]/[vaultSlug]/[...path]/page.tsx`):
//   The host page should:
//     1. Pull `blame: Array<{ lineStart, lineEnd, provenance }>` from the
//        v2 grove API on the note (api.grove.md `provenance_blame` schema).
//     2. Compute `totalLines` from the rendered markdown source.
//     3. Render <ProvenanceStrip blame={blame} totalLines={totalLines}
//          atHandle={atHandle} vault={vaultSlug} /> in a gutter column
//        beside the markdown body — likely a flex/grid sibling so the
//        badges align with their segments' top edge. Visual alignment of
//        each badge to its `lineStart` is a layout concern for the host
//        page and is intentionally out of scope here (the strip currently
//        renders badges in source order; positional anchoring lands when
//        the markdown pipeline exposes per-line offsets).
//
// Why this lives in components/notes/ and not primitives/:
//   - It composes a primitive (ProvenanceBadge) with note-domain concepts
//     (blame, segments, backlog deeplink) — that's an aggregate, not a primitive.

export interface ProvenanceBlameEntry {
  lineStart: number;
  lineEnd: number;
  provenance: GroveProvenance;
}

interface ProvenanceStripProps {
  blame: ProvenanceBlameEntry[];
  totalLines: number;
  /** Resident at-handle (e.g. "@jm") used to construct the backlog deeplink. */
  atHandle?: string;
  /** Vault slug used to construct the backlog deeplink. */
  vault?: string;
}

export function ProvenanceStrip({
  blame,
  totalLines: _totalLines,
  atHandle,
  vault,
}: ProvenanceStripProps): JSX.Element | null {
  // `totalLines` is intentionally accepted but unused at this scope; the host
  // page uses it for proportional/positional layout in the gutter. Accepting
  // it on the component contract keeps wiring stable for the integration step.
  void _totalLines;

  const aiAuthored = blame.filter(
    (entry) => entry.provenance.voice !== "legacy-unknown",
  );

  if (aiAuthored.length === 0) {
    return null;
  }

  const perishableCount = aiAuthored.reduce(
    (count, entry) => (entry.provenance.voice === "perishable" ? count + 1 : count),
    0,
  );

  const backlogHref =
    atHandle && vault ? `/${atHandle}/${vault}` : "#";

  const perishableLabel =
    perishableCount === 1
      ? "this note has 1 perishable segment — review in your queue ›"
      : `this note has ${perishableCount} perishable segments — review in your queue ›`;

  return (
    <aside
      aria-label="Provenance"
      className="flex flex-col gap-2 font-sans text-detail"
    >
      <ul className="flex flex-col gap-1 list-none p-0 m-0">
        {aiAuthored.map((entry, idx) => (
          <li
            key={`${entry.lineStart}-${entry.lineEnd}-${idx}`}
            data-line-start={entry.lineStart}
            data-line-end={entry.lineEnd}
          >
            <ProvenanceBadge
              voice={entry.provenance.voice}
              by={entry.provenance.by}
              writtenAt={entry.provenance.writtenAt}
              source={entry.provenance.source}
              reason={entry.provenance.reason}
              basis={entry.provenance.basis}
            />
          </li>
        ))}
      </ul>
      {perishableCount > 0 ? (
        <a
          href={backlogHref}
          className="font-sans text-detail text-harvest"
        >
          {perishableLabel}
        </a>
      ) : null}
    </aside>
  );
}
