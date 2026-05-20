"use server";

// Server Actions — review domain.
//
// Per D-19 (split per-domain) and the W3-REVIEW-1 contract. The review
// surface has its own action vocabulary (apply / refine / dismiss) that
// doesn't map cleanly onto tasks.ts' run/defer/dismiss — see
// needs-review-list.tsx for the same rationale at the UI layer. Keeping
// the action surfaces split also matches the api.grove.md endpoint split
// (`POST /tasks/{id}/review`).
//
// Cache invalidation: every review action mutates a task's state, which
// changes which bucket it appears in (reviewTasks → clearedTasks for
// apply; dismissedTasks for dismiss; spawns a pending row for refine).
// We invalidate the per-vault backlog tag the same way tasks.ts does,
// so the next render re-fetches.
//
// Error contract (D-12): we propagate whatever grove-api.v2 throws. In
// mock mode the only error shape is "task <id> not found"; in live mode
// AuthError / ApiError / ValidationError will surface here. The caller
// (ReviewItem wrapper or backlog page) decides whether to surface a Toast.

import { updateTag } from "next/cache";
import {
  applyTask as apiApplyTask,
  refineTask as apiRefineTask,
  dismissReviewTask as apiDismissReviewTask,
} from "@/lib/grove-api.v2";

// grove-api.v2.ts exposes a unified signature (vault: string, ...) across
// mock + live, so we import directly without type-laundering casts.

function backlogTag(vaultSlug: string): string {
  return `vault:${vaultSlug}/backlog`;
}

// ─── Inbox v2 review actions ──────────────────────────────────────────
//
// Per-type actions matching the V2 wire shape S-INBOX-10 added on the
// grove server. UI dispatches by `option.id` (not by a fixed verb).
// The legacy verb-union action was retired in C-INBOX-1 once
// M-INBOX-1 mass-dismissed the last legacy review-state rows on prod.

/**
 * V2 apply: confirm or switch the chosen option on a decision-backed
 * review task. Server-side, matching the current chosen option is a
 * no-op + confirm; a different option_id triggers compensation + a
 * re-run (S-INBOX-5 and S-INBOX-10). The client just ships option_id;
 * the server does the bookkeeping.
 */
export async function applyReviewTask(
  taskId: string,
  optionId: string,
  vaultSlug: string,
): Promise<void> {
  await apiApplyTask(vaultSlug, taskId, optionId);
  updateTag(backlogTag(vaultSlug));
}

/**
 * V2 refine: spawn a refine-handler task carrying the free-text
 * instruction; the original decision is compensated. Closer to
 * "delegate the correction" than "fill a form" — see spec
 * §"Refine = free instruction" in ~/src/grove/docs/inbox-v2-spec.md.
 */
export async function refineReviewTask(
  taskId: string,
  refinement: string,
  vaultSlug: string,
): Promise<void> {
  await apiRefineTask(vaultSlug, taskId, refinement);
  updateTag(backlogTag(vaultSlug));
}

/**
 * V2 dismiss for review-state tasks. Closes the suggestion AND writes a
 * suppression row so the same `(vault, suggestion_type, primary_entity)`
 * won't resurface for N days. Distinct from the pending-task
 * `dismissTask` in _actions/tasks.ts — they hit different endpoints with
 * different semantics; see grove-api.v2.live.ts for the wire split.
 */
export async function dismissReviewTask(
  taskId: string,
  vaultSlug: string,
): Promise<void> {
  await apiDismissReviewTask(vaultSlug, taskId);
  updateTag(backlogTag(vaultSlug));
}
