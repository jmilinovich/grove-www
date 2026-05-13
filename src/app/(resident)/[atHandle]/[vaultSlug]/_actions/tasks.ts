"use server";

// Server Actions — tasks domain.
//
// Per D-12 (Server Actions for all mutations) and D-19 (split per-domain).
// Each action calls into src/lib/grove-api.v2.ts (which currently routes to
// the mock store; will route to live api.grove.md once W0-PROBE-1 ships)
// and then invalidates the per-vault backlog cache tag so any Cache
// Components reads of /api/backlog refresh on next render.
//
// Cache primitive note: PLAN.md W2-ACTIONS references `revalidateTag` but
// Next.js 16 split the API — `revalidateTag(tag, profile)` is for
// associating a cacheLife profile, and `updateTag(tag)` is the
// Server-Action primitive that gives read-your-own-writes semantics for
// the current request. We use `updateTag` here; semantically it's exactly
// what the PLAN described ("any Cache Components reads of /api/backlog
// are invalidated") under the new API split.
//
// Error contract (D-12): actions propagate whatever grove-api.v2 throws.
// In mock mode the only error shape is "task <id> not found"; in live mode
// AuthError / ApiError / ValidationError will surface here once the live
// module is implemented. Consumers (TaskCard wrapper, per W2-ACTIONS PR
// description) use useOptimistic — on throw, React reverts the optimistic
// state and a <Toast /> surfaces the error.
//
// useOptimistic is intentionally NOT here — it's a client concern per D-21.

import { updateTag } from "next/cache";
import * as groveApi from "@/lib/grove-api.v2";

// grove-api.v2.ts re-exports functions through a union of mock+liveStub
// signatures, which TypeScript narrows the parameter list of to the
// intersection (i.e. `never[]`). Cast through the mock-side signatures —
// the values are real at runtime; this just unblocks the type checker
// until the liveStub module is parameterised correctly.
const apiRunTask = groveApi.runTask as (taskId: string) => Promise<void>;
const apiDeferTask = groveApi.deferTask as (
  taskId: string,
  until: string,
) => Promise<void>;
const apiDismissTask = groveApi.dismissTask as (taskId: string) => Promise<void>;

function backlogTag(vaultSlug: string): string {
  return `vault:${vaultSlug}/backlog`;
}

export async function runTask(taskId: string, vaultSlug: string): Promise<void> {
  await apiRunTask(taskId);
  updateTag(backlogTag(vaultSlug));
}

export async function deferTask(
  taskId: string,
  until: string,
  vaultSlug: string,
): Promise<void> {
  await apiDeferTask(taskId, until);
  updateTag(backlogTag(vaultSlug));
}

export async function dismissTask(taskId: string, vaultSlug: string): Promise<void> {
  await apiDismissTask(taskId);
  updateTag(backlogTag(vaultSlug));
}

// retryTask is the W3-FAIL-1 surface for re-running a failed task. Under
// the hood it just calls runTask — the mock has no separate "retry" path,
// and the live API will treat it the same way (post to /tasks/{id}/run
// regardless of prior state). Same revalidation.
export async function retryTask(taskId: string, vaultSlug: string): Promise<void> {
  await apiRunTask(taskId);
  updateTag(backlogTag(vaultSlug));
}
