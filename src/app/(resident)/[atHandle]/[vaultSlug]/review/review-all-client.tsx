"use client";

import { useCallback, useMemo, useState, type JSX } from "react";
import type { Skill, Task } from "@/lib/grove-api.v2.types";
import { ReviewItem } from "@/components/task/review-item";
import { RefineModal } from "@/components/task/refine-modal";
import { FirstWriteModal } from "@/components/task/first-write-modal";
import {
  WRITE_ARTIFACT_TYPES,
  readFirstWriteAck,
  writeFirstWriteAck,
} from "@/components/task/first-write-ack";
import {
  reviewTask,
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
 * task as a `<ReviewItem />` and owns the refine + first-write modal
 * state — same shape as BacklogIsland, lifted up so each item doesn't
 * carry its own dialog.
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

  const reviewTasksById = useMemo<Record<string, Task>>(() => {
    return Object.fromEntries(reviewTasks.map((t) => [t.id, t]));
  }, [reviewTasks]);

  const [refineForTaskId, setRefineForTaskId] = useState<string | null>(null);
  const [firstWriteForTaskId, setFirstWriteForTaskId] = useState<string | null>(
    null,
  );

  const fireConfirmDurable = useCallback(
    (taskId: string) => {
      void reviewTask(taskId, { kind: "confirm-durable" }, vaultSlug).catch(
        (err: unknown) => {
          // eslint-disable-next-line no-console
          console.error("reviewTask(confirm-durable) failed", err);
        },
      );
    },
    [vaultSlug],
  );

  const fireRefine = useCallback(
    (taskId: string, refinement: string) => {
      // W-INBOX-2: refine now spawns a free-instruction task via the
      // V2 endpoint instead of riding the legacy review-action verb.
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

  const fireMarkStale = useCallback(
    (taskId: string) => {
      // Legacy-only action — decision-backed tasks don't surface
      // "mark stale" since `options` carries every meaningful choice.
      void reviewTask(taskId, { kind: "mark-stale" }, vaultSlug).catch(
        (err: unknown) => {
          // eslint-disable-next-line no-console
          console.error("reviewTask(mark-stale) failed", err);
        },
      );
    },
    [vaultSlug],
  );

  const skillForTask = useCallback(
    (task: Task): Skill | undefined => skillsByKey[task.skillId],
    [skillsByKey],
  );

  const handleConfirmDurable = useCallback(
    (taskId: string) => {
      const task = reviewTasksById[taskId];
      const skill = task ? skillForTask(task) : undefined;
      const skillKey = skill?.id ?? task?.skillId;
      const isWrite =
        task?.result != null &&
        WRITE_ARTIFACT_TYPES.has(task.result.artifact.type);
      if (isWrite && skillKey && !readFirstWriteAck(vaultSlug, skillKey)) {
        setFirstWriteForTaskId(taskId);
        return;
      }
      fireConfirmDurable(taskId);
    },
    [reviewTasksById, skillForTask, vaultSlug, fireConfirmDurable],
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

  const handleFirstWriteConfirm = useCallback(() => {
    const taskId = firstWriteForTaskId;
    if (!taskId) return;
    const task = reviewTasksById[taskId];
    const skill = task ? skillForTask(task) : undefined;
    const skillKey = skill?.id ?? task?.skillId;
    if (skillKey) writeFirstWriteAck(vaultSlug, skillKey);
    fireConfirmDurable(taskId);
    setFirstWriteForTaskId(null);
  }, [
    firstWriteForTaskId,
    reviewTasksById,
    skillForTask,
    vaultSlug,
    fireConfirmDurable,
  ]);

  const firstWriteSkillName = useMemo(() => {
    const task = firstWriteForTaskId
      ? reviewTasksById[firstWriteForTaskId]
      : null;
    const skill = task ? skillForTask(task) : undefined;
    return skill?.name ?? task?.skillId ?? "this skill";
  }, [firstWriteForTaskId, reviewTasksById, skillForTask]);

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
            onConfirmDurable={() => handleConfirmDurable(task.id)}
            onRefine={(refinement) => {
              // ReviewItem's own RefineModal still fires its onRefine
              // directly with the refined text — we don't re-open the
              // page-level modal here.
              fireRefine(task.id, refinement);
            }}
            onDismiss={() => fireDismiss(task.id)}
            onMarkStale={() => fireMarkStale(task.id)}
          />
        );
      })}
      {refineForTaskId ? (
        <RefineModal
          onSubmit={handleRefineSubmit}
          onCancel={() => setRefineForTaskId(null)}
        />
      ) : null}
      {firstWriteForTaskId ? (
        <FirstWriteModal
          skillName={firstWriteSkillName}
          onConfirm={handleFirstWriteConfirm}
          onCancel={() => setFirstWriteForTaskId(null)}
        />
      ) : null}
    </div>
  );
}
