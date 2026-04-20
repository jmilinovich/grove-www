"use client";

import { useState, useMemo } from "react";

// ── Types ────────────────────────────────────────────────────────────

export interface GraphHealthMetrics {
  total_notes: number;
  total_links: number;
  link_density: number;
  orphan_count: number;
  orphan_rate: number;
  broken_link_count: number;
  embedding_coverage: number;
  stale_embedding_count: number;
  missing_frontmatter: number;
  duplicate_candidates: number;
  growth_velocity_7d: number;
  growth_velocity_30d: number;
  avg_links_per_note: number;
  cluster_count: number;
  largest_cluster_pct: number;
}

export interface HealthSnapshot {
  id: string;
  measured_at: string;
  score: number;
  metrics: GraphHealthMetrics;
}

export interface HealthFlag {
  id: string;
  flag_type: string;
  source_path: string | null;
  target_path: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  resolved_at: string | null;
}

interface HealthViewProps {
  current: HealthSnapshot | null;
  history: HealthSnapshot[];
  initialFlags: HealthFlag[];
}

// ── Helpers ──────────────────────────────────────────────────────────

const GROVE_BASE = "https://grove.md";

function noteUrl(path: string): string {
  const clean = path.replace(/\.md$/, "");
  return `${GROVE_BASE}/${clean}`;
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function scoreTone(score: number): string {
  if (score >= 80) return "text-moss";
  if (score >= 50) return "text-ink";
  return "text-harvest";
}

function formatPct(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

const FLAG_META: Record<string, { label: string; description: string }> = {
  duplicate_candidate: {
    label: "Near-duplicate",
    description: "Two notes look similar enough to consider merging.",
  },
  long_orphan: {
    label: "Long orphan",
    description: "Note has had zero links for more than 90 days.",
  },
  cluster_island: {
    label: "Cluster island",
    description: "Small disconnected component (< 3 notes) cut off from the main graph.",
  },
};

// ── Sparkline ────────────────────────────────────────────────────────

function Sparkline({ history }: { history: HealthSnapshot[] }) {
  const W = 280;
  const H = 56;
  const PAD = 4;

  const { path, area, dotX, dotY } = useMemo(() => {
    if (history.length === 0) return { path: "", area: "", dotX: 0, dotY: 0 };
    const xs = history.map((_, i) =>
      history.length === 1
        ? W / 2
        : PAD + (i / (history.length - 1)) * (W - PAD * 2),
    );
    const ys = history.map((s) => {
      const clamped = Math.max(0, Math.min(100, s.score));
      return PAD + (1 - clamped / 100) * (H - PAD * 2);
    });
    const pts = xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`);
    const path = "M" + pts.join(" L");
    const area = `M${xs[0].toFixed(1)},${H} L${pts.join(" L")} L${xs[xs.length - 1].toFixed(1)},${H} Z`;
    return {
      path,
      area,
      dotX: xs[xs.length - 1],
      dotY: ys[ys.length - 1],
    };
  }, [history]);

  if (history.length === 0) {
    return (
      <div className="h-14 flex items-center justify-center text-ink/40 text-xs font-sans">
        No history yet
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-14"
      preserveAspectRatio="none"
      aria-label="Health score trend over the last 30 days"
    >
      <path d={area} fill="var(--color-moss)" fillOpacity={0.08} />
      <path
        d={path}
        fill="none"
        stroke="var(--color-moss)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={dotX} cy={dotY} r={2.5} fill="var(--color-moss)" />
    </svg>
  );
}

// ── Metric card ──────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "good" | "warn";
}) {
  const valueClass =
    tone === "good"
      ? "text-moss"
      : tone === "warn"
        ? "text-harvest"
        : "text-ink";
  return (
    <div className="bg-surface rounded-lg p-5 border border-surface-border">
      <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-3 font-sans text-xs">
        {label}
      </p>
      <p className={`font-serif font-medium text-2xl ${valueClass}`}>{value}</p>
      {sub && <p className="text-ink/40 text-xs font-sans mt-1">{sub}</p>}
    </div>
  );
}

// ── Flags list ───────────────────────────────────────────────────────

function FlagRow({
  flag,
  onDismiss,
  busy,
}: {
  flag: HealthFlag;
  onDismiss: (id: string) => void;
  busy: boolean;
}) {
  const meta = FLAG_META[flag.flag_type] ?? {
    label: flag.flag_type,
    description: "",
  };

  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center bg-harvest/15 text-harvest text-xs px-2 py-0.5 rounded font-sans">
            {meta.label}
          </span>
          <span className="text-ink/40 text-xs font-sans">
            {relativeDate(flag.created_at)}
          </span>
        </div>
        {meta.description && (
          <p className="text-ink/60 text-xs font-sans mb-2">{meta.description}</p>
        )}
        <div className="space-y-1">
          {flag.source_path && (
            <a
              href={noteUrl(flag.source_path)}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-ink/80 hover:text-ink hover:underline truncate font-sans"
            >
              {flag.source_path}
            </a>
          )}
          {flag.target_path && (
            <a
              href={noteUrl(flag.target_path)}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-ink/80 hover:text-ink hover:underline truncate font-sans"
            >
              ↔ {flag.target_path}
            </a>
          )}
        </div>
      </div>
      <button
        onClick={() => onDismiss(flag.id)}
        disabled={busy}
        className="text-xs text-ink/40 hover:text-ink font-sans px-2 py-1 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
      >
        {busy ? "Dismissing…" : "Dismiss"}
      </button>
    </div>
  );
}

// ── Main view ────────────────────────────────────────────────────────

export default function HealthView({
  current,
  history,
  initialFlags,
}: HealthViewProps) {
  const [flags, setFlags] = useState(initialFlags);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const dismissFlag = async (id: string) => {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/health/flags/${encodeURIComponent(id)}/resolve`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to dismiss flag");
        return;
      }
      setFlags((xs) => xs.filter((f) => f.id !== id));
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusyId(null);
    }
  };

  if (!current) {
    return (
      <p className="font-sans text-ink/60">
        No health snapshots yet — the daily check runs every 24h and will populate this page.
      </p>
    );
  }

  const m = current.metrics;
  const prior = history.length > 1 ? history[history.length - 2] : null;
  const delta = prior ? current.score - prior.score : 0;
  const coverageKnown = m.embedding_coverage >= 0;

  return (
    <div className="space-y-10">
      {/* Score + sparkline */}
      <div className="bg-surface rounded-lg border border-surface-border p-6 flex items-end gap-8">
        <div className="flex-shrink-0">
          <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-3 font-sans text-xs">
            Health score
          </p>
          <div className="flex items-baseline gap-3">
            <p className={`font-serif font-medium text-6xl ${scoreTone(current.score)}`}>
              {current.score}
            </p>
            <p className="text-ink/40 font-serif text-2xl">/ 100</p>
          </div>
          <p className="text-ink/40 text-xs font-sans mt-2">
            Measured {relativeDate(current.measured_at)}
            {prior && delta !== 0 && (
              <>
                {" · "}
                <span className={delta > 0 ? "text-moss" : "text-harvest"}>
                  {delta > 0 ? "+" : ""}
                  {delta} vs prior
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-3 font-sans text-xs">
            30-day trend
          </p>
          <Sparkline history={history} />
        </div>
      </div>

      {/* Metric cards */}
      <div>
        <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-4 font-sans text-xs">
          Metrics
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Orphan rate"
            value={formatPct(m.orphan_rate)}
            sub={`${m.orphan_count.toLocaleString()} of ${m.total_notes.toLocaleString()} notes`}
            tone={m.orphan_rate < 0.05 ? "good" : m.orphan_rate > 0.15 ? "warn" : "neutral"}
          />
          <MetricCard
            label="Broken links"
            value={m.broken_link_count.toLocaleString()}
            sub={`of ${m.total_links.toLocaleString()} total`}
            tone={m.broken_link_count === 0 ? "good" : m.broken_link_count > 20 ? "warn" : "neutral"}
          />
          <MetricCard
            label="Embedding coverage"
            value={coverageKnown ? formatPct(m.embedding_coverage, 0) : "—"}
            sub={
              coverageKnown
                ? m.stale_embedding_count > 0
                  ? `${m.stale_embedding_count.toLocaleString()} stale`
                  : "all fresh"
                : "index unavailable"
            }
            tone={
              !coverageKnown
                ? "neutral"
                : m.embedding_coverage > 0.95
                  ? "good"
                  : m.embedding_coverage < 0.8
                    ? "warn"
                    : "neutral"
            }
          />
          <MetricCard
            label="Link density"
            value={m.link_density.toFixed(2)}
            sub="avg links per note"
            tone={m.link_density > 2 ? "good" : m.link_density < 1 ? "warn" : "neutral"}
          />
        </div>
      </div>

      {/* Secondary metrics */}
      <div>
        <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-4 font-sans text-xs">
          Graph shape
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Clusters"
            value={m.cluster_count.toLocaleString()}
            sub={`largest ${formatPct(m.largest_cluster_pct, 0)}`}
          />
          <MetricCard
            label="Missing frontmatter"
            value={m.missing_frontmatter.toLocaleString()}
            tone={m.missing_frontmatter === 0 ? "good" : m.missing_frontmatter > 10 ? "warn" : "neutral"}
          />
          <MetricCard
            label="Growth (7d)"
            value={`+${m.growth_velocity_7d}`}
            sub={`+${m.growth_velocity_30d} over 30d`}
            tone={m.growth_velocity_7d > 0 ? "good" : "neutral"}
          />
          <MetricCard
            label="Duplicate candidates"
            value={m.duplicate_candidates.toLocaleString()}
            sub="similarity > 0.85"
          />
        </div>
      </div>

      {/* Flags */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <p className="text-ink/40 text-label tracking-[0.15em] uppercase font-sans text-xs">
            Flags to review
          </p>
          {flags.length > 0 && (
            <p className="text-ink/40 text-xs font-sans">
              {flags.length} pending
            </p>
          )}
        </div>

        {error && (
          <p className="mb-3 text-xs text-harvest font-sans">{error}</p>
        )}

        {flags.length === 0 ? (
          <div className="border border-surface-border bg-surface rounded-lg p-8 text-center">
            <p className="text-ink/60 font-sans text-sm">
              No open flags. Auto-healing handled what it could; the rest is clean.
            </p>
          </div>
        ) : (
          <div className="border border-surface-border bg-surface rounded-lg divide-y divide-surface-border">
            {flags.map((flag) => (
              <FlagRow
                key={flag.id}
                flag={flag}
                onDismiss={dismissFlag}
                busy={busyId === flag.id}
              />
            ))}
          </div>
        )}

        <p className="text-ink/40 text-xs font-sans mt-3">
          Auto-healed fixes (broken links to renamed notes, stale embeddings, missing tags) are logged server-side and don&apos;t appear here — only issues that need human review do.
        </p>
      </div>
    </div>
  );
}
