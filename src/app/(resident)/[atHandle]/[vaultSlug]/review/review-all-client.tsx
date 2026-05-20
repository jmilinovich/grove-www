"use client";

import { useCallback, useMemo, useState, type JSX } from "react";
import type { Skill, Task } from "@/lib/grove-api.v2.types";
import { ReviewItem } from "@/components/task/review-item";
import { RefineModal } from "@/components/task/refine-modal";
import {
  applyReviewTask,
  refineReviewTask,
  dismissReviewTask,
} from "@/app/(resident)/[atHandle]/[vaultSlug]/_actions/review";

interface ReviewAllClientProps {
  reviewTasks: Task[];
  skills: Skill[];
  vaultSlug: string;
}

/**
 * Client island for the see-all review page. Renders every review-state
 * task as a `<ReviewItem />` and owns the refine modal state — same
 * shape as BacklogIsland, lifted up so each item doesn't carry its own
 * dialog.
 */
export function ReviewAllClient({
  reviewTasks,
  skills,
  vaultSlug,
}: ReviewAllClientProps): JSX.Element {
  const skillsByKey = useMemo<Record<string, Skill>>(() => {
    const out: Record<string, Skill> = {};
    for (const s of skills) {
      out[s.id] = s;
      out[s.slug] = s;
    }
    return out;
  }, [skills]);

  const [refineForTaskId, setRefineForTaskId] = useState<string | null>(null);

  const fireRefine = useCallback(
    (taskId: string, refinement: string) => {
      // Refine spawns a free-instruction task via the V2 endpoint.
      void refineReviewTask(taskId, refinement, vaultSlug).catch(
        (err: unknown) => {
          // eslint-disable-next-line no-console
          console.error("refineReviewTask failed", err);
        },
      );
    },
    [vaultSlug],
  );

  const fireDismiss = useCallback(
    (taskId: string) => {
      void dismissReviewTask(taskId, vaultSlug).catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.error("dismissReviewTask failed", err);
      });
    },
    [vaultSlug],
  );

  const fireApplyOption = useCallback(
    (taskId: string, optionId: string) => {
      void applyReviewTask(taskId, optionId, vaultSlug).catch(
        (err: unknown) => {
          // eslint-disable-next-line no-console
          console.error("applyReviewTask failed", err);
        },
      );
    },
    [vaultSlug],
  );

  const skillForTask = useCallback(
    (task: Task): Skill | undefined => skillsByKey[task.skillId],
    [skillsByKey],
  );

  const handleRefineSubmit = useCallback(
    (refinement: string) => {
      const taskId = refineForTaskId;
      if (!taskId) return;
      fireRefine(taskId, refinement);
      setRefineForTaskId(null);
    },
    [refineForTaskId, fireRefine],
  );

  if (reviewTasks.length === 0) {
    return (
      <p
        className="font-sans text-base text-ink/60"
        data-testid="review-all-empty"
      >
        nothing to review right now.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6" data-testid="review-all-list">
      {reviewTasks.map((task) => {
        const skill = skillForTask(task);
        return (
          <ReviewItem
            key={task.id}
            task={task}
            skill={
              skill ?? {
                id: task.skillId,
                slug: task.skillId,
                name: task.skillId,
              }
            }
            vaultSlug={vaultSlug}
            onApplyOption={(optionId) => fireApplyOption(task.id, optionId)}
            onRefine={(refinement) => {
              // ReviewItem's own RefineModal fires onRefine directly
              // with the refined text — we don't re-open the page-level
              // modal here.
              fireRefine(task.id, refinement);
            }}
            onDismiss={() => fireDismiss(task.id)}
          />
        );
      })}
      {refineForTaskId ? (
        <RefineModal
          onSubmit={handleRefineSubmit}
          onCancel={() => setRefineForTaskId(null)}
        />
      ) : null}
    </div>
  );
}
