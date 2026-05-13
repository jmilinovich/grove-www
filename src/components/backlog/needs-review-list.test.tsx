// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { NeedsReviewList } from "./needs-review-list";
import type { Skill, Task } from "@/lib/grove-api.v2.types";

// `next/link` stub so we can render without the Next.js context.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
  } & Record<string, unknown>) =>
    React.createElement("a", { href, onClick, ...rest }, children),
}));

function buildTask(overrides: Partial<Task> = {}): Task {
  return {
    id: `task-${Math.random().toString(36).slice(2, 8)}`,
    skillId: "skill-journal-patterns",
    title: "merge concepts? 'Pappu' ≈ 'Aparna'",
    description: "two concept notes look like the same person",
    state: "review",
    scheduledFor: null,
    startedAt: null,
    completedAt: "2026-05-11T10:00:00Z",
    estimatedMinutes: 4,
    actualMinutes: 3,
    result: null,
    needsReviewReason: "name-similarity ≥ 0.85",
    sourceNotes: ["Resources/People/Pappu.md"],
    ...overrides,
  };
}

const SKILL: Skill = {
  id: "skill-journal-patterns",
  slug: "journal-patterns",
  name: "Journal Patterns",
  domain: "journal",
  author: "builtin",
  description: "scans journal for cross-cutting themes",
  sampleTasks: [],
  cadenceOptions: ["weekly"],
  defaultCadence: "weekly",
  defaultArtifactType: "surface",
  installState: "installed",
};

const SKILLS_BY_SLUG: Record<string, Skill> = {
  "skill-journal-patterns": SKILL,
};

function dispatchKey(key: string): KeyboardEvent {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
  });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
}

