import { beforeEach, describe, expect, it } from "vitest";

// Inbox v2 (W-INBOX-1) — mock-impl tests for the new V2 review actions.
//
// The mock store mirrors enough of the server-side Decision +
// suppression behavior to keep round-trips honest in dev/preview. The
// Server Action tests (review.test.ts) cover the wrapper contract; the
// live wire tests (grove-api.v2.test.ts) cover the HTTP body shape;
// these cover the state transitions the mock owns.

import {
  applyTask,
  refineTask,
  dismissReviewTask,
  __resetMockStore,
  __getMockStore,
} from "./grove-api.v2.mock";

beforeEach(() => {
  __resetMockStore();
});

describe("mock applyTask — V2 review action", () => {
  it("marks the task done and confirms the linked decision", async () => {
    await applyTask("personal", "task-004", "opt-1");

    const store = __getMockStore();
    const task = store.tasks.find((t) => t.id === "task-004");
    expect(task?.state).toBe("done");
    expect(task?.completedAt).toBeTruthy();

    const decision = store.decisions.find((d) => d.taskId === "task-004");
    expect(decision?.status).toBe("confirmed");
  });

  it("throws when the task id is unknown", async () => {
    await expect(applyTask("personal", "task-missing", "opt-1")).rejects.toThrow(
      /task-missing/,
    );
  });
});

describe("mock refineTask — V2 review action", () => {
  it("marks the original done, spawns a refine-handler task, compensates the decision", async () => {
    const before = __getMockStore().tasks.length;

    await refineTask("personal", "task-004", "merge into Anna Kim");

    const store = __getMockStore();
    const original = store.tasks.find((t) => t.id === "task-004");
    expect(original?.state).toBe("done");

    const spawned = store.tasks.find(
      (t) => t.skillId === "refine-handler" && t.description === "merge into Anna Kim",
    );
    expect(spawned).toBeDefined();
    expect(spawned?.state).toBe("pending");
    expect(store.tasks.length).toBe(before + 1);

    const decision = store.decisions.find((d) => d.taskId === "task-004");
    expect(decision?.status).toBe("compensated");
  });

  it("throws when the task id is unknown", async () => {
    await expect(refineTask("personal", "task-missing", "x")).rejects.toThrow(
      /task-missing/,
    );
  });
});

describe("mock dismissReviewTask — V2 review action", () => {
  it("dismisses the task and records a suppression entry for the linked decision", async () => {
    await dismissReviewTask("personal", "task-005");

    const store = __getMockStore();
    const task = store.tasks.find((t) => t.id === "task-005");
    expect(task?.state).toBe("dismissed");

    const suppression = store.suppressions.find(
      (s) => s.primaryEntity === "parametric design",
    );
    expect(suppression).toBeDefined();
    expect(suppression?.suggestionType).toBe("link");
    // until should parse to a future ISO timestamp
    expect(new Date(suppression!.until).getTime()).toBeGreaterThan(Date.now());
  });

  it("dismisses without suppression when no decision is linked", async () => {
    // task-001 is a legacy review task with no decision row.
    await dismissReviewTask("personal", "task-001");

    const store = __getMockStore();
    expect(store.tasks.find((t) => t.id === "task-001")?.state).toBe("dismissed");
    expect(store.suppressions.length).toBe(0);
  });

  it("throws when the task id is unknown", async () => {
    await expect(dismissReviewTask("personal", "task-missing")).rejects.toThrow(
      /task-missing/,
    );
  });
});

describe("mock fixtures — V2 review tasks visible per suggestion class", () => {
  it("seeds at least one review task per SuggestionType", async () => {
    const store = __getMockStore();
    const reviewTasks = store.tasks.filter((t) => t.state === "review");
    const itemTypes = reviewTasks
      .map((t) => t.itemType)
      .filter((t): t is NonNullable<typeof t> => t !== undefined);
    expect(itemTypes).toEqual(
      expect.arrayContaining(["disambiguation", "link", "enrichment"]),
    );
  });

  it("each V2 review task has at least 2 options with stable schema ids", async () => {
    const store = __getMockStore();
    const v2Tasks = store.tasks.filter(
      (t) => t.state === "review" && t.itemType && t.options,
    );
    expect(v2Tasks.length).toBeGreaterThanOrEqual(3);
    for (const t of v2Tasks) {
      expect(t.options!.length).toBeGreaterThanOrEqual(2);
      for (const opt of t.options!) {
        expect(opt.id).toMatch(/^opt-\d+$/);
        expect(opt.label.length).toBeGreaterThan(0);
        expect(["schema", "llm"]).toContain(opt.source);
      }
    }
  });
});
