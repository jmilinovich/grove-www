"use client";

import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────

interface NoteRef {
  name: string;
  path: string;
  created?: string;
  last_modified?: string;
}

interface StageData {
  count: number;
  notes?: NoteRef[];
}

export interface GardenDigest {
  total: number;
  seeds: StageData;
  sprouts: StageData;
  growing: StageData;
  mature: { count: number };
  dormant: StageData;
  withering: StageData;
  recently_active: { name: string; path: string; modified: string }[];
}

// ── Constants ──────────────────────────────────────────────────────────

type Stage = "seeds" | "sprouts" | "growing" | "mature" | "dormant" | "withering";

const STAGE_ORDER: Stage[] = ["seeds", "sprouts", "growing", "mature", "dormant", "withering"];

const STAGE_META: Record<
  Stage,
  { label: string; barClass: string; description: string }
> = {
  seeds: {
    label: "Seeds",
    barClass: "bg-moss/40",
    description: "New notes, created within the last week, with few words and few links. Raw ideas waiting to sprout.",
  },
  sprouts: {
    label: "Sprouts",
    barClass: "bg-moss",
    description: "Notes created within the last month, not yet well-connected. Starting to take shape.",
  },
  growing: {
    label: "Growing",
    barClass: "bg-ink",
    description: "Actively developed notes — recently modified or actively linked. The living core of the garden.",
  },
  mature: {
    label: "Mature",
    barClass: "bg-ink/60",
    description: "Stable, well-connected notes that haven't needed attention in a while. Settled knowledge.",
  },
  dormant: {
    label: "Dormant",
    barClass: "bg-ink/40",
    description: "Notes untouched for 180+ days. Still part of the graph, but not actively growing.",
  },
  withering: {
    label: "Withering",
    barClass: "bg-harvest/40",
    description: "Old notes with few incoming links, untouched for 180+ days. May need pruning or revival.",
  },
};

const GROVE_BASE = "https://grove.md";

function noteUrl(path: string): string {
  // path is like "Resources/Concepts/foo.md" → strip .md
  const clean = path.replace(/\.md$/, "");
  return `${GROVE_BASE}/${clean}`;
}

function relativeDate(iso: string | undefined): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// ── Stage Card ─────────────────────────────────────────────────────────

const SHOW_INITIAL = 10;

