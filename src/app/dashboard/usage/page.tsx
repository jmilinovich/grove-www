import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

const TOOL_NAMES = [
  "query",
  "get",
  "multi_get",
  "write_note",
  "list_notes",
  "vault_status",
] as const;

interface ToolStats {
  count: number;
  errors: number;
  error_rate: number;
  latency_p50: number;
  latency_p95: number;
  latency_p99: number;
}

interface SearchStats {
  queries_1h: number;
  avg_latency_ms: number;
  zero_result_rate: number;
}

interface Metrics {
  total_requests: number;
  error_rate: number;
  uptime_seconds: number;
  by_tool: Record<string, ToolStats>;
  search?: SearchStats;
}

async function fetchMetrics(apiKey: string): Promise<Metrics | null> {
  try {
    const res = await fetch(`${API_URL}/metrics`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return h > 0 ? `${d}d ${h}h` : `${d}d`;
}

function formatLatency(ms: number): string {
  if (ms === 0) return "—";
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}

export const metadata = {
  title: "Usage — Grove",
};

export default async function UsagePage() {
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) redirect("/login?redirect=/dashboard/usage");

  const metrics = await fetchMetrics(apiKey);

  const isEmpty =
    !metrics ||
    (metrics.total_requests === 0 && Object.keys(metrics.by_tool ?? {}).length === 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="font-serif font-medium text-2xl text-ink mb-8">Usage</h1>

      {isEmpty ? (
        <p className="font-sans text-ink/60">
          No data yet — metrics populate after the first request.
        </p>
      ) : (
        <div className="space-y-10">
          {/* Top row — big numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-surface rounded-lg p-6 border border-surface-border">
              <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-4 font-sans text-xs">
                Total Requests
              </p>
              <p className="text-4xl font-serif font-medium text-ink">
                {(metrics!.total_requests ?? 0).toLocaleString()}
              </p>
            </div>

            <div className="bg-surface rounded-lg p-6 border border-surface-border">
              <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-4 font-sans text-xs">
                Error Rate
              </p>
              <p className="text-4xl font-serif font-medium text-ink">
                {((metrics!.error_rate ?? 0) * 100).toFixed(1)}
                <span className="text-2xl text-ink/60">%</span>
              </p>
            </div>

            <div className="bg-surface rounded-lg p-6 border border-surface-border">
              <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-4 font-sans text-xs">
                Uptime
              </p>
              <p className="text-4xl font-serif font-medium text-ink">
                {formatUptime(metrics!.uptime_seconds ?? 0)}
              </p>
            </div>
          </div>

          {/* Tool breakdown */}
          {metrics!.by_tool && Object.keys(metrics!.by_tool).length > 0 && (
            <div>
              <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-4 font-sans text-xs">
                By Tool
              </p>
              <table className="w-full font-sans text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="text-ink/40 font-normal pb-3 pr-8">Tool</th>
                    <th className="text-ink/40 font-normal pb-3 pr-8 text-right">Requests</th>
                    <th className="text-ink/40 font-normal pb-3 pr-8 text-right">Errors</th>
                    <th className="text-ink/40 font-normal pb-3 pr-8 text-right">p50</th>
                    <th className="text-ink/40 font-normal pb-3 pr-8 text-right">p95</th>
                    <th className="text-ink/40 font-normal pb-3 text-right">p99</th>
                  </tr>
                </thead>
                <tbody>
                  {TOOL_NAMES.filter((name) => name in metrics!.by_tool).map((name) => {
                    const tool = metrics!.by_tool[name];
                    return (
                      <tr key={name} className="border-t border-surface-border">
                        <td className="py-3 pr-8 text-ink font-mono text-xs">{name}</td>
                        <td className="py-3 pr-8 text-ink/60 text-right">
                          {(tool.count ?? 0).toLocaleString()}
                        </td>
                        <td className="py-3 pr-8 text-right">
                          <span className={(tool.errors ?? 0) > 0 ? "text-harvest" : "text-ink/60"}>
                            {(tool.errors ?? 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 pr-8 text-ink/60 text-right">
                          {formatLatency(tool.latency_p50 ?? 0)}
                        </td>
                        <td className="py-3 pr-8 text-ink/60 text-right">
                          {formatLatency(tool.latency_p95 ?? 0)}
                        </td>
                        <td className="py-3 text-ink/60 text-right">
                          {formatLatency(tool.latency_p99 ?? 0)}
                        </td>
                      </tr>
                    );
                  })}
                  {Object.entries(metrics!.by_tool)
                    .filter(([name]) => !TOOL_NAMES.includes(name as (typeof TOOL_NAMES)[number]))
                    .map(([name, tool]) => (
                      <tr key={name} className="border-t border-surface-border">
                        <td className="py-3 pr-8 text-ink font-mono text-xs">{name}</td>
                        <td className="py-3 pr-8 text-ink/60 text-right">
                          {(tool.count ?? 0).toLocaleString()}
                        </td>
                        <td className="py-3 pr-8 text-right">
                          <span className={(tool.errors ?? 0) > 0 ? "text-harvest" : "text-ink/60"}>
                            {(tool.errors ?? 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 pr-8 text-ink/60 text-right">
                          {formatLatency(tool.latency_p50 ?? 0)}
                        </td>
                        <td className="py-3 pr-8 text-ink/60 text-right">
                          {formatLatency(tool.latency_p95 ?? 0)}
                        </td>
                        <td className="py-3 text-ink/60 text-right">
                          {formatLatency(tool.latency_p99 ?? 0)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Search stats */}
          {metrics!.search && (
            <div>
              <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-4 font-sans text-xs">
                Search
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-surface rounded-lg p-6 border border-surface-border">
                  <p className="text-ink/40 font-sans text-xs mb-2">Queries (last hour)</p>
                  <p className="text-2xl font-serif font-medium text-ink">
                    {(metrics!.search.queries_1h ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-surface rounded-lg p-6 border border-surface-border">
                  <p className="text-ink/40 font-sans text-xs mb-2">Avg latency</p>
                  <p className="text-2xl font-serif font-medium text-ink">
                    {formatLatency(metrics!.search.avg_latency_ms ?? 0)}
                  </p>
                </div>
                <div className="bg-surface rounded-lg p-6 border border-surface-border">
                  <p className="text-ink/40 font-sans text-xs mb-2">Zero-result rate</p>
                  <p className="text-2xl font-serif font-medium text-ink">
                    {((metrics!.search.zero_result_rate ?? 0) * 100).toFixed(1)}
                    <span className="text-lg text-ink/60">%</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
