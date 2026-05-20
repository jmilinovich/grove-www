import { notFound } from "next/navigation";
import * as groveApi from "@/lib/grove-api.v2";
import type { Task } from "@/lib/grove-api.v2.types";
import { TaskDetail } from "@/components/task/task-detail";

interface PageProps {
  params: Promise<{ atHandle: string; vaultSlug: string; id: string }>;
}

export const metadata = {
  title: "Task — Grove",
};

// grove-api.v2.ts now exposes a unified (vault, taskId) signature across
// mock + live, so we call fetchTask directly with no type laundering.

/**
 * W3-TASK-1 — task detail route.
 *
 * Server-renders the task via `fetchTask(taskId)` and hands off to the
 * `<TaskDetail />` component which composes a small client island for
 * keyboard shortcuts + action wiring. Per PLAN.md W3-TASK-1.
 *
 * Auth + slug shape are handled upstream by the parent `[vaultSlug]`
 * layout (SLUG_RE check + notFound). Per-vault membership authorization
 * lives in the data layer — when the live grove-api lands it'll surface
 * 401/403 on the fetch itself. If the task id doesn't exist (mock throws
 * "task <id> not found"), we surface a 404 — that's the user-meaningful
 * shape, not a 500.
 */
export default async function TaskDetailPage({ params }: PageProps) {
  await groveApi.assertV2Authed();
  const { atHandle, vaultSlug, id } = await params;

  let task: Task;
  try {
    task = await groveApi.fetchTask(vaultSlug, id);
  } catch {
    notFound();
  }

  const backHref = `/@${atHandle}/${vaultSlug}`;

  return (
    <main className="min-h-screen bg-cream text-ink">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <TaskDetail
          task={task}
          vaultSlug={vaultSlug}
          backHref={backHref}
        />
      </div>
    </main>
  );
}
