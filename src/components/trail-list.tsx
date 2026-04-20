"use client";

import Link from "next/link";
import { useState, useCallback, useEffect } from "react";

interface Trail {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  allow_tags: string[];
  deny_tags: string[];
  allow_types: string[];
  deny_types: string[];
  allow_paths: string[];
  deny_paths: string[];
  rate_limit_reads: number | null;
  rate_limit_writes: number | null;
  created_at: string;
}

function EnabledBadge({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
        enabled ? "bg-moss/15 text-moss" : "bg-surface text-ink/40"
      }`}
    >
      {enabled ? "Enabled" : "Disabled"}
    </span>
  );
}

function TagBadge({ tag, deny }: { tag: string; deny?: boolean }) {
  if (deny) {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-surface text-ink/40 line-through">
        {tag}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-moss/15 text-moss">
      {tag}
    </span>
  );
}

function PathChip({ path, deny }: { path: string; deny?: boolean }) {
  return (
    <code
      className={`text-xs px-1.5 py-0.5 rounded font-mono ${
        deny ? "text-ink/40 bg-surface line-through" : "text-foreground bg-surface"
      }`}
    >
      {path}
    </code>
  );
}

interface TrailUsageData {
  trail_id: string;
  name: string;
  requests: number;
  reads: number;
  writes: number;
  last_request_at: string | null;
}

function TrailUsagePanel({ trailId }: { trailId: string }) {
  const [usage, setUsage] = useState<TrailUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/admin/trails/${encodeURIComponent(trailId)}/usage`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setUsage(data as TrailUsageData);
      })
      .catch(() => setError("Failed to load usage"))
      .finally(() => setLoading(false));
  }, [trailId]);

  if (loading) {
    return (
      <div className="mt-4 pt-4 border-t border-surface-border">
        <p className="text-xs text-ink/40">Loading usage...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 pt-4 border-t border-surface-border">
        <p className="text-xs text-ink/40">{error}</p>
      </div>
    );
  }

  const lastSeen = usage?.last_request_at
    ? new Date(usage.last_request_at).toLocaleString()
    : "Never";

  return (
    <div className="mt-4 pt-4 border-t border-surface-border">
      <p className="text-ink/40 text-[10px] tracking-[0.15em] uppercase font-medium mb-3">
        Usage
      </p>
      <div className="flex flex-wrap gap-6 text-xs text-ink/60">
        <span>
          <span className="font-medium text-foreground">{usage?.requests ?? 0}</span>
          {" requests"}
        </span>
        <span>
          <span className="font-medium text-foreground">{usage?.reads ?? 0}</span>
          {" reads"}
        </span>
        <span>
          <span className="font-medium text-foreground">{usage?.writes ?? 0}</span>
          {" writes"}
        </span>
        <span className="text-ink/40">
          {"Last: "}
          <span className="text-ink/60">{lastSeen}</span>
        </span>
      </div>
    </div>
  );
}

