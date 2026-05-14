// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { FailedTaskBanner } from "./failed-task-banner";
import type { Task } from "@/lib/grove-api.v2.types";

function makeFailedTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-failed-1",
    skillId: "journal-patterns",
    title: "Weekly journal patterns",
    description: "",
    state: "failed",
    scheduledFor: null,
    startedAt: "2026-05-12T11:00:00Z",
    completedAt: null,
    estimatedMinutes: 14,
    actualMinutes: null,
    result: null,
    errorMessage: "grove api timed out",
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("FailedTaskBanner (W3-FAIL-1)", () => {
  it("renders nothing when there are zero failed tasks", () => {
    const { container } = render(
      <FailedTaskBanner failedTasks={[]} onRetry={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId("failed-task-banner")).toBeNull();
  });

  it("renders with singular noun when exactly one task failed", () => {
    render(
      <FailedTaskBanner
        failedTasks={[makeFailedTask()]}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByTestId("failed-task-banner")).toBeTruthy();
    expect(screen.getByText(/1 task failed today\./i)).toBeTruthy();
  });

  it("renders the correct plural count when more than one task failed", () => {
    render(
      <FailedTaskBanner
        failedTasks={[
          makeFailedTask({ id: "t1" }),
          makeFailedTask({ id: "t2" }),
          makeFailedTask({ id: "t3" }),
        ]}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByText(/3 tasks failed today\./i)).toBeTruthy();
  });

  it("exposes a view link with the default placeholder href when none provided", () => {
    render(
      <FailedTaskBanner
        failedTasks={[makeFailedTask()]}
        onRetry={vi.fn()}
      />,
    );
    const view = screen.getByRole("link", { name: /view/i });
    expect(view.getAttribute("href")).toBe("#");
  });

  it("honors a custom viewHref", () => {
    render(
      <FailedTaskBanner
        failedTasks={[makeFailedTask()]}
        onRetry={vi.fn()}
        viewHref="/cleared?state=failed"
      />,
    );
    expect(
      screen.getByRole("link", { name: /view/i }).getAttribute("href"),
    ).toBe("/cleared?state=failed");
  });

  it("calls onRetry once per failed task when retry all is clicked", async () => {
    const onRetry = vi.fn().mockResolvedValue(undefined);
    const failed = [
      makeFailedTask({ id: "task-a" }),
      makeFailedTask({ id: "task-b" }),
      makeFailedTask({ id: "task-c" }),
    ];

    render(<FailedTaskBanner failedTasks={failed} onRetry={onRetry} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /retry all/i }));
    });

    expect(onRetry).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenNthCalledWith(1, "task-a");
    expect(onRetry).toHaveBeenNthCalledWith(2, "task-b");
    expect(onRetry).toHaveBeenNthCalledWith(3, "task-c");
  });

  it("stops retrying when one call rejects and surfaces an alert", async () => {
    const onRetry = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("backend exploded"));

    const failed = [
      makeFailedTask({ id: "task-a" }),
      makeFailedTask({ id: "task-b" }),
      makeFailedTask({ id: "task-c" }), // should not be called
    ];

    render(<FailedTaskBanner failedTasks={failed} onRetry={onRetry} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /retry all/i }));
    });

    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenNthCalledWith(1, "task-a");
    expect(onRetry).toHaveBeenNthCalledWith(2, "task-b");

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("backend exploded");
  });
});
