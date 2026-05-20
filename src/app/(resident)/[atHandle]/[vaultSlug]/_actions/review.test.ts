import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mocks. Same pattern as tasks.test.ts — mock both the v2
// grove-api surface (to assert action arg shape + simulate errors) and
// next/cache (to assert the right tag is invalidated).
vi.mock("@/lib/grove-api.v2", () => ({
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
  applyReviewTask,
  refineReviewTask,
  dismissReviewTask,
} from "./review";

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
  mockedApplyTask.mockReset();
  mockedRefineTask.mockReset();
  mockedDismissReviewTask.mockReset();
  mockedUpdateTag.mockReset();
  mockedApplyTask.mockResolvedValue(undefined);
  mockedRefineTask.mockResolvedValue(undefined);
  mockedDismissReviewTask.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Inbox v2 — V2 Server Actions ─────────────────────────────────────
//
// These pin the call shape of the three V2 review actions that replaced
// the legacy verb-union in C-INBOX-1. Each asserts:
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

describe("vault slug threading", () => {
  it("uses the vault slug from the call site in the tag", async () => {
    await applyReviewTask("task-001", "opt-1", "personal");
    expect(mockedUpdateTag).toHaveBeenCalledWith("vault:personal/backlog");

    mockedUpdateTag.mockReset();

    await dismissReviewTask("task-002", "work");
    expect(mockedUpdateTag).toHaveBeenCalledWith("vault:work/backlog");
  });
});
