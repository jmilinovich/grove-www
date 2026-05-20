import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mocks. Same pattern as tasks.test.ts — mock both the v2
// grove-api surface (to assert action arg shape + simulate errors) and
// next/cache (to assert the right tag is invalidated).
vi.mock("@/lib/grove-api.v2", () => ({
  reviewTask: vi.fn(
    async (
      _taskId: string,
      _action:
        | { kind: "confirm-durable" }
        | { kind: "refine"; refinement: string }
        | { kind: "dismiss" }
        | { kind: "mark-stale" },
    ) => {},
  ),
  // Inbox v2 (W-INBOX-1) — new V2 review actions wired alongside the
  // legacy reviewTask above. Mocked here so the Server Action wrappers
  // can be asserted independently of the live HTTP layer.
  applyTask: vi.fn(async (_vault: string, _taskId: string, _optionId: string) => {}),
  refineTask: vi.fn(async (_vault: string, _taskId: string, _refinement: string) => {}),
  dismissReviewTask: vi.fn(async (_vault: string, _taskId: string) => {}),
}));

vi.mock("next/cache", () => ({
  updateTag: vi.fn(),
}));

import * as api from "@/lib/grove-api.v2";
import { updateTag } from "next/cache";
import {
  reviewTask,
  applyReviewTask,
  refineReviewTask,
  dismissReviewTask,
} from "./review";

type ReviewAction =
  | { kind: "confirm-durable" }
  | { kind: "refine"; refinement: string }
  | { kind: "dismiss" }
  | { kind: "mark-stale" };

const mockedReviewTask = vi.mocked(api.reviewTask) as unknown as ReturnType<
  typeof vi.fn<(taskId: string, action: ReviewAction) => Promise<void>>
>;
const mockedApplyTask = vi.mocked(api.applyTask) as unknown as ReturnType<
  typeof vi.fn<(vault: string, taskId: string, optionId: string) => Promise<void>>
>;
const mockedRefineTask = vi.mocked(api.refineTask) as unknown as ReturnType<
  typeof vi.fn<(vault: string, taskId: string, refinement: string) => Promise<void>>
>;
const mockedDismissReviewTask = vi.mocked(api.dismissReviewTask) as unknown as ReturnType<
  typeof vi.fn<(vault: string, taskId: string) => Promise<void>>
>;
const mockedUpdateTag = vi.mocked(updateTag);

