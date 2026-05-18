import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mocks: vi.mock factories run before the module-under-test
// imports its dependencies. We mock both the v2 grove-api surface (so
// we can assert call args + simulate errors) and next/cache (so we
// can assert the right tag is invalidated).
//
// Cache primitive: tasks.ts uses `updateTag` (the Next.js 16 Server-Action
// primitive that replaces the single-arg `revalidateTag` from Next 15).
// Semantically equivalent to what PLAN.md W2-ACTIONS specified —
// invalidates the `vault:{slug}/backlog` tag with read-your-own-writes
// for the current request.
vi.mock("@/lib/grove-api.v2", () => ({
  runTask: vi.fn(async (_taskId: string) => {}),
  deferTask: vi.fn(async (_taskId: string, _until: string) => {}),
  dismissTask: vi.fn(async (_taskId: string) => {}),
}));

vi.mock("next/cache", () => ({
  updateTag: vi.fn(),
}));

import * as api from "@/lib/grove-api.v2";
import { updateTag } from "next/cache";
import {
  runTask,
  deferTask,
  dismissTask,
  retryTask,
} from "./tasks";

const mockedRunTask = vi.mocked(api.runTask) as unknown as ReturnType<
  typeof vi.fn<(taskId: string) => Promise<void>>
>;
const mockedDeferTask = vi.mocked(api.deferTask) as unknown as ReturnType<
  typeof vi.fn<(taskId: string, until: string) => Promise<void>>
>;
const mockedDismissTask = vi.mocked(api.dismissTask) as unknown as ReturnType<
  typeof vi.fn<(taskId: string) => Promise<void>>
>;
const mockedUpdateTag = vi.mocked(updateTag);

beforeEach(() => {
  mockedRunTask.mockReset();
  mockedDeferTask.mockReset();
  mockedDismissTask.mockReset();
  mockedUpdateTag.mockReset();
  mockedRunTask.mockResolvedValue(undefined);
  mockedDeferTask.mockResolvedValue(undefined);
  mockedDismissTask.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("runTask Server Action", () => {
  it("calls grove-api.v2.runTask with the task id and invalidates the vault backlog tag", async () => {
    await runTask("task-101", "main");

    expect(mockedRunTask).toHaveBeenCalledTimes(1);
    expect(mockedRunTask).toHaveBeenCalledWith("main", "task-101");
    expect(mockedUpdateTag).toHaveBeenCalledTimes(1);
    expect(mockedUpdateTag).toHaveBeenCalledWith("vault:main/backlog");
  });

  it("propagates errors from grove-api.v2.runTask and does not invalidate on failure", async () => {
    mockedRunTask.mockRejectedValueOnce(new Error("task task-missing not found in mock store"));

    await expect(runTask("task-missing", "main")).rejects.toThrow(
      "task task-missing not found in mock store",
    );
    expect(mockedUpdateTag).not.toHaveBeenCalled();
  });
});

describe("deferTask Server Action", () => {
  it("calls grove-api.v2.deferTask with id + until and invalidates the vault backlog tag", async () => {
    await deferTask("task-103", "2026-05-20T00:00:00Z", "main");

    expect(mockedDeferTask).toHaveBeenCalledTimes(1);
    expect(mockedDeferTask).toHaveBeenCalledWith("main", "task-103", "2026-05-20T00:00:00Z");
    expect(mockedUpdateTag).toHaveBeenCalledTimes(1);
    expect(mockedUpdateTag).toHaveBeenCalledWith("vault:main/backlog");
  });

  it("propagates errors from grove-api.v2.deferTask and does not invalidate on failure", async () => {
    mockedDeferTask.mockRejectedValueOnce(new Error("boom"));

    await expect(deferTask("task-103", "2026-05-20T00:00:00Z", "main")).rejects.toThrow(
      "boom",
    );
    expect(mockedUpdateTag).not.toHaveBeenCalled();
  });
});

describe("dismissTask Server Action", () => {
  it("calls grove-api.v2.dismissTask and invalidates the vault backlog tag", async () => {
    await dismissTask("task-102", "main");

    expect(mockedDismissTask).toHaveBeenCalledTimes(1);
    expect(mockedDismissTask).toHaveBeenCalledWith("main", "task-102");
    expect(mockedUpdateTag).toHaveBeenCalledTimes(1);
    expect(mockedUpdateTag).toHaveBeenCalledWith("vault:main/backlog");
  });

  it("propagates errors from grove-api.v2.dismissTask and does not invalidate on failure", async () => {
    mockedDismissTask.mockRejectedValueOnce(new Error("nope"));

    await expect(dismissTask("task-102", "main")).rejects.toThrow("nope");
    expect(mockedUpdateTag).not.toHaveBeenCalled();
  });
});

describe("retryTask Server Action", () => {
  it("re-runs the task via grove-api.v2.runTask and invalidates the vault backlog tag", async () => {
    await retryTask("task-failed", "main");

    expect(mockedRunTask).toHaveBeenCalledTimes(1);
    expect(mockedRunTask).toHaveBeenCalledWith("main", "task-failed");
    expect(mockedUpdateTag).toHaveBeenCalledTimes(1);
    expect(mockedUpdateTag).toHaveBeenCalledWith("vault:main/backlog");
  });

  it("propagates errors from grove-api.v2.runTask and does not invalidate on failure", async () => {
    mockedRunTask.mockRejectedValueOnce(new Error("retry boom"));

    await expect(retryTask("task-failed", "main")).rejects.toThrow("retry boom");
    expect(mockedUpdateTag).not.toHaveBeenCalled();
  });
});

describe("vault slug threading", () => {
  it("uses the vault slug from the call site in the tag", async () => {
    await runTask("task-101", "personal");
    expect(mockedUpdateTag).toHaveBeenCalledWith("vault:personal/backlog");

    mockedUpdateTag.mockReset();

    await dismissTask("task-102", "work");
    expect(mockedUpdateTag).toHaveBeenCalledWith("vault:work/backlog");
  });
});
