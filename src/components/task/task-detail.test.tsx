// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { TaskDetail } from "./task-detail";
import type { Task } from "@/lib/grove-api.v2.types";

// The client island pulls in `next/navigation` (useRouter) and the
// Server Actions module. Both are server-aware imports that vitest's
// happy-dom env can't satisfy. Stubbing them keeps the test focused on
// what `<TaskDetail />` renders for the server-side shape.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock(
  "@/app/(resident)/[atHandle]/[vaultSlug]/_actions/tasks",
  () => ({
    runTask: vi.fn(),
    retryTask: vi.fn(),
    deferTask: vi.fn(),
    dismissTask: vi.fn(),
  }),
);

// `useKeyboardShortcuts` runs `useEffect` against `window` at mount; in
// happy-dom this is fine but the bindings array re-creates each render
// and that thrashes test logs. We stub it to a no-op — keyboard flow is
// covered by the existing use-keyboard-shortcuts.test.ts.
vi.mock("@/lib/use-keyboard-shortcuts", () => ({
  useKeyboardShortcuts: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const BASE_TASK: Task = {
  id: "task-detail-happy",
  skillId: "skill-journal-patterns",
  title: "Weekly journal patterns",
  description: "themes across the last 14 days",
  state: "pending",
  scheduledFor: "2026-05-13T23:00:00Z",
  startedAt: null,
  completedAt: null,
  estimatedMinutes: 14,
  actualMinutes: null,
  result: null,
  sourceNotes: ["Journal/2026-05-10.md", "Journal/2026-05-11.md"],
};

const REVIEWED_TASK: Task = {
  id: "task-detail-review",
  skillId: "skill-perishable-audit",
  title: "mark perishable as durable? (12d old)",
  description: "Claim about Workspace org structure was written 12d ago.",
  state: "review",
  scheduledFor: null,
  startedAt: "2026-05-13T15:00:00Z",
  completedAt: "2026-05-13T15:00:30Z",
  estimatedMinutes: 1,
  actualMinutes: 1,
  result: {
    artifact: {
      type: "surface",
      surfaceText:
        "Perishable claim from 2026-05-01: still accurate per public record.",
    },
    provenance: {
      voice: "perishable",
      by: "claude-opus-4-7",
      writtenAt: "2026-05-13T15:00:30Z",
      source: "perishable-audit weekly",
      reason: "perishable claim aged past 14-day threshold",
    },
  },
  needsReviewReason: "perishable claim aged past 14-day threshold",
  sourceNotes: ["Resources/People/yulie-kwon-kim.md"],
};

const FAILED_TASK: Task = {
  ...BASE_TASK,
  id: "task-detail-failed",
  state: "failed",
  errorMessage: "Grove API timed out after 30s",
};

const DONE_TASK: Task = {
  ...BASE_TASK,
  id: "task-detail-done",
  state: "done",
  startedAt: "2026-05-13T03:00:00Z",
  completedAt: "2026-05-13T03:14:21Z",
  actualMinutes: 14,
  result: {
    artifact: { type: "surface", surfaceText: "7 patterns surfaced" },
    provenance: {
      voice: "perishable",
      by: "claude-opus-4-7",
      writtenAt: "2026-05-13T03:14:21Z",
    },
  },
};

describe("TaskDetail (W3-TASK-1)", () => {
  it("renders title and description for a happy-path task", () => {
    render(
      <TaskDetail
        task={BASE_TASK}
        vaultSlug="personal"
        backHref="/@jm/personal"
      />,
    );
    expect(screen.getByText("Weekly journal patterns")).toBeTruthy();
    expect(screen.getByText("themes across the last 14 days")).toBeTruthy();
  });

  it("renders state badge, scheduled-for, and related notes", () => {
    render(
      <TaskDetail
        task={BASE_TASK}
        vaultSlug="personal"
        backHref="/@jm/personal"
      />,
    );
    const badge = screen.getByTestId("task-state-badge");
    expect(badge.getAttribute("data-state")).toBe("pending");
    expect(screen.getByTestId("task-scheduled")).toBeTruthy();
    const related = screen.getByTestId("task-related-notes");
    expect(related.textContent).toContain("Journal/2026-05-10.md");
    expect(related.textContent).toContain("Journal/2026-05-11.md");
  });

  it("renders provenance metadata when present (review task)", () => {
    render(
      <TaskDetail
        task={REVIEWED_TASK}
        vaultSlug="personal"
        backHref="/@jm/personal"
      />,
    );
    // ProvenanceBadge surfaces as a button labelled "perishable".
    const badge = screen.getByRole("button", { name: /perishable/i });
    expect(badge).toBeTruthy();
    // Surface text from the artifact is on the page.
    expect(
      screen.getByText(/still accurate per public record/i),
    ).toBeTruthy();
    // Run history fields land on the page (started + completed).
    const history = screen.getByTestId("task-run-history");
    expect(history.textContent).toContain("2026-05-13T15:00:00Z");
    expect(history.textContent).toContain("2026-05-13T15:00:30Z");
  });

  it("pending task shows a Run primary action", () => {
    render(
      <TaskDetail
        task={BASE_TASK}
        vaultSlug="personal"
        backHref="/@jm/personal"
      />,
    );
    const primary = screen.getByTestId("task-primary-action");
    expect(primary.getAttribute("data-action")).toBe("run");
    expect(primary.textContent?.toLowerCase()).toContain("run");
  });

  it("review task shows a Confirm primary action", () => {
    render(
      <TaskDetail
        task={REVIEWED_TASK}
        vaultSlug="personal"
        backHref="/@jm/personal"
      />,
    );
    const primary = screen.getByTestId("task-primary-action");
    expect(primary.getAttribute("data-action")).toBe("confirm");
    expect(primary.textContent?.toLowerCase()).toContain("confirm");
  });

  it("failed task shows a Retry primary action and surfaces errorMessage", () => {
    render(
      <TaskDetail
        task={FAILED_TASK}
        vaultSlug="personal"
        backHref="/@jm/personal"
      />,
    );
    const primary = screen.getByTestId("task-primary-action");
    expect(primary.getAttribute("data-action")).toBe("retry");
    expect(primary.textContent?.toLowerCase()).toContain("retry");
    expect(screen.getByTestId("task-error").textContent).toContain(
      "Grove API timed out after 30s",
    );
  });

  it("done task shows no primary action", () => {
    render(
      <TaskDetail
        task={DONE_TASK}
        vaultSlug="personal"
        backHref="/@jm/personal"
      />,
    );
    expect(screen.queryByTestId("task-primary-action")).toBeNull();
    // Back link is always present.
    expect(screen.getByTestId("task-back")).toBeTruthy();
  });

  it("dismissed task shows no primary action", () => {
    const dismissed: Task = { ...DONE_TASK, state: "dismissed" };
    render(
      <TaskDetail
        task={dismissed}
        vaultSlug="personal"
        backHref="/@jm/personal"
      />,
    );
    expect(screen.queryByTestId("task-primary-action")).toBeNull();
  });
});
