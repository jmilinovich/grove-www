// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { TaskCard } from "./task-card";
import type { Task } from "@/lib/grove-api.v2.types";

// `next/link` is a server-aware import; in the unit environment we
// stub it to a plain anchor so we can assert href values.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: { href: string; children: React.ReactNode } & Record<string, unknown>) =>
    React.createElement("a", { href, ...rest }, children),
}));

const HAPPY_TASK: Task = {
  id: "task-journal-patterns-1",
  skillId: "skill-journal-patterns",
  title: "Weekly journal patterns",
  description: "themes across the last 14 days",
  state: "pending",
  scheduledFor: "2026-05-12T23:00:00Z",
  startedAt: null,
  completedAt: null,
  estimatedMinutes: 14,
  actualMinutes: null,
  result: null,
  sourceNotes: ["Journal/2026-05-10.md", "Journal/2026-05-11.md"],
};

const FAILED_TASK: Task = {
  ...HAPPY_TASK,
  id: "task-failed-1",
  state: "failed",
  errorMessage: "Grove API timed out after 30s",
};

const SKILL = { slug: "journal-patterns", name: "Journal Patterns" };

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("TaskCard (W1-PRIM-2)", () => {
  it("renders title, skill chip, metadata, and source notes", () => {
    render(<TaskCard task={HAPPY_TASK} skill={SKILL} />);

    expect(screen.getByText("Weekly journal patterns")).toBeTruthy();
    // skill chip links to /skills/{slug}
    const chip = screen.getByRole("link", { name: "Journal Patterns" });
    expect(chip.getAttribute("href")).toBe("/skills/journal-patterns");
    // estimate appears
    expect(screen.getByText(/~14m/)).toBeTruthy();
    // source notes appear
    expect(screen.getByText(/Journal\/2026-05-10\.md/)).toBeTruthy();
  });

  it("fires onRun, onDefer, onDismiss when corresponding action clicked", () => {
    const onRun = vi.fn();
    const onDefer = vi.fn();
    const onDismiss = vi.fn();

    render(
      <TaskCard
        task={HAPPY_TASK}
        skill={SKILL}
        onRun={onRun}
        onDefer={onDefer}
        onDismiss={onDismiss}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /run/i }));
    expect(onRun).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /defer/i }));
    expect(onDefer).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("fires onOpen when title is clicked", () => {
    const onOpen = vi.fn();
    render(<TaskCard task={HAPPY_TASK} skill={SKILL} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole("button", { name: "Weekly journal patterns" }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("does not render an action when its callback is omitted", () => {
    const onRun = vi.fn();
    render(<TaskCard task={HAPPY_TASK} skill={SKILL} onRun={onRun} />);
    expect(screen.queryByRole("button", { name: /defer/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /dismiss/i })).toBeNull();
    expect(screen.getByRole("button", { name: /run/i })).toBeTruthy();
  });

  it("renders ShortcutChip only when shortcuts prop is passed", () => {
    const onRun = vi.fn();
    const { container, rerender } = render(
      <TaskCard task={HAPPY_TASK} skill={SKILL} onRun={onRun} />,
    );
    // No chips rendered without `shortcuts`
    expect(container.querySelectorAll("kbd").length).toBe(0);

    rerender(
      <TaskCard
        task={HAPPY_TASK}
        skill={SKILL}
        onRun={onRun}
        shortcuts={{ run: "r" }}
      />,
    );
    const chips = container.querySelectorAll("kbd");
    expect(chips.length).toBe(1);
    expect(chips[0]?.textContent).toBe("r");
  });

  it("failed state shows retry + dismiss (no run, no defer)", () => {
    const onRun = vi.fn();
    const onDefer = vi.fn();
    const onRetry = vi.fn();
    const onDismiss = vi.fn();

    render(
      <TaskCard
        task={FAILED_TASK}
        skill={SKILL}
        onRun={onRun}
        onDefer={onDefer}
        onRetry={onRetry}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.queryByRole("button", { name: /^run$/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /defer/i })).toBeNull();
    expect(screen.getByRole("button", { name: /retry/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /dismiss/i })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRun).not.toHaveBeenCalled();
  });

  it("failed state shows errorMessage and replaces skill chip with 'failed' label", () => {
    render(<TaskCard task={FAILED_TASK} skill={SKILL} />);
    expect(screen.getByText("Grove API timed out after 30s")).toBeTruthy();
    expect(screen.getByText("failed")).toBeTruthy();
    // skill chip link is gone
    expect(screen.queryByRole("link", { name: "Journal Patterns" })).toBeNull();
  });

  it("focused=true adds the moss left border; focused=false does not", () => {
    const { container, rerender } = render(
      <TaskCard task={HAPPY_TASK} skill={SKILL} />,
    );
    // unfocused: border-l-transparent
    expect(container.querySelector(".border-l-moss")).toBeNull();
    expect(container.querySelector(".border-l-transparent")).toBeTruthy();

    rerender(<TaskCard task={HAPPY_TASK} skill={SKILL} focused={true} />);
    expect(container.querySelector(".border-l-moss")).toBeTruthy();
    expect(container.querySelector(".border-l-transparent")).toBeNull();
  });

  it("uses design-system size tokens (no arbitrary text-[...] sizes)", () => {
    const { container } = render(
      <TaskCard task={HAPPY_TASK} skill={SKILL} onRun={vi.fn()} />,
    );
    const html = container.innerHTML;
    // Verify the title size token is in use
    expect(html).toContain("text-subhead");
    // Verify no arbitrary text sizes (e.g. `text-[14px]`) leaked in
    expect(/text-\[[^\]]+\]/.test(html)).toBe(false);
  });
});
