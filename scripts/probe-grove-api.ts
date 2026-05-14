// Probe api.grove.md against the v2 dashboard contract.
//
// Reports VERIFIED / PARTIAL / GAP per endpoint. Exits 0 if >= 80% VERIFIED, 1 otherwise.
// Run via: npm run probe:api -- --vault=<slug>
// Add --json for machine-parseable output.
//
// See PLAN.md task W0-PROBE-1 in /Users/jm/src/grove-www for context.
//
// Requires Node 22.6+ (uses --experimental-strip-types for inline .ts).

const NODE_MAJOR = Number(process.versions.node.split(".")[0]);
const NODE_MINOR = Number(process.versions.node.split(".")[1]);
if (NODE_MAJOR < 22 || (NODE_MAJOR === 22 && NODE_MINOR < 6)) {
  console.error(
    `probe-grove-api requires Node 22.6+ for --experimental-strip-types (running ${process.versions.node})`
  );
  process.exit(2);
}

// ── Types ────────────────────────────────────────────────────────────────

export type Status = "VERIFIED" | "PARTIAL" | "GAP";

export interface EndpointSpec {
  name: string;
  method: "GET" | "POST";
  path: (vault: string) => string;
  requiredFields: string[]; // top-level keys expected in the JSON body
}

export interface ProbeResult {
  name: string;
  status: Status;
  notes: string;
}

export interface FetchLike {
  (url: string, init?: { method?: string; headers?: Record<string, string> }): Promise<{
    ok: boolean;
    status: number;
    text(): Promise<string>;
  }>;
}

// ── Endpoints probed ─────────────────────────────────────────────────────
//
// The 5 v2-homepage-critical endpoints. Other 7 SPEC endpoints will be added
// when their consumer ships (per PLAN.md acceptance criteria).

export const ENDPOINTS: EndpointSpec[] = [
  {
    name: "GET /v1/tasks (list backlog)",
    method: "GET",
    path: (v) => `/v1/tasks?vault=${encodeURIComponent(v)}`,
    requiredFields: ["reviewTasks", "pendingTasks", "clearedTasks", "throughput", "skills"],
  },
  {
    name: "POST /v1/tasks/{id}/run (trigger now)",
    method: "POST",
    path: () => `/v1/tasks/PROBE_NOOP/run`,
    requiredFields: [], // 2xx with empty body is fine; backend may return {} or {ok:true}
  },
  {
    name: "GET /v1/tasks/{id} (task detail with provenance)",
    method: "GET",
    path: () => `/v1/tasks/PROBE_NOOP`,
    requiredFields: ["id", "state", "result"],
  },
  {
    name: "GET /v1/throughput (capacity view)",
    method: "GET",
    path: (v) => `/v1/throughput?vault=${encodeURIComponent(v)}`,
    requiredFields: ["cleared7d", "pending", "estimatedClearText", "planCeiling"],
  },
  {
    name: "GET /v1/skills (skill registry)",
    method: "GET",
    path: (v) => `/v1/skills?vault=${encodeURIComponent(v)}`,
    requiredFields: [], // skills returns an array; we check for Array.isArray below
  },
];

// ── Core probe ───────────────────────────────────────────────────────────

