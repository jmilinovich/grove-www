/**
 * Live implementation of the v2 grove-api contract — talks to the real
 * api.grove.md via the path-scoped /v/<slug>/v1/* endpoints landed in
 * Phase 21–23 of grove server.
 *
 * Auth model: server-side fetch reads the API key from the encrypted
 * cookie via `getApiKey(await cookies())`. The key is membership-bound;
 * api.grove.md's `vaultV1Match` block does the role + slug check.
 *
 * Vault slug is threaded explicitly through every function — pages and
 * Server Actions already have `vaultSlug` in scope (URL params on
 * `/{atHandle}/[vaultSlug]/...` routes) and forward it. The mock
 * accepts but ignores the arg; the live impl uses it to build the URL
 * path. This is the only safe shape under multi-vault — earlier drafts
 * hardcoded `"personal"` and silently cross-vaulted every non-personal
 * resident.
 *
 * Function shapes mirror src/lib/grove-api.v2.mock.ts EXACTLY so the
 * mode-switch in grove-api.v2.ts is transparent to callers.
 */

import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";
import type {
  BacklogPayload,
  Cadence,
  Skill,
  Task,
  ThroughputView,
} from "./grove-api.v2.types";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

class GroveApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly endpoint: string,
    body: string,
  ) {
    super(`grove-api ${status} on ${endpoint}: ${body.slice(0, 200)}`);
    this.name = "GroveApiError";
  }
}

async function getAuthHeader(): Promise<string> {
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) {
    throw new GroveApiError(401, "(no endpoint)", "no api key in cookie");
  }
  return `Bearer ${apiKey}`;
}

async function call<T>(
  vault: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const auth = await getAuthHeader();
  const endpoint = `/v/${encodeURIComponent(vault)}${path}`;
  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: auth,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new GroveApiError(res.status, endpoint, await res.text());
  }
  // Some mutations return 200 with empty body; tolerate that by returning
  // an empty object cast to T. The mock returns `void` for these and the
  // call sites don't read the result.
  const text = await res.text();
  return (text ? JSON.parse(text) : ({} as T)) as T;
}

// ─── Reads ────────────────────────────────────────────────────────────

export async function fetchBacklog(vault: string): Promise<BacklogPayload> {
  return await call<BacklogPayload>(vault, "GET", "/v1/tasks");
}

export async function fetchTask(vault: string, taskId: string): Promise<Task> {
  return await call<Task>(
    vault,
    "GET",
    `/v1/tasks/${encodeURIComponent(taskId)}`,
  );
}

export async function fetchSkills(vault: string): Promise<Skill[]> {
  return await call<Skill[]>(vault, "GET", "/v1/skills");
}

export async function fetchThroughput(
  vault: string,
): Promise<ThroughputView> {
  // Server-side computeThroughput lives inside BacklogPayload only;
  // there's no standalone /v1/throughput endpoint (Scope Cop CUT).
  // Lift it out of the full backlog payload.
  const payload = await fetchBacklog(vault);
  return payload.throughput;
}

// ─── Mutations ────────────────────────────────────────────────────────

export async function runTask(vault: string, taskId: string): Promise<void> {
  await call<unknown>(
    vault,
    "POST",
    `/v1/tasks/${encodeURIComponent(taskId)}/run`,
  );
}

export async function deferTask(
  vault: string,
  taskId: string,
  until: string,
): Promise<void> {
  await call<unknown>(
    vault,
    "POST",
    `/v1/tasks/${encodeURIComponent(taskId)}/defer`,
    { until },
  );
}

export async function dismissTask(vault: string, taskId: string): Promise<void> {
  await call<unknown>(
    vault,
    "POST",
    `/v1/tasks/${encodeURIComponent(taskId)}/dismiss`,
  );
}

export async function reviewTask(
  vault: string,
  taskId: string,
  action:
    | { kind: "confirm-durable" }
    | { kind: "refine"; refinement: string }
    | { kind: "dismiss" }
    | { kind: "mark-stale" },
): Promise<void> {
  await call<unknown>(
    vault,
    "POST",
    `/v1/tasks/${encodeURIComponent(taskId)}/review`,
    action,
  );
}

export async function configureSkill(
  vault: string,
  slug: string,
  cadence: Cadence,
): Promise<void> {
  await call<unknown>(
    vault,
    "POST",
    `/v1/skills/${encodeURIComponent(slug)}/configure`,
    { cadence },
  );
}

export async function enableSkill(vault: string, slug: string): Promise<void> {
  await call<unknown>(
    vault,
    "POST",
    `/v1/skills/${encodeURIComponent(slug)}/enable`,
  );
}

export async function disableSkill(vault: string, slug: string): Promise<void> {
  await call<unknown>(
    vault,
    "POST",
    `/v1/skills/${encodeURIComponent(slug)}/disable`,
  );
}
