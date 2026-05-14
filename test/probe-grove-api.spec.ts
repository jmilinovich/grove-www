import { describe, expect, it } from "vitest";

import {
  computeScore,
  ENDPOINTS,
  formatHuman,
  formatJson,
  parseArgs,
  probeEndpoint,
  type EndpointSpec,
  type FetchLike,
  type ProbeResult,
} from "../scripts/probe-grove-api";

const BACKLOG_SPEC = ENDPOINTS.find((e) => e.name.startsWith("GET /v1/tasks (list"))!;
const RUN_SPEC = ENDPOINTS.find((e) => e.name.startsWith("POST /v1/tasks/{id}/run"))!;
const SKILLS_SPEC = ENDPOINTS.find((e) => e.name.startsWith("GET /v1/skills"))!;

function fakeFetch(impl: (url: string) => { status: number; body: string } | Error): FetchLike {
  return async (url: string) => {
    const r = impl(url);
    if (r instanceof Error) throw r;
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      text: async () => r.body,
    };
  };
}

describe("probeEndpoint", () => {
  const opts = { baseUrl: "https://api.example.com", token: "t", vault: "vault-1" };

  it("returns VERIFIED on 200 + all required fields present", async () => {
    const fetcher = fakeFetch(() => ({
      status: 200,
      body: JSON.stringify({
        reviewTasks: [],
        pendingTasks: [],
        clearedTasks: [],
        throughput: {},
        skills: [],
      }),
    }));
    const result = await probeEndpoint(BACKLOG_SPEC, { ...opts, fetcher });
    expect(result.status).toBe("VERIFIED");
  });

  it("returns PARTIAL on 200 with missing required field", async () => {
    const fetcher = fakeFetch(() => ({
      status: 200,
      body: JSON.stringify({
        reviewTasks: [],
        pendingTasks: [],
        clearedTasks: [],
        // throughput + skills missing
      }),
    }));
    const result = await probeEndpoint(BACKLOG_SPEC, { ...opts, fetcher });
    expect(result.status).toBe("PARTIAL");
    expect(result.notes).toContain("throughput");
    expect(result.notes).toContain("skills");
  });

  it("returns GAP on 404", async () => {
    const fetcher = fakeFetch(() => ({ status: 404, body: "Not Found" }));
    const result = await probeEndpoint(BACKLOG_SPEC, { ...opts, fetcher });
    expect(result.status).toBe("GAP");
    expect(result.notes).toContain("404");
  });

  it("returns GAP on 500", async () => {
    const fetcher = fakeFetch(() => ({ status: 500, body: "Internal Server Error" }));
    const result = await probeEndpoint(BACKLOG_SPEC, { ...opts, fetcher });
    expect(result.status).toBe("GAP");
    expect(result.notes).toContain("500");
  });

  it("returns GAP on network error (fetch throws)", async () => {
    const fetcher = fakeFetch(() => new Error("ECONNREFUSED"));
    const result = await probeEndpoint(BACKLOG_SPEC, { ...opts, fetcher });
    expect(result.status).toBe("GAP");
    expect(result.notes).toContain("ECONNREFUSED");
  });

  it("returns GAP on malformed JSON (2xx with HTML body)", async () => {
    const fetcher = fakeFetch(() => ({ status: 200, body: "<html>not json</html>" }));
    const result = await probeEndpoint(BACKLOG_SPEC, { ...opts, fetcher });
    expect(result.status).toBe("GAP");
    expect(result.notes).toContain("not JSON");
  });

  it("treats /v1/tasks/{id}/run as VERIFIED on empty 2xx (no required fields)", async () => {
    const fetcher = fakeFetch(() => ({ status: 200, body: "{}" }));
    const result = await probeEndpoint(RUN_SPEC, { ...opts, fetcher });
    expect(result.status).toBe("VERIFIED");
  });

  it("treats /v1/skills as VERIFIED only when body is an array", async () => {
    const arrayFetcher = fakeFetch(() => ({ status: 200, body: JSON.stringify([{ slug: "a" }]) }));
    const arrayResult = await probeEndpoint(SKILLS_SPEC, { ...opts, fetcher: arrayFetcher });
    expect(arrayResult.status).toBe("VERIFIED");
    expect(arrayResult.notes).toContain("1 skills");

    const objectFetcher = fakeFetch(() => ({ status: 200, body: JSON.stringify({ skills: [] }) }));
    const objectResult = await probeEndpoint(SKILLS_SPEC, { ...opts, fetcher: objectFetcher });
    expect(objectResult.status).toBe("PARTIAL");
  });

  it("includes the bearer token in the Authorization header", async () => {
    let observedAuth: string | undefined;
    const fetcher: FetchLike = async (_url, init) => {
      observedAuth = (init?.headers as Record<string, string> | undefined)?.["Authorization"];
      return { ok: true, status: 200, text: async () => JSON.stringify([]) };
    };
    await probeEndpoint(SKILLS_SPEC, { ...opts, fetcher });
    expect(observedAuth).toBe("Bearer t");
  });
});

