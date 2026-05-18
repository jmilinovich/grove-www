"use server";

// Server Actions — review domain.
//
// Per D-19 (split per-domain) and the W3-REVIEW-1 contract. The review
// surface has its own action vocabulary (confirm-durable / refine /
// dismiss / mark-stale) that doesn't map cleanly onto tasks.ts'
// run/defer/dismiss — see needs-review-list.tsx for the same rationale
// at the UI layer. Keeping the action surfaces split also matches the
// api.grove.md endpoint split (`POST /tasks/{id}/review`).
//
// Cache invalidation: every review action mutates a task's state, which
// changes which bucket it appears in (reviewTasks → clearedTasks for
// confirm-durable; dismissedTasks for dismiss; etc.). We invalidate the
// per-vault backlog tag the same way tasks.ts does, so the next render
// re-fetches.
//
// Error contract (D-12): we propagate whatever grove-api.v2.reviewTask
// throws. In mock mode the only error shape is "task <id> not found"; in
// live mode AuthError / ApiError / ValidationError will surface here.
// The caller (ReviewItem wrapper or backlog page) decides whether to
// surface a Toast.

import { updateTag } from "next/cache";
import { reviewTask as apiReviewTask } from "@/lib/grove-api.v2";

// grove-api.v2.ts exposes a unified signature (vault: string, ...) across
// mock + live, so we import directly without type-laundering casts.

function backlogTag(vaultSlug: string): string {
  return `vault:${vaultSlug}/backlog`;
}

export async function reviewTask(
  taskId: string,
  action:
    | { kind: "confirm-durable" }
    | { kind: "refine"; refinement: string }
    | { kind: "dismiss" }
    | { kind: "mark-stale" },
  vaultSlug: string,
): Promise<void> {
  await apiReviewTask(vaultSlug, taskId, action);
  updateTag(backlogTag(vaultSlug));
}