function noopHandlers() {
  return {
    onConfirmDurable: vi.fn(),
    onRefine: vi.fn(),
    onDismiss: vi.fn(),
    onMarkStale: vi.fn(),
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("NeedsReviewList (W2-LIST-1)", () => {
  it("renders null when reviewTasks is empty", () => {
    const { container } = render(
      <NeedsReviewList
        reviewTasks={[]}
        skillsBySlug={SKILLS_BY_SLUG}
        {...noopHandlers()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders all rows when N <= 5 (no 'see all' link)", () => {
    const tasks = [
      buildTask({ id: "t1", title: "row one" }),
      buildTask({ id: "t2", title: "row two" }),
      buildTask({ id: "t3", title: "row three" }),
    ];
    render(
      <NeedsReviewList
        reviewTasks={tasks}
        skillsBySlug={SKILLS_BY_SLUG}
        {...noopHandlers()}
      />,
    );

    expect(screen.getByText("row one")).toBeTruthy();
    expect(screen.getByText("row two")).toBeTruthy();
    expect(screen.getByText("row three")).toBeTruthy();
    // No "see all" affordance at N=3
    expect(screen.queryByText(/see all/i)).toBeNull();
    // Header reflects count
    expect(screen.getByText(/\(3\)/)).toBeTruthy();
  });

  it("renders 5 rows + 'see all N' link when N > 5", () => {
    const tasks = Array.from({ length: 8 }, (_, i) =>
      buildTask({ id: `t${i}`, title: `row ${i}` }),
    );
    render(
      <NeedsReviewList
        reviewTasks={tasks}
        skillsBySlug={SKILLS_BY_SLUG}
        {...noopHandlers()}
      />,
    );

    // First 5 visible
    for (let i = 0; i < 5; i++) {
      expect(screen.getByText(`row ${i}`)).toBeTruthy();
    }
    // 6+ not rendered
    expect(screen.queryByText("row 5")).toBeNull();
    expect(screen.queryByText("row 7")).toBeNull();

    // See-all link present with total N
    expect(screen.getByText(/see all 8/i)).toBeTruthy();
  });

  it("clicking a row sets focused state and reveals action footer", () => {
    const tasks = [
      buildTask({ id: "t1", title: "first" }),
      buildTask({ id: "t2", title: "second" }),
    ];
    const { container } = render(
      <NeedsReviewList
        reviewTasks={tasks}
        skillsBySlug={SKILLS_BY_SLUG}
        {...noopHandlers()}
      />,
    );

    // Initially no row is focused — no action footer
    expect(container.querySelector("[data-focused='true']")).toBeNull();
    expect(container.querySelectorAll("kbd").length).toBe(0);

    const secondRow = container.querySelector(
      "[data-task-id='t2']",
    ) as HTMLElement;
    expect(secondRow).toBeTruthy();
    fireEvent.click(secondRow);

    expect(secondRow.getAttribute("data-focused")).toBe("true");
    // Action footer with 4 ShortcutChips for c/r/x/s
    const chips = container.querySelectorAll("kbd");
    expect(chips.length).toBe(4);
    const chipTexts = Array.from(chips).map((c) => c.textContent);
    expect(chipTexts).toEqual(["c", "r", "x", "s"]);
  });

  it("`c` key fires onConfirmDurable for the focused task", () => {
    const handlers = noopHandlers();
    const tasks = [buildTask({ id: "tA" }), buildTask({ id: "tB" })];
    const { container } = render(
      <NeedsReviewList
        reviewTasks={tasks}
        skillsBySlug={SKILLS_BY_SLUG}
        {...handlers}
      />,
    );

    const firstRow = container.querySelector(
      "[data-task-id='tA']",
    ) as HTMLElement;
    fireEvent.click(firstRow);

    dispatchKey("c");
    expect(handlers.onConfirmDurable).toHaveBeenCalledTimes(1);
    expect(handlers.onConfirmDurable).toHaveBeenCalledWith("tA");
    expect(handlers.onRefine).not.toHaveBeenCalled();
  });

  it("`r` key fires onRefine for the focused task", () => {
    const handlers = noopHandlers();
    const tasks = [buildTask({ id: "tA" }), buildTask({ id: "tB" })];
    const { container } = render(
      <NeedsReviewList
        reviewTasks={tasks}
        skillsBySlug={SKILLS_BY_SLUG}
        {...handlers}
      />,
    );

    fireEvent.click(
      container.querySelector("[data-task-id='tB']") as HTMLElement,
    );

    dispatchKey("r");
    expect(handlers.onRefine).toHaveBeenCalledTimes(1);
    expect(handlers.onRefine).toHaveBeenCalledWith("tB");
  });

  it("`x` key fires onDismiss for the focused task", () => {
    const handlers = noopHandlers();
    const tasks = [buildTask({ id: "tA" })];
    const { container } = render(
      <NeedsReviewList
        reviewTasks={tasks}
        skillsBySlug={SKILLS_BY_SLUG}
        {...handlers}
      />,
    );
    fireEvent.click(
      container.querySelector("[data-task-id='tA']") as HTMLElement,
    );

    dispatchKey("x");
    expect(handlers.onDismiss).toHaveBeenCalledTimes(1);
    expect(handlers.onDismiss).toHaveBeenCalledWith("tA");
  });

  it("`s` key fires onMarkStale for the focused task", () => {
    const handlers = noopHandlers();
    const tasks = [buildTask({ id: "tA" })];
    const { container } = render(
      <NeedsReviewList
        reviewTasks={tasks}
        skillsBySlug={SKILLS_BY_SLUG}
        {...handlers}
      />,
    );
    fireEvent.click(
      container.querySelector("[data-task-id='tA']") as HTMLElement,
    );

    dispatchKey("s");
    expect(handlers.onMarkStale).toHaveBeenCalledTimes(1);
    expect(handlers.onMarkStale).toHaveBeenCalledWith("tA");
  });

  it("`j` increments focused index; `k` decrements (capped at edges)", () => {
    const tasks = [
      buildTask({ id: "t0" }),
      buildTask({ id: "t1" }),
      buildTask({ id: "t2" }),
    ];
    const { container } = render(
      <NeedsReviewList
        reviewTasks={tasks}
        skillsBySlug={SKILLS_BY_SLUG}
        {...noopHandlers()}
      />,
    );

    // Initially nothing focused
    expect(container.querySelector("[data-focused='true']")).toBeNull();

    // j moves from no-focus to index 0
    dispatchKey("j");
    expect(
      container
        .querySelector("[data-task-id='t0']")
        ?.getAttribute("data-focused"),
    ).toBe("true");

    // j again → index 1
    dispatchKey("j");
    expect(
      container
        .querySelector("[data-task-id='t1']")
        ?.getAttribute("data-focused"),
    ).toBe("true");

    // j again → index 2 (last)
    dispatchKey("j");
    expect(
      container
        .querySelector("[data-task-id='t2']")
        ?.getAttribute("data-focused"),
    ).toBe("true");

    // j again → capped at index 2
    dispatchKey("j");
    expect(
      container
        .querySelector("[data-task-id='t2']")
        ?.getAttribute("data-focused"),
    ).toBe("true");

    // k → back to index 1
    dispatchKey("k");
    expect(
      container
        .querySelector("[data-task-id='t1']")
        ?.getAttribute("data-focused"),
    ).toBe("true");

    // k → index 0
    dispatchKey("k");
    expect(
      container
        .querySelector("[data-task-id='t0']")
        ?.getAttribute("data-focused"),
    ).toBe("true");

    // k again → capped at 0
    dispatchKey("k");
    expect(
      container
        .querySelector("[data-task-id='t0']")
        ?.getAttribute("data-focused"),
    ).toBe("true");
  });

  it("action shortcuts do not fire when no row is focused", () => {
    const handlers = noopHandlers();
    const tasks = [buildTask({ id: "tA" })];
    render(
      <NeedsReviewList
        reviewTasks={tasks}
        skillsBySlug={SKILLS_BY_SLUG}
        {...handlers}
      />,
    );

    // No click → focusedIndex stays at -1
    dispatchKey("c");
    dispatchKey("r");
    dispatchKey("x");
    dispatchKey("s");

    expect(handlers.onConfirmDurable).not.toHaveBeenCalled();
    expect(handlers.onRefine).not.toHaveBeenCalled();
    expect(handlers.onDismiss).not.toHaveBeenCalled();
    expect(handlers.onMarkStale).not.toHaveBeenCalled();
  });

  it("renders skill chip linking to /skills/<slug> on each row", () => {
    const tasks = [buildTask({ id: "tA" })];
    render(
      <NeedsReviewList
        reviewTasks={tasks}
        skillsBySlug={SKILLS_BY_SLUG}
        {...noopHandlers()}
      />,
    );
    const chip = screen.getByRole("link", { name: "Journal Patterns" });
    expect(chip.getAttribute("href")).toBe("/skills/journal-patterns");
  });
});