function StageCard({
  stage,
  data,
  total,
  isSelected,
  onClick,
}: {
  stage: Stage;
  data: StageData | { count: number };
  total: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = STAGE_META[stage];
  const count = data.count;
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
  const notes = "notes" in data ? (data.notes ?? []) : [];
  const visible = expanded ? notes : notes.slice(0, SHOW_INITIAL);

  return (
    <div
      className={[
        "border rounded-lg p-5 transition-colors",
        isSelected
          ? "border-ink/40 bg-surface"
          : "border-surface-border bg-surface hover:border-ink/20 cursor-pointer",
      ].join(" ")}
      onClick={!isSelected ? onClick : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${meta.barClass}`} />
          <h2 className="font-serif font-medium text-lg text-ink">{meta.label}</h2>
        </div>
        <div className="text-right">
          <span className="font-serif font-medium text-2xl text-ink">{count}</span>
          <span className="text-ink/40 text-sm ml-1">{pct}%</span>
        </div>
      </div>

      <p className="text-ink/60 text-sm font-sans mb-4 leading-relaxed">{meta.description}</p>

      {/* Notes list */}
      {notes.length > 0 ? (
        <div className="space-y-1">
          {visible.map((note) => (
            <div
              key={note.path}
              className="flex items-center justify-between py-0.5 gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <a
                href={noteUrl(note.path)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-ink/80 hover:text-ink hover:underline truncate flex-1 font-sans"
              >
                {note.name}
              </a>
              <span className="text-ink/40 text-xs font-sans flex-shrink-0">
                {relativeDate(note.created ?? note.last_modified)}
              </span>
            </div>
          ))}

          {notes.length > SHOW_INITIAL && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((x) => !x);
              }}
              className="mt-2 text-xs text-ink/40 hover:text-ink/60 font-sans transition-colors"
            >
              {expanded ? "Show less" : `Show all ${notes.length}`}
            </button>
          )}
        </div>
      ) : count > 0 && stage === "mature" ? (
        <p className="text-sm text-ink/40 font-sans">
          {count} mature {count === 1 ? "note" : "notes"} — well-connected and stable.
        </p>
      ) : null}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

export default function LifecycleView({ digest }: { digest: GardenDigest }) {
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);

  const total = digest.total;

  return (
    <div className="space-y-8">
      {/* Hero bar */}
      <div>
        <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-4 text-xs font-sans">
          Garden lifecycle
        </p>
        <div className="flex h-4 rounded-full overflow-hidden gap-px">
          {STAGE_ORDER.map((stage) => {
            const count =
              stage === "mature"
                ? digest.mature.count
                : (digest[stage] as StageData).count;
            const width = total > 0 ? ((count / total) * 100).toFixed(2) : "0";
            if (count === 0) return null;
            return (
              <button
                key={stage}
                className={[
                  STAGE_META[stage].barClass,
                  "transition-opacity hover:opacity-80 cursor-pointer",
                  selectedStage === stage ? "ring-1 ring-ink/40" : "",
                ].join(" ")}
                style={{ width: `${width}%` }}
                title={`${STAGE_META[stage].label}: ${count} (${((count / total) * 100).toFixed(1)}%)`}
                onClick={() =>
                  setSelectedStage((s) => (s === stage ? null : stage))
                }
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
          {STAGE_ORDER.map((stage) => {
            const count =
              stage === "mature"
                ? digest.mature.count
                : (digest[stage] as StageData).count;
            if (count === 0) return null;
            return (
              <button
                key={stage}
                onClick={() =>
                  setSelectedStage((s) => (s === stage ? null : stage))
                }
                className={[
                  "flex items-center gap-1.5 text-xs font-sans transition-opacity",
                  selectedStage && selectedStage !== stage
                    ? "opacity-40"
                    : "opacity-100",
                ].join(" ")}
              >
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${STAGE_META[stage].barClass}`} />
                <span className="text-ink/60">{STAGE_META[stage].label}</span>
                <span className="text-ink font-medium">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-surface-border bg-surface rounded-lg p-4">
          <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-2 text-xs font-sans">
            Total classified
          </p>
          <p className="font-serif font-medium text-2xl text-ink">{total}</p>
        </div>
        <div className="border border-surface-border bg-surface rounded-lg p-4">
          <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-2 text-xs font-sans">
            Active (seeds–growing)
          </p>
          <p className="font-serif font-medium text-2xl text-ink">
            {digest.seeds.count + digest.sprouts.count + digest.growing.count}
          </p>
        </div>
        <div className="border border-surface-border bg-surface rounded-lg p-4">
          <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-2 text-xs font-sans">
            Needs attention
          </p>
          <p className={[
            "font-serif font-medium text-2xl",
            digest.withering.count > 0 ? "text-harvest" : "text-ink",
          ].join(" ")}>
            {digest.withering.count}
          </p>
        </div>
      </div>

      {/* Stage cards */}
      <div>
        <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-4 text-xs font-sans">
          By stage
        </p>
        <div className="space-y-4">
          {STAGE_ORDER.map((stage) => {
            const data =
              stage === "mature"
                ? digest.mature
                : (digest[stage] as StageData);
            if (data.count === 0) return null;
            const isSelected = selectedStage === stage;
            const isFiltered = selectedStage !== null && !isSelected;
            return (
              <div
                key={stage}
                className={[
                  "transition-opacity",
                  isFiltered ? "opacity-40" : "opacity-100",
                ].join(" ")}
              >
                <StageCard
                  stage={stage}
                  data={data}
                  total={total}
                  isSelected={isSelected}
                  onClick={() =>
                    setSelectedStage((s) => (s === stage ? null : stage))
                  }
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Recently active */}
      {digest.recently_active.length > 0 && (
        <div>
          <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-4 text-xs font-sans">
            Recently active
          </p>
          <div className="border border-surface-border bg-surface rounded-lg divide-y divide-surface-border">
            {digest.recently_active.map((note) => (
              <div
                key={note.path}
                className="flex items-center justify-between px-5 py-3 gap-4"
              >
                <a
                  href={noteUrl(note.path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-ink/80 hover:text-ink hover:underline truncate font-sans"
                >
                  {note.name}
                </a>
                <span className="text-ink/40 text-xs font-sans flex-shrink-0">
                  {relativeDate(note.modified)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