function TrailCard({
  trail,
  onToggle,
  onDelete,
}: {
  trail: Trail;
  onToggle: (id: string, enabled: boolean) => Promise<void>;
  onDelete: (id: string) => void;
}) {
  const [toggling, setToggling] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showUsage, setShowUsage] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await onToggle(trail.id, !trail.enabled);
    } finally {
      setToggling(false);
    }
  };

  const hasAllowTags = trail.allow_tags.length > 0;
  const hasDenyTags = trail.deny_tags.length > 0;
  const hasAllowPaths = trail.allow_paths.length > 0;
  const hasDenyPaths = trail.deny_paths.length > 0;
  const hasRateLimits = trail.rate_limit_reads != null || trail.rate_limit_writes != null;

  return (
    <div className="rounded-lg border border-surface-border bg-surface/30 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="font-serif text-lg font-medium text-foreground leading-snug">
              {trail.name}
            </h2>
            <EnabledBadge enabled={trail.enabled} />
          </div>
          {trail.description && (
            <p className="text-sm text-ink/60 leading-relaxed">{trail.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/dashboard/trails/${encodeURIComponent(trail.id)}`}
            className="text-xs font-medium text-moss hover:text-moss/60 transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={() => setShowUsage((v) => !v)}
            className="text-xs text-ink/40 hover:text-foreground transition-colors"
          >
            {showUsage ? "Hide usage" : "Usage"}
          </button>
          <button
            onClick={handleToggle}
            disabled={toggling}
            className="text-xs font-medium text-moss hover:text-moss/60 transition-colors disabled:opacity-50"
          >
            {toggling ? "..." : trail.enabled ? "Disable" : "Enable"}
          </button>
          {confirmDelete ? (
            <span className="inline-flex items-center gap-2">
              <span className="text-xs text-ink/40">Sure?</span>
              <button
                onClick={() => onDelete(trail.id)}
                className="text-xs text-harvest font-medium hover:underline"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-ink/40 hover:text-foreground"
              >
                No
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-ink/40 hover:text-harvest transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Tags */}
      {(hasAllowTags || hasDenyTags) && (
        <div className="mb-3">
          <p className="text-ink/40 text-[10px] tracking-[0.15em] uppercase font-medium mb-1.5">
            Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {trail.allow_tags.map((t) => (
              <TagBadge key={t} tag={t} />
            ))}
            {trail.deny_tags.map((t) => (
              <TagBadge key={t} tag={t} deny />
            ))}
          </div>
        </div>
      )}

      {/* Paths */}
      {(hasAllowPaths || hasDenyPaths) && (
        <div className="mb-3">
          <p className="text-ink/40 text-[10px] tracking-[0.15em] uppercase font-medium mb-1.5">
            Paths
          </p>
          <div className="flex flex-wrap gap-1.5">
            {trail.allow_paths.map((p) => (
              <PathChip key={p} path={p} />
            ))}
            {trail.deny_paths.map((p) => (
              <PathChip key={p} path={p} deny />
            ))}
          </div>
        </div>
      )}

      {/* Rate limits */}
      {hasRateLimits && (
        <div>
          <p className="text-ink/40 text-[10px] tracking-[0.15em] uppercase font-medium mb-1.5">
            Rate limits
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-ink/60">
            {trail.rate_limit_reads != null && (
              <span>
                <span className="font-medium text-foreground">{trail.rate_limit_reads}</span>
                {" reads/min"}
              </span>
            )}
            {trail.rate_limit_writes != null && (
              <span>
                <span className="font-medium text-foreground">{trail.rate_limit_writes}</span>
                {" writes/min"}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Usage panel — lazy loaded on expand */}
      {showUsage && <TrailUsagePanel trailId={trail.id} />}
    </div>
  );
}

export default function TrailList({ initialTrails }: { initialTrails: Trail[] }) {
  const [trails, setTrails] = useState(initialTrails);

  const handleToggle = useCallback(async (id: string, enabled: boolean) => {
    const res = await fetch("/api/admin/trails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", id, enabled }),
    });
    if (res.ok) {
      setTrails((prev) =>
        prev.map((t) => (t.id === id ? { ...t, enabled } : t))
      );
    }
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      const res = await fetch("/api/admin/trails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      if (res.ok) {
        setTrails((prev) => prev.filter((t) => t.id !== id));
      }
    },
    []
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-title font-medium tracking-[-0.015em]">Trails</h1>
        <Link
          href="/dashboard/trails/new"
          className="bg-ink text-cream rounded px-7 py-3.5 text-sm font-medium hover:bg-earth transition-colors active:scale-[0.98]"
        >
          Create trail
        </Link>
      </div>

      {/* Trail cards */}
      {trails.length === 0 ? (
        <div className="rounded-lg border border-surface-border bg-surface/30 px-6 py-12 text-center">
          <p className="text-ink/40">No trails. Create one to share your knowledge.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {trails.map((trail) => (
            <TrailCard
              key={trail.id}
              trail={trail}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
