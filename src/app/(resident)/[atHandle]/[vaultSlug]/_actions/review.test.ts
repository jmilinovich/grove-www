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
}));

vi.mock("next/cache", () => ({
  updateTag: vi.fn(),
}));

import * as api from "@/lib/grove-api.v2";
import { updateTag } from "next/cache";
import { reviewTask } from "./review";

type ReviewAction =
  | { kind: "confirm-durable" }
  | { kind: "refine"; refinement: string }
  | { kind: "dismiss" }
  | { kind: "mark-stale" };

const mockedReviewTask = vi.mocked(api.reviewTask) as unknown as ReturnType<
  typeof vi.fn<(taskId: string, action: ReviewAction) => Promise<void>>
>;
const mockedUpdateTag = vi.mocked(updateTag);

beforeEach(() => {
  mockedReviewTask.mockReset();
  mockedUpdateTag.mockReset();
  mockedReviewTask.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("reviewTask Server Action — confirm-durable", () => {
  it("calls grove-api.v2.reviewTask with the action and invalidates the vault backlog tag", async () => {
    await reviewTask("task-001", { kind: "confirm-durable" }, "main");

    expect(mockedReviewTask).toHaveBeenCalledTimes(1);
    expect(mockedReviewTask).toHaveBeenCalledWith("task-001", {
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

    expect(mockedReviewTask).toHaveBeenCalledWith("task-002", {
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

    expect(mockedReviewTask).toHaveBeenCalledWith("task-003", {
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

    expect(mockedReviewTask).toHaveBeenCalledWith("task-004", {
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
