"use server";

// Server Actions — skills domain.
//
// Per D-12 (Server Actions for all mutations) and D-19 (split per-domain).
// Each action calls into src/lib/grove-api.v2.ts (which currently routes
// to the mock store; will route to live api.grove.md once W0-PROBE-1
// confirms backend readiness) and then invalidates the per-vault backlog
// cache tag so the next RSC render serves fresh data.
//
// Cache primitive note: tasks.ts uses `updateTag` (the Next.js 16
// Server-Action primitive that gives read-your-own-writes semantics for
// the current request). Skills mutations affect the *backlog* — a
// cadence change reschedules pending tasks, enable/disable changes
// which skills produce new tasks — so we invalidate the same
// `vault:<slug>/backlog` tag the tasks-domain actions use. There is
// no separate `vault:<slug>/skills` tag in v2 because `fetchBacklog`
// already returns the installed skill list as part of its payload
// (see grove-api.v2.mock.ts → BacklogPayload.skills). When/if a
// skills-only query splits out in v3, this is where the second tag
// invalidation lands.
//
// useOptimistic is intentionally NOT here — it's a client concern
// per D-21. The skills detail page wires `useOptimistic` itself.

import { updateTag } from "next/cache";
import * as groveApi from "@/lib/grove-api.v2";
import type { Cadence } from "@/lib/grove-api.v2.types";

// grove-api.v2.ts re-exports functions through a union of mock+liveStub
// signatures, which TypeScript narrows the parameter list of to the
// intersection (i.e. `never[]`). Cast through the mock-side signatures —
// the values are real at runtime; this just unblocks the type checker
// until the liveStub module is parameterised correctly. Same pattern
// as `_actions/tasks.ts`.
const apiConfigureSkill = groveApi.configureSkill as (
  slug: string,
  cadence: Cadence,
) => Promise<void>;
const apiEnableSkill = groveApi.enableSkill as (slug: string) => Promise<void>;
const apiDisableSkill = groveApi.disableSkill as (slug: string) => Promise<void>;

function backlogTag(vaultSlug: string): string {
  return `vault:${vaultSlug}/backlog`;
}

export async function configureSkill(
  slug: string,
  cadence: Cadence,
  vaultSlug: string,
): Promise<void> {
  await apiConfigureSkill(slug, cadence);
  updateTag(backlogTag(vaultSlug));
}

export async function enableSkill(
  slug: string,
  vaultSlug: string,
): Promise<void> {
  await apiEnableSkill(slug);
  updateTag(backlogTag(vaultSlug));
}

export async function disableSkill(
  slug: string,
  vaultSlug: string,
): Promise<void> {
  await apiDisableSkill(slug);
  updateTag(backlogTag(vaultSlug));
}
