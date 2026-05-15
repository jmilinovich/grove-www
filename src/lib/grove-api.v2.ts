// v2 grove-api entry. Routes via mock or live based on GROVE_API_MODE env.
//
// Default mode: `mock` (during v2 build-out). Set GROVE_API_MODE=live to call
// the real api.grove.md once W0-PROBE-1 confirms backend readiness.
//
// See SPEC.md §14.1 for types, PLAN.md "W0-MOCK-1" for context.
//
// Cache wiring (PLAN D-13) was originally `'use cache'` + `cacheTag`
// on `fetchBacklog`, gated by Next.js 16 Cache Components. Cache
// Components has been disabled at the next.config layer because it's
// incompatible with the per-request `dynamic` route segment config
// every v1 route relies on. Until the v2 surface goes live and we
// migrate v1 routes to `<Suspense>` boundaries, this module is a
// plain re-export — `fetchBacklog` is uncached. The prod guard means
// nothing user-facing relies on caching today.

import { notFound } from "next/navigation";
import * as mock from "./grove-api.v2.mock";
import * as live from "./grove-api.v2.live";

const mode = process.env.GROVE_API_MODE === "live" ? "live" : "mock";

const impl = mode === "live" ? live : mock;

export const fetchBacklog = impl.fetchBacklog;
export const fetchTask = impl.fetchTask;
export const runTask = impl.runTask;
export const deferTask = impl.deferTask;
export const dismissTask = impl.dismissTask;
export const reviewTask = impl.reviewTask;
export const fetchSkills = impl.fetchSkills;
export const fetchThroughput = impl.fetchThroughput;
export const configureSkill = impl.configureSkill;
export const enableSkill = impl.enableSkill;
export const disableSkill = impl.disableSkill;

// Re-export types for consumer convenience.
export type {
  BacklogPayload,
  Cadence,
  GroveProvenance,
  Skill,
  Task,
  TaskArtifactType,
  TaskResult,
  TaskState,
  ThroughputView,
} from "./grove-api.v2.types";

export const GROVE_API_MODE = mode;

/**
 * Prod guard for the v2 surface.
 *
 * v2 ships behind a wall until api.grove.md serves the v2 contract
 * end-to-end (W0-PROBE-1 currently reports zero of five endpoints
 * VERIFIED). Shipping mock data to real users is worse than a 404 —
 * it's a lie.
 *
 * Behavior matrix:
 *   VERCEL_ENV=production + GROVE_API_MODE=mock  → 404 (the guard)
 *   VERCEL_ENV=production + GROVE_API_MODE=live  → renders against real api
 *   VERCEL_ENV=preview   + anything              → renders (dogfood path)
 *   local dev / CI       + anything              → renders
 *
 * Every v2 page entry point must call this before reading from any v2
 * fetcher. To open v2 on prod: set GROVE_API_MODE=live in the Vercel
 * production environment after api.grove.md ships /v1/tasks et al.
 */
export function assertV2Available(): void {
  if (process.env.VERCEL_ENV === "production" && mode !== "live") {
    notFound();
  }
}
