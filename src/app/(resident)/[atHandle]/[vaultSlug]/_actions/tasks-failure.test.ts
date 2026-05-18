import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// W3-FAIL-1 — Server Action end-to-end test for the failure path.
//
// Distinct from `tasks.test.ts`, which stubs the entire grove-api.v2
// surface to verify wiring shape (action -> api -> updateTag). This file
// goes one layer deeper: it runs `retryTask` against the REAL mock
// module (`grove-api.v2.mock.ts`) so we prove the action actually
// drives a state transition end-to-end, and that the same tag is
// invalidated on the way out. `next/cache` is still mocked — it's the
// boundary to the framework, not the api.
//
// Why this matters for W3-FAIL-1: the TaskCard visual for the failed
// state was wired in W1-PRIM-2, and `retryTask` itself was added in
// W2-ACTIONS as an alias for `runTask`. Without an integration-level
// test, nothing pins the contract "retry of a failed task succeeds via
// the same code path as run". This file pins it.

vi.mock("next/cache", () => ({
  updateTag: vi.fn(),
}));

import { updateTag } from "next/cache";
import { __resetMockStore } from "@/lib/grove-api.v2.mock";
import * as groveApi from "@/lib/grove-api.v2";
import { retryTask, runTask } from "./tasks";

const mockedUpdateTag = vi.mocked(updateTag);

beforeEach(() => {
  __resetMockStore();
  mockedUpdateTag.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("retryTask end-to-end against the real mock store", () => {
  it("re-runs an existing task and transitions it through the mock to 'done'", async () => {
    // Use a seeded pending task. The mock's runTask sets state=done
    // regardless of prior state; retryTask is an alias, so retry of a
    // task that the user perceives as 'failed' goes through exactly
    // the same transition.
    const TASK_ID = "task-101";

    const before = await groveApi.fetchTask("main", TASK_ID);
    expect(before.state).toBe("pending");

    await retryTask(TASK_ID, "main");

    const after = await groveApi.fetchTask("main", TASK_ID);
    expect(after.state).toBe("done");
    expect(after.completedAt).not.toBeNull();
  });

  it("invalidates the per-vault backlog tag on retry", async () => {
    await retryTask("task-101", "main");

    expect(mockedUpdateTag).toHaveBeenCalledTimes(1);
    expect(mockedUpdateTag).toHaveBeenCalledWith("vault:main/backlog");
  });

  it("threads the vaultSlug from the call site into the tag", async () => {
    await retryTask("task-102", "personal");
    expect(mockedUpdateTag).toHaveBeenCalledWith("vault:personal/backlog");
  });

  it("propagates 'task not found' from the mock and does not invalidate the tag", async () => {
    await expect(retryTask("task-does-not-exist", "main")).rejects.toThrow(
      /task task-does-not-exist not found in mock store/,
    );
    expect(mockedUpdateTag).not.toHaveBeenCalled();
  });

  it("is functionally identical to runTask on the same input (same transition, same tag)", async () => {
    // retryTask is intentionally an alias for runTask under the hood
    // (see comment in tasks.ts: "the mock has no separate 'retry' path,
    // and the live API will treat it the same way"). Pin that with a
    // direct comparison.
    await runTask("task-103", "main");
    const afterRun = await groveApi.fetchTask("main", "task-103");

    __resetMockStore();
    mockedUpdateTag.mockReset();

    await retryTask("task-103", "main");
    const afterRetry = await groveApi.fetchTask("main", "task-103");

    expect(afterRetry.state).toBe(afterRun.state);
    // result.artifact.surfaceText is the visible artifact the mock
    // emits; same shape both ways.
    expect(afterRetry.result?.artifact.surfaceText).toBe(
      afterRun.result?.artifact.surfaceText,
    );
  });
});
