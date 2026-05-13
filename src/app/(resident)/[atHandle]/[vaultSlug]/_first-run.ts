// First-run bootstrap helper (W3-FIRSTRUN-1).
//
// SPEC §12 + §14.7: on a vault's first authed visit, auto-install Daily
// Vault Review and trigger a surface-only run; subsequent visits do not
// re-trigger. The dashboard composes a small welcome banner above
// <NeedsReviewList /> when `isFirstRun(vaultSlug)` is true.
//
// For v2 + mock-mode (PLAN.md W3-FIRSTRUN-1 / open question on first-run
// flag storage), the "done" flag lives in a module-level Map keyed by
// vaultSlug — same pattern as `grove-api.v2.mock.ts`. Module singleton;
// restart resets state.
//
// The actual auto-install + auto-run side-effect is a stub for v2: the
// mock store ships pre-populated with 5 review/pending tasks that
// satisfy the §12 choreography, so `bootstrapFirstRun` is mostly a flag
// flip. When api.grove.md lands the real schema, this is the single
// place that grows the install + run call.
//
// Page-level wiring (rendering <WelcomeReview /> conditionally on
// `isFirstRun(vaultSlug)`) is the v2.5 integration step and is
// deliberately NOT done in this PR.

const firstRunDone = new Map<string, true>();

/**
 * Returns true if `vaultSlug` has never been bootstrapped in this
 * process. Defaults to true for unknown slugs — first visit by
 * construction.
 */
export function isFirstRun(vaultSlug: string): boolean {
  return !firstRunDone.has(vaultSlug);
}

/**
 * Marks `vaultSlug` as first-run done. Idempotent — calling twice is a
 * no-op. In live mode, this is the seam where Daily Vault Review gets
 * server-side installed and triggered for a surface-only run.
 */
export async function bootstrapFirstRun(vaultSlug: string): Promise<void> {
  if (firstRunDone.has(vaultSlug)) return;

  // V2 stub: the mock store already has the 5 review/pending tasks
  // required by §12. When backend lands, install Daily Vault Review and
  // trigger its surface-only run here. No vault writes allowed during
  // the first 30s (SPEC §3).

  firstRunDone.set(vaultSlug, true);
}

/**
 * Test-only: reset the in-process first-run map. Not part of the public
 * surface; matches `__resetMockStore` in `grove-api.v2.mock.ts`.
 */
export function __resetFirstRunStore(): void {
  firstRunDone.clear();
}