describe("computeScore + exit-code gate", () => {
  const r = (status: ProbeResult["status"]): ProbeResult => ({
    name: "x",
    status,
    notes: "",
  });

  it("5/5 VERIFIED is a pass", () => {
    const score = computeScore([r("VERIFIED"), r("VERIFIED"), r("VERIFIED"), r("VERIFIED"), r("VERIFIED")]);
    expect(score.verified).toBe(5);
    expect(score.total).toBe(5);
    expect(score.verified / score.total >= 0.8).toBe(true);
  });

  it("4/5 VERIFIED (80%) is a pass", () => {
    const score = computeScore([r("VERIFIED"), r("VERIFIED"), r("VERIFIED"), r("VERIFIED"), r("PARTIAL")]);
    expect(score.verified / score.total >= 0.8).toBe(true);
  });

  it("3/5 VERIFIED (60%) is a fail", () => {
    const score = computeScore([r("VERIFIED"), r("VERIFIED"), r("VERIFIED"), r("PARTIAL"), r("GAP")]);
    expect(score.verified / score.total >= 0.8).toBe(false);
  });

  it("PARTIAL does not count as VERIFIED", () => {
    const score = computeScore([r("PARTIAL"), r("PARTIAL"), r("PARTIAL"), r("PARTIAL"), r("PARTIAL")]);
    expect(score.verified).toBe(0);
  });

  it("GAP does not count as VERIFIED", () => {
    const score = computeScore([r("GAP"), r("GAP"), r("GAP"), r("GAP"), r("GAP")]);
    expect(score.verified).toBe(0);
  });
});

describe("formatJson", () => {
  it("returns parseable JSON with expected keys", () => {
    const results: ProbeResult[] = [
      { name: "GET /v1/tasks", status: "VERIFIED", notes: "ok" },
      { name: "GET /v1/skills", status: "PARTIAL", notes: "missing fields" },
    ];
    const out = formatJson(results, { verified: 1, total: 2 });
    const parsed = JSON.parse(out);
    expect(parsed.verified).toBe(1);
    expect(parsed.total).toBe(2);
    expect(parsed.passes).toBe(false);
    expect(parsed.results).toHaveLength(2);
    expect(parsed.results[0].status).toBe("VERIFIED");
    expect(parsed.results[1].notes).toBe("missing fields");
  });

  it("marks passes=true at 80%+", () => {
    const out = formatJson([], { verified: 4, total: 5 });
    expect(JSON.parse(out).passes).toBe(true);
  });
});

describe("formatHuman", () => {
  it("renders one line per result with status tag", () => {
    const results: ProbeResult[] = [
      { name: "GET /v1/tasks", status: "VERIFIED", notes: "ok" },
      { name: "GET /v1/skills", status: "GAP", notes: "HTTP 404" },
    ];
    const out = formatHuman(results, { verified: 1, total: 2 });
    expect(out).toContain("[PASS] VERIFIED");
    expect(out).toContain("[FAIL] GAP");
    expect(out).toContain("Score: 1/2 VERIFIED");
    expect(out).toContain("(50%)");
    expect(out).toContain("FAIL");
  });

  it("renders PASS verdict at 80%+", () => {
    const out = formatHuman([], { verified: 4, total: 5 });
    expect(out).toContain("PASS");
  });
});

describe("parseArgs", () => {
  it("defaults to no flags + no vault", () => {
    const args = parseArgs([]);
    expect(args.json).toBe(false);
    expect(args.vault).toBeNull();
  });

  it("picks up --json", () => {
    const args = parseArgs(["--json"]);
    expect(args.json).toBe(true);
  });

  it("picks up --vault=foo", () => {
    const args = parseArgs(["--vault=foo"]);
    expect(args.vault).toBe("foo");
  });

  it("handles both flags in either order", () => {
    expect(parseArgs(["--vault=bar", "--json"])).toEqual({ json: true, vault: "bar" });
    expect(parseArgs(["--json", "--vault=baz"])).toEqual({ json: true, vault: "baz" });
  });
});

describe("ENDPOINTS registry", () => {
  it("probes the 5 v2-critical endpoints", () => {
    expect(ENDPOINTS).toHaveLength(5);
    const names = ENDPOINTS.map((e) => e.name);
    expect(names.some((n) => n.includes("GET /v1/tasks (list"))).toBe(true);
    expect(names.some((n) => n.includes("POST /v1/tasks/{id}/run"))).toBe(true);
    expect(names.some((n) => n.includes("GET /v1/tasks/{id} (task detail"))).toBe(true);
    expect(names.some((n) => n.includes("GET /v1/throughput"))).toBe(true);
    expect(names.some((n) => n.includes("GET /v1/skills"))).toBe(true);
  });

  it("encodes vault slug into URL path safely", () => {
    const backlog = ENDPOINTS.find((e) => e.name.startsWith("GET /v1/tasks (list"))!;
    const path = backlog.path("vault/with slashes & ?");
    expect(path).toContain("vault%2F"); // / encoded
    expect(path).toContain("%20"); // space encoded
    expect(path).toContain("%26"); // & encoded
  });
});
