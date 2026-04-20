import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

interface VaultStats {
  vault?: {
    total_notes?: number;
    by_type?: Record<string, number>;
  };
  freshness?: {
    velocity_7d?: number;
    today?: number;
    stale_90d?: number;
  };
  index?: {
    indexed_docs?: number;
    vault_docs?: number;
    drift?: number;
    embedding_coverage?: number;
  };
  lifecycle?: {
    seeds?: number;
    sprouts?: number;
    growing?: number;
    mature?: number;
    dormant?: number;
    withering?: number;
  };
  git?: {
    last_commit_at?: string;
    last_commit_msg?: string;
    uncommitted_changes?: number;
  } | null;
}

interface Metrics {
  started_at?: string;
  uptime_seconds?: number;
  total_requests?: number;
  health?: string;
}

async function fetchStats(apiKey: string): Promise<VaultStats | null> {
  try {
    const res = await fetch(`${API_URL}/v1/stats`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchMetrics(apiKey: string): Promise<Metrics | null> {
  try {
    const res = await fetch(`${API_URL}/metrics`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function relativeTime(iso: string | undefined | null): string {
  if (!iso) return "N/A";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatUptime(seconds: number | undefined): string {
  if (!seconds) return "N/A";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function pct(n: number | undefined): string {
  if (n === undefined || n === null) return "N/A";
  return `${(n * 100).toFixed(1)}%`;
}

function na(v: number | string | undefined | null): string {
  if (v === undefined || v === null) return "N/A";
  return String(v);
}

const LIFECYCLE_COLORS: Record<string, string> = {
  seeds: "bg-harvest/60",
  sprouts: "bg-moss/60",
  growing: "bg-moss",
  mature: "bg-ink/60",
  dormant: "bg-ink/40",
  withering: "bg-harvest/40",
};

const LIFECYCLE_LABELS: Record<string, string> = {
  seeds: "Seeds",
  sprouts: "Sprouts",
  growing: "Growing",
  mature: "Mature",
  dormant: "Dormant",
  withering: "Withering",
};

export const metadata = {
  title: "Dashboard — Grove",
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) redirect("/login?redirect=/dashboard");

  const [stats, metrics] = await Promise.all([
    fetchStats(apiKey),
    fetchMetrics(apiKey),
  ]);

  const lifecycle = stats?.lifecycle;
  const lifecycleTotal = lifecycle
    ? Object.values(lifecycle).reduce((a, b) => a + (b ?? 0), 0)
    : 0;

  const topTypes = stats?.vault?.by_type
    ? Object.entries(stats.vault.by_type)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
    : [];

  return (
    <div>
      <h1 className="font-serif font-medium text-xl text-ink mb-8">Vault overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Notes */}
        <div className="border border-surface-border bg-surface rounded-lg p-5">
          <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-4">Notes</p>
          <p className="font-serif font-medium text-2xl text-ink mb-3">
            {na(stats?.vault?.total_notes)}
          </p>
          {topTypes.length > 0 ? (
            <ul className="space-y-1">
              {topTypes.map(([type, count]) => (
                <li key={type} className="flex justify-between text-sm">
                  <span className="text-ink/60 capitalize">{type}</span>
                  <span className="text-ink font-medium">{count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink/40">No type data</p>
          )}
        </div>

        {/* Freshness */}
        <div className="border border-surface-border bg-surface rounded-lg p-5">
          <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-4">Freshness</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-ink/60">Velocity (7d)</span>
              <span className="text-ink font-medium">{na(stats?.freshness?.velocity_7d)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink/60">Today</span>
              <span className="text-ink font-medium">{na(stats?.freshness?.today)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink/60">Stale (90d+)</span>
              <span className="text-ink font-medium">{na(stats?.freshness?.stale_90d)}</span>
            </div>
          </div>
        </div>

        {/* Search index */}
        <div className="border border-surface-border bg-surface rounded-lg p-5">
          <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-4">Search index</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-ink/60">Indexed / Total</span>
              <span className="text-ink font-medium">
                {stats?.index
                  ? `${na(stats.index.indexed_docs)} / ${na(stats.index.vault_docs)}`
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink/60">Drift</span>
              <span className="text-ink font-medium">{pct(stats?.index?.drift)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink/60">Embedding coverage</span>
              <span className="text-ink font-medium">{pct(stats?.index?.embedding_coverage)}</span>
            </div>
          </div>
        </div>

        {/* Lifecycle */}
        <div className="border border-surface-border bg-surface rounded-lg p-5">
          <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-4">Lifecycle</p>
          {lifecycle && lifecycleTotal > 0 ? (
            <>
              <div className="flex h-2 rounded-full overflow-hidden gap-px mb-4">
                {(["seeds", "sprouts", "growing", "mature", "dormant", "withering"] as const).map((stage) => {
                  const count = lifecycle[stage] ?? 0;
                  const width = ((count / lifecycleTotal) * 100).toFixed(1);
                  if (count === 0) return null;
                  return (
                    <div
                      key={stage}
                      className={LIFECYCLE_COLORS[stage]}
                      style={{ width: `${width}%` }}
                      title={`${LIFECYCLE_LABELS[stage]}: ${count}`}
                    />
                  );
                })}
              </div>
              <ul className="space-y-1">
                {(["seeds", "sprouts", "growing", "mature", "dormant", "withering"] as const).map((stage) => {
                  const count = lifecycle[stage] ?? 0;
                  if (count === 0) return null;
                  return (
                    <li key={stage} className="flex justify-between text-sm">
                      <span className="text-ink/60">{LIFECYCLE_LABELS[stage]}</span>
                      <span className="text-ink font-medium">{count}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="text-sm text-ink/40">No lifecycle data</p>
          )}
        </div>

        {/* Git */}
        <div className="border border-surface-border bg-surface rounded-lg p-5">
          <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-4">Git</p>
          {stats?.git ? (
            <div className="space-y-2">
              <p className="text-sm text-ink font-medium truncate" title={stats.git.last_commit_msg}>
                {stats.git.last_commit_msg ?? "N/A"}
              </p>
              <div className="flex justify-between text-sm">
                <span className="text-ink/60">Last commit</span>
                <span className="text-ink">{relativeTime(stats.git.last_commit_at)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink/60">Uncommitted</span>
                <span className={stats.git.uncommitted_changes ? "text-harvest font-medium" : "text-ink"}>
                  {na(stats.git.uncommitted_changes)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink/40">No git data</p>
          )}
        </div>

        {/* System */}
        <div className="border border-surface-border bg-surface rounded-lg p-5">
          <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-4">System</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span
                className={[
                  "inline-block w-2 h-2 rounded-full",
                  metrics ? "bg-moss" : "bg-ink/40",
                ].join(" ")}
              />
              <span className="text-ink/60">Health</span>
              <span className="text-ink font-medium ml-auto">
                {metrics ? "online" : "unreachable"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink/60">Uptime</span>
              <span className="text-ink">{formatUptime(metrics?.uptime_seconds)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink/60">Total requests</span>
              <span className="text-ink">{na(metrics?.total_requests)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