export async function probeEndpoint(
  spec: EndpointSpec,
  opts: { baseUrl: string; token: string; vault: string; fetcher?: FetchLike }
): Promise<ProbeResult> {
  const fetcher = (opts.fetcher ?? globalThis.fetch) as FetchLike;
  const url = opts.baseUrl.replace(/\/$/, "") + spec.path(opts.vault);

  let raw: { ok: boolean; status: number; text(): Promise<string> };
  try {
    raw = await fetcher(url, {
      method: spec.method,
      headers: { Authorization: `Bearer ${opts.token}` },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { name: spec.name, status: "GAP", notes: `network error: ${msg}` };
  }

  if (!raw.ok) {
    return { name: spec.name, status: "GAP", notes: `HTTP ${raw.status}` };
  }

  const body = await raw.text();
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return {
      name: spec.name,
      status: "GAP",
      notes: `2xx but body is not JSON (${body.slice(0, 60)}...)`,
    };
  }

  // Special case: /v1/skills returns an array; check for that shape.
  if (spec.name.startsWith("GET /v1/skills")) {
    if (Array.isArray(json)) {
      return { name: spec.name, status: "VERIFIED", notes: `200, ${json.length} skills` };
    }
    return { name: spec.name, status: "PARTIAL", notes: "200 but not an array" };
  }

  if (spec.requiredFields.length === 0) {
    return { name: spec.name, status: "VERIFIED", notes: `200, ${raw.status}` };
  }

  if (typeof json !== "object" || json === null) {
    return { name: spec.name, status: "PARTIAL", notes: "200 but body is not an object" };
  }

  const missing = spec.requiredFields.filter((f) => !(f in (json as Record<string, unknown>)));
  if (missing.length === 0) {
    return { name: spec.name, status: "VERIFIED", notes: "200, shape matches" };
  }

  return {
    name: spec.name,
    status: "PARTIAL",
    notes: `200 but missing fields: ${missing.join(", ")}`,
  };
}

// ── Reporters (dual mode, mirrors scripts/score.sh) ──────────────────────

export function formatHuman(results: ProbeResult[], score: { verified: number; total: number }): string {
  const lines: string[] = [];
  lines.push("");
  lines.push("grove api v2 contract probe");
  lines.push("─".repeat(60));
  for (const r of results) {
    const tag = r.status === "VERIFIED" ? "[PASS]" : r.status === "PARTIAL" ? "[WARN]" : "[FAIL]";
    lines.push(`  ${tag} ${r.status.padEnd(9)} ${r.name}`);
    lines.push(`         ↳ ${r.notes}`);
  }
  lines.push("─".repeat(60));
  const pct = Math.round((score.verified / score.total) * 100);
  const verdict = pct >= 80 ? "PASS (>= 80% verified)" : "FAIL (< 80% verified)";
  lines.push(`  Score: ${score.verified}/${score.total} VERIFIED  (${pct}%)  — ${verdict}`);
  lines.push("");
  return lines.join("\n");
}

export function formatJson(results: ProbeResult[], score: { verified: number; total: number }): string {
  return JSON.stringify(
    {
      verified: score.verified,
      total: score.total,
      passes: score.verified / score.total >= 0.8,
      results: results.map((r) => ({ name: r.name, status: r.status, notes: r.notes })),
    },
    null,
    2
  );
}

// ── CLI entry ────────────────────────────────────────────────────────────

interface CliArgs {
  json: boolean;
  vault: string | null;
}

export function parseArgs(argv: string[]): CliArgs {
  let json = false;
  let vault: string | null = null;
  for (const a of argv) {
    if (a === "--json") json = true;
    else if (a.startsWith("--vault=")) vault = a.slice("--vault=".length);
  }
  if (!vault && process.env.PROBE_VAULT) vault = process.env.PROBE_VAULT;
  return { json, vault };
}

export function computeScore(results: ProbeResult[]): { verified: number; total: number } {
  return {
    verified: results.filter((r) => r.status === "VERIFIED").length,
    total: results.length,
  };
}

export async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  const token = process.env.GROVE_TOKEN;
  const baseUrl = process.env.GROVE_API_URL ?? "https://api.grove.md";

  if (!token) {
    console.error("probe-grove-api: GROVE_TOKEN env var is required");
    return 2;
  }
  if (!args.vault) {
    console.error("probe-grove-api: --vault=<slug> or PROBE_VAULT env var is required");
    return 2;
  }

  const results: ProbeResult[] = [];
  for (const spec of ENDPOINTS) {
    results.push(await probeEndpoint(spec, { baseUrl, token, vault: args.vault }));
  }
  const score = computeScore(results);

  console.log(args.json ? formatJson(results, score) : formatHuman(results, score));
  return score.verified / score.total >= 0.8 ? 0 : 1;
}

// Run only when invoked directly (not when imported by tests).
// In Node with --experimental-strip-types, import.meta.url + process.argv[1] comparison
// is the canonical check.
const isDirectInvocation = import.meta.url === `file://${process.argv[1]}`;
if (isDirectInvocation) {
  main().then((code) => process.exit(code)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