beforeEach(() => {
  mockedReviewTask.mockReset();
  mockedApplyTask.mockReset();
  mockedRefineTask.mockReset();
  mockedDismissReviewTask.mockReset();
  mockedUpdateTag.mockReset();
  mockedReviewTask.mockResolvedValue(undefined);
  mockedApplyTask.mockResolvedValue(undefined);
  mockedRefineTask.mockResolvedValue(undefined);
  mockedDismissReviewTask.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("reviewTask Server Action — confirm-durable", () => {
  it("calls grove-api.v2.reviewTask with the action and invalidates the vault backlog tag", async () => {
    await reviewTask("task-001", { kind: "confirm-durable" }, "main");

    expect(mockedReviewTask).toHaveBeenCalledTimes(1);
    expect(mockedReviewTask).toHaveBeenCalledWith("main", "task-001", {
      kind: "confirm-durable",
    });
    expect(mockedUpdateTag).toHaveBeenCalledTimes(1);
    expect(mockedUpdateTag).toHaveBeenCalledWith("vault:main/backlog");
  });

  it("propagates errors and does not invalidate on failure", async () => {
    mockedReviewTask.mockRejectedValueOnce(new Error("task missing"));

    await expect(
      reviewTask("task-missing", { kind: "confirm-durable" }, "main"),
    ).rejects.toThrow("task missing");
    expect(mockedUpdateTag).not.toHaveBeenCalled();
  });
});

describe("reviewTask Server Action — refine", () => {
  it("passes the refinement text through to grove-api.v2 and invalidates", async () => {
    await reviewTask(
      "task-002",
      { kind: "refine", refinement: "rephrase as durable, drop the hedge" },
      "main",
    );

    expect(mockedReviewTask).toHaveBeenCalledWith("main", "task-002", {
      kind: "refine",
      refinement: "rephrase as durable, drop the hedge",
    });
    expect(mockedUpdateTag).toHaveBeenCalledWith("vault:main/backlog");
  });

  it("propagates errors and does not invalidate on failure", async () => {
    mockedReviewTask.mockRejectedValueOnce(new Error("refine boom"));

    await expect(
      reviewTask("task-002", { kind: "refine", refinement: "x" }, "main"),
    ).rejects.toThrow("refine boom");
    expect(mockedUpdateTag).not.toHaveBeenCalled();
  });
});

describe("reviewTask Server Action — dismiss", () => {
  it("calls grove-api.v2.reviewTask and invalidates the vault backlog tag", async () => {
    await reviewTask("task-003", { kind: "dismiss" }, "main");

    expect(mockedReviewTask).toHaveBeenCalledWith("main", "task-003", {
      kind: "dismiss",
    });
    expect(mockedUpdateTag).toHaveBeenCalledWith("vault:main/backlog");
  });

  it("propagates errors and does not invalidate on failure", async () => {
    mockedReviewTask.mockRejectedValueOnce(new Error("nope"));

    await expect(
      reviewTask("task-003", { kind: "dismiss" }, "main"),
    ).rejects.toThrow("nope");
    expect(mockedUpdateTag).not.toHaveBeenCalled();
  });
});

describe("reviewTask Server Action — mark-stale", () => {
  it("calls grove-api.v2.reviewTask and invalidates the vault backlog tag", async () => {
    await reviewTask("task-004", { kind: "mark-stale" }, "main");

    expect(mockedReviewTask).toHaveBeenCalledWith("main", "task-004", {
      kind: "mark-stale",
    });
    expect(mockedUpdateTag).toHaveBeenCalledWith("vault:main/backlog");
  });

  it("propagates errors and does not invalidate on failure", async () => {
    mockedReviewTask.mockRejectedValueOnce(new Error("stale boom"));

    await expect(
      reviewTask("task-004", { kind: "mark-stale" }, "main"),
    ).rejects.toThrow("stale boom");
    expect(mockedUpdateTag).not.toHaveBeenCalled();
  });
});

describe("vault slug threading", () => {
  it("uses the vault slug from the call site in the tag", async () => {
    await reviewTask("task-001", { kind: "confirm-durable" }, "personal");
    expect(mockedUpdateTag).toHaveBeenCalledWith("vault:personal/backlog");

    mockedUpdateTag.mockReset();

    await reviewTask("task-002", { kind: "dismiss" }, "work");
    expect(mockedUpdateTag).toHaveBeenCalledWith("vault:work/backlog");
  });
});

// ─── Inbox v2 — V2 Server Actions (W-INBOX-1) ─────────────────────────
//
// These pin the call shape of the three new actions that the legacy
// `reviewTask` will eventually be migrated off of. Each asserts:
//   1. the v2 grove-api function is called with (vault, ...) in order
//   2. the backlog tag is invalidated on success
//   3. on failure, the tag is NOT invalidated (no stale read-your-own
//      writes)

describe("applyReviewTask Server Action (V2)", () => {
  it("calls grove-api.v2.applyTask with vault, taskId, optionId and invalidates the backlog tag", async () => {
    await applyReviewTask("task-004", "opt-1", "main");

    expect(mockedApplyTask).toHaveBeenCalledTimes(1);
    expect(mockedApplyTask).toHaveBeenCalledWith("main", "task-004", "opt-1");
    expect(mockedUpdateTag).toHaveBeenCalledTimes(1);
    expect(mockedUpdateTag).toHaveBeenCalledWith("vault:main/backlog");
  });

  it("propagates errors and does not invalidate on failure", async () => {
    mockedApplyTask.mockRejectedValueOnce(new Error("apply boom"));

    await expect(applyReviewTask("task-004", "opt-1", "main")).rejects.toThrow(
      "apply boom",
    );
    expect(mockedUpdateTag).not.toHaveBeenCalled();
  });
});

describe("refineReviewTask Server Action (V2)", () => {
  it("calls grove-api.v2.refineTask with the refinement text and invalidates the backlog tag", async () => {
    await refineReviewTask("task-004", "actually merge into Anna Kim", "main");

    expect(mockedRefineTask).toHaveBeenCalledTimes(1);
    expect(mockedRefineTask).toHaveBeenCalledWith(
      "main",
      "task-004",
      "actually merge into Anna Kim",
    );
    expect(mockedUpdateTag).toHaveBeenCalledTimes(1);
    expect(mockedUpdateTag).toHaveBeenCalledWith("vault:main/backlog");
  });

  it("propagates errors and does not invalidate on failure", async () => {
    mockedRefineTask.mockRejectedValueOnce(new Error("refine boom"));

    await expect(
      refineReviewTask("task-004", "tighter please", "main"),
    ).rejects.toThrow("refine boom");
    expect(mockedUpdateTag).not.toHaveBeenCalled();
  });
});

describe("dismissReviewTask Server Action (V2)", () => {
  it("calls grove-api.v2.dismissReviewTask and invalidates the backlog tag", async () => {
    await dismissReviewTask("task-005", "main");

    expect(mockedDismissReviewTask).toHaveBeenCalledTimes(1);
    expect(mockedDismissReviewTask).toHaveBeenCalledWith("main", "task-005");
    expect(mockedUpdateTag).toHaveBeenCalledTimes(1);
    expect(mockedUpdateTag).toHaveBeenCalledWith("vault:main/backlog");
  });

  it("propagates errors and does not invalidate on failure", async () => {
    mockedDismissReviewTask.mockRejectedValueOnce(new Error("dismiss boom"));

    await expect(dismissReviewTask("task-005", "main")).rejects.toThrow(
      "dismiss boom",
    );
    expect(mockedUpdateTag).not.toHaveBeenCalled();
  });
});
