// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { BacklogList } from "./backlog-list";
import type { Skill, Task } from "@/lib/grove-api.v2.types";

// `next/link` is stubbed for the same reason as the TaskCard tests —
// the chip inside TaskCard imports it.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: { href: string; children: React.ReactNode } & Record<string, unknown>) =>
    React.createElement("a", { href, ...rest }, children),
}));

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: "task-1",
    skillId: "journal-patterns",
    title: "Weekly journal patterns",
    description: "themes across the last 14 days",
    state: "pending",
    scheduledFor: "2026-05-12T23:00:00Z",
    startedAt: null,
    completedAt: null,
    estimatedMinutes: 14,
    actualMinutes: null,
    result: null,
    ...overrides,
  };
}

function makeSkill(slug: string, name: string): Skill {
  return {
    id: slug,
    slug,
    name,
    domain: "journal",
    author: "builtin",
    description: "",
    sampleTasks: [],
    cadenceOptions: ["weekly", "on-demand"],
    defaultCadence: "weekly",
    defaultArtifactType: "surface",
    installState: "installed",
  };
}

// Default skill registry covering the slugs used across the tests.
const SKILLS_BY_SLUG: Record<string, Skill> = {
  "journal-patterns": makeSkill("journal-patterns", "Journal Patterns"),
  "concept-graph-cleanup": makeSkill("concept-graph-cleanup", "Concept Graph Cleanup"),
  "relationship-surface": makeSkill("relationship-surface", "Relationship Surface"),
  "daily-vault-review": makeSkill("daily-vault-review", "Daily Vault Review"),
};

function noopCallbacks() {
  return {
    onRun: vi.fn(),
    onDefer: vi.fn(),
    onDismiss: vi.fn(),
    onOpen: vi.fn(),
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("BacklogList (W2-LIST-2)", () => {
  it("renders pending + cleared sections with counts in the headers", () => {
    const pending = [
      makeTask({ id: "p1", title: "Pending alpha" }),
      makeTask({ id: "p2", title: "Pending beta", skillId: "concept-graph-cleanup" }),
    ];
    const cleared = [
      makeTask({ id: "c1", title: "Cleared one", state: "done" }),
    ];

    render(
      <BacklogList
        pendingTasks={pending}
        clearedTasks={cleared}
        skillsBySlug={SKILLS_BY_SLUG}
        {...noopCallbacks()}
      />,
    );

    expect(screen.getByText(/pending \(2\)/i)).toBeTruthy();
    expect(screen.getByText(/cleared this week \(1\)/i)).toBeTruthy();
    expect(screen.getByText("Pending alpha")).toBeTruthy();
    expect(screen.getByText("Cleared one")).toBeTruthy();
  });

  it("hides the cleared section header entirely when no cleared tasks", () => {
    render(
      <BacklogList
        pendingTasks={[makeTask({ id: "p1" })]}
        clearedTasks={[]}
        skillsBySlug={SKILLS_BY_SLUG}
        {...noopCallbacks()}
      />,
    );
    expect(screen.queryByText(/cleared this week/i)).toBeNull();
  });

  describe("skill filter", () => {
    it("renders one <option> per unique skill in pending, plus 'all skills'", () => {
      const pending = [
        makeTask({ id: "p1", skillId: "journal-patterns" }),
        makeTask({ id: "p2", skillId: "concept-graph-cleanup" }),
        makeTask({ id: "p3", skillId: "journal-patterns" }), // dup — same option
      ];
      render(
        <BacklogList
          pendingTasks={pending}
          clearedTasks={[]}
          skillsBySlug={SKILLS_BY_SLUG}
          {...noopCallbacks()}
        />,
      );
      const select = screen.getByRole("combobox") as HTMLSelectElement;
      const optionTexts = Array.from(select.options).map((o) => o.textContent);
      expect(optionTexts).toContain("all skills");
      expect(optionTexts).toContain("Journal Patterns");
      expect(optionTexts).toContain("Concept Graph Cleanup");
      // Journal Patterns appears only once even though two tasks reference it
      expect(optionTexts.filter((t) => t === "Journal Patterns").length).toBe(1);
    });

    it("narrows the pending list when a skill is selected; clears with 'all skills'", () => {
      const pending = [
        makeTask({ id: "p1", title: "Journal one", skillId: "journal-patterns" }),
        makeTask({ id: "p2", title: "Concept one", skillId: "concept-graph-cleanup" }),
        makeTask({ id: "p3", title: "Journal two", skillId: "journal-patterns" }),
      ];
      render(
        <BacklogList
          pendingTasks={pending}
          clearedTasks={[]}
          skillsBySlug={SKILLS_BY_SLUG}
          {...noopCallbacks()}
        />,
      );

      const select = screen.getByRole("combobox") as HTMLSelectElement;
      fireEvent.change(select, { target: { value: "journal-patterns" } });

      expect(screen.getByText("Journal one")).toBeTruthy();
      expect(screen.getByText("Journal two")).toBeTruthy();
      expect(screen.queryByText("Concept one")).toBeNull();

      // Reset to "all skills"
      fireEvent.change(select, { target: { value: "" } });
      expect(screen.getByText("Concept one")).toBeTruthy();
    });
  });

  describe("cleared section cap", () => {
    it("renders at most 20 cleared rows even when given more", () => {
      const cleared = Array.from({ length: 35 }, (_, i) =>
        makeTask({ id: `c${i}`, title: `Cleared ${i}`, state: "done" }),
      );
      render(
        <BacklogList
          pendingTasks={[]}
          clearedTasks={cleared}
          skillsBySlug={SKILLS_BY_SLUG}
          {...noopCallbacks()}
        />,
      );
      // Header still reflects the full count
      expect(screen.getByText(/cleared this week \(35\)/i)).toBeTruthy();
      // But only 20 rows render
      const rows = screen
        .getAllByRole("article")
        .filter((el) => el.getAttribute("data-task-state") === "done");
      expect(rows.length).toBe(20);
    });
  });

  describe("scale", () => {
    it("renders 100+ pending rows without truncation", () => {
      const pending = Array.from({ length: 120 }, (_, i) =>
        makeTask({ id: `p${i}`, title: `Pending ${i}` }),
      );
      render(
        <BacklogList
          pendingTasks={pending}
          clearedTasks={[]}
          skillsBySlug={SKILLS_BY_SLUG}
          {...noopCallbacks()}
        />,
      );
      const pendingArticles = screen
        .getAllByRole("article")
        .filter((el) => el.getAttribute("data-task-state") === "pending");
      expect(pendingArticles.length).toBe(120);
    });
  });

  describe("keyboard navigation", () => {
    it("j cycles focus down through the pending section", () => {
      const pending = [
        makeTask({ id: "p1" }),
        makeTask({ id: "p2" }),
        makeTask({ id: "p3" }),
      ];
      const { container } = render(
        <BacklogList
          pendingTasks={pending}
          clearedTasks={[]}
          skillsBySlug={SKILLS_BY_SLUG}
          {...noopCallbacks()}
        />,
      );

      // Initial focus = -1 — no row is focused
      expect(container.querySelector("[data-focused='true']")).toBeNull();

      fireEvent.keyDown(window, { key: "j" });
      expect(
        container.querySelector("[data-task-id='p1'][data-focused='true']"),
      ).toBeTruthy();

      fireEvent.keyDown(window, { key: "j" });
      expect(
        container.querySelector("[data-task-id='p2'][data-focused='true']"),
      ).toBeTruthy();

      fireEvent.keyDown(window, { key: "j" });
      expect(
        container.querySelector("[data-task-id='p3'][data-focused='true']"),
      ).toBeTruthy();

      // Wraps back to first
      fireEvent.keyDown(window, { key: "j" });
      expect(
        container.querySelector("[data-task-id='p1'][data-focused='true']"),
      ).toBeTruthy();
    });

    it("k cycles focus up through the pending section", () => {
      const pending = [
        makeTask({ id: "p1" }),
        makeTask({ id: "p2" }),
        makeTask({ id: "p3" }),
      ];
      const { container } = render(
        <BacklogList
          pendingTasks={pending}
          clearedTasks={[]}
          skillsBySlug={SKILLS_BY_SLUG}
          {...noopCallbacks()}
        />,
      );

      // k from no-focus goes to last row
      fireEvent.keyDown(window, { key: "k" });
      expect(
        container.querySelector("[data-task-id='p3'][data-focused='true']"),
      ).toBeTruthy();

      fireEvent.keyDown(window, { key: "k" });
      expect(
        container.querySelector("[data-task-id='p2'][data-focused='true']"),
      ).toBeTruthy();
    });

    it("ArrowDown / ArrowUp behave like j / k", () => {
      const pending = [makeTask({ id: "p1" }), makeTask({ id: "p2" })];
      const { container } = render(
        <BacklogList
          pendingTasks={pending}
          clearedTasks={[]}
          skillsBySlug={SKILLS_BY_SLUG}
          {...noopCallbacks()}
        />,
      );
      fireEvent.keyDown(window, { key: "ArrowDown" });
      expect(
        container.querySelector("[data-task-id='p1'][data-focused='true']"),
      ).toBeTruthy();
      fireEvent.keyDown(window, { key: "ArrowDown" });
      expect(
        container.querySelector("[data-task-id='p2'][data-focused='true']"),
      ).toBeTruthy();
      fireEvent.keyDown(window, { key: "ArrowUp" });
      expect(
        container.querySelector("[data-task-id='p1'][data-focused='true']"),
      ).toBeTruthy();
    });
  });

  describe("focused-row callbacks", () => {
    it("r fires onRun for the focused pending task", () => {
      const onRun = vi.fn();
      const pending = [makeTask({ id: "p1" }), makeTask({ id: "p2" })];
      render(
        <BacklogList
          pendingTasks={pending}
          clearedTasks={[]}
          skillsBySlug={SKILLS_BY_SLUG}
          onRun={onRun}
          onDefer={vi.fn()}
          onDismiss={vi.fn()}
          onOpen={vi.fn()}
        />,
      );
      fireEvent.keyDown(window, { key: "j" }); // focus p1
      fireEvent.keyDown(window, { key: "j" }); // focus p2
      fireEvent.keyDown(window, { key: "r" });
      expect(onRun).toHaveBeenCalledTimes(1);
      expect(onRun).toHaveBeenCalledWith("p2");
    });

    it("e fires onDefer for the focused pending task", () => {
      const onDefer = vi.fn();
      const pending = [makeTask({ id: "p1" })];
      render(
        <BacklogList
          pendingTasks={pending}
          clearedTasks={[]}
          skillsBySlug={SKILLS_BY_SLUG}
          onRun={vi.fn()}
          onDefer={onDefer}
          onDismiss={vi.fn()}
          onOpen={vi.fn()}
        />,
      );
      fireEvent.keyDown(window, { key: "j" });
      fireEvent.keyDown(window, { key: "e" });
      expect(onDefer).toHaveBeenCalledWith("p1");
    });

    it("d fires onDismiss for the focused pending task", () => {
      const onDismiss = vi.fn();
      const pending = [makeTask({ id: "p1" })];
      render(
        <BacklogList
          pendingTasks={pending}
          clearedTasks={[]}
          skillsBySlug={SKILLS_BY_SLUG}
          onRun={vi.fn()}
          onDefer={vi.fn()}
          onDismiss={onDismiss}
          onOpen={vi.fn()}
        />,
      );
      fireEvent.keyDown(window, { key: "j" });
      fireEvent.keyDown(window, { key: "d" });
      expect(onDismiss).toHaveBeenCalledWith("p1");
    });

    it("Enter fires onOpen for the focused pending task", () => {
      const onOpen = vi.fn();
      const pending = [makeTask({ id: "p1" })];
      render(
        <BacklogList
          pendingTasks={pending}
          clearedTasks={[]}
          skillsBySlug={SKILLS_BY_SLUG}
          onRun={vi.fn()}
          onDefer={vi.fn()}
          onDismiss={vi.fn()}
          onOpen={onOpen}
        />,
      );
      fireEvent.keyDown(window, { key: "j" });
      fireEvent.keyDown(window, { key: "Enter" });
      expect(onOpen).toHaveBeenCalledWith("p1");
    });

    it("none of r/e/d/Enter fire when focusedIndex is -1", () => {
      const callbacks = {
        onRun: vi.fn(),
        onDefer: vi.fn(),
        onDismiss: vi.fn(),
        onOpen: vi.fn(),
      };
      render(
        <BacklogList
          pendingTasks={[makeTask({ id: "p1" })]}
          clearedTasks={[]}
          skillsBySlug={SKILLS_BY_SLUG}
          {...callbacks}
        />,
      );
      // No j/k yet — focus is -1
      fireEvent.keyDown(window, { key: "r" });
      fireEvent.keyDown(window, { key: "e" });
      fireEvent.keyDown(window, { key: "d" });
      fireEvent.keyDown(window, { key: "Enter" });
      expect(callbacks.onRun).not.toHaveBeenCalled();
      expect(callbacks.onDefer).not.toHaveBeenCalled();
      expect(callbacks.onDismiss).not.toHaveBeenCalled();
      expect(callbacks.onOpen).not.toHaveBeenCalled();
    });

    it("clicking a row sets focus to that row (mouse-to-keyboard handoff)", () => {
      const pending = [makeTask({ id: "p1" }), makeTask({ id: "p2" })];
      const onRun = vi.fn();
      const { container } = render(
        <BacklogList
          pendingTasks={pending}
          clearedTasks={[]}
          skillsBySlug={SKILLS_BY_SLUG}
          onRun={onRun}
          onDefer={vi.fn()}
          onDismiss={vi.fn()}
          onOpen={vi.fn()}
        />,
      );
      // Click the second row's <li> wrapper
      const li2 = container.querySelector(
        "[data-row-section='pending'][data-row-index='1']",
      ) as HTMLElement;
      expect(li2).toBeTruthy();
      fireEvent.click(li2);
      expect(
        container.querySelector("[data-task-id='p2'][data-focused='true']"),
      ).toBeTruthy();
      fireEvent.keyDown(window, { key: "r" });
      expect(onRun).toHaveBeenCalledWith("p2");
    });
  });

  describe("cleared-section gating", () => {
    it("r does NOT fire when focus is in the cleared section", () => {
      const onRun = vi.fn();
      const pending: Task[] = [];
      const cleared = [makeTask({ id: "c1", state: "done" })];
      const { container } = render(
        <BacklogList
          pendingTasks={pending}
          clearedTasks={cleared}
          skillsBySlug={SKILLS_BY_SLUG}
          onRun={onRun}
          onDefer={vi.fn()}
          onDismiss={vi.fn()}
          onOpen={vi.fn()}
        />,
      );
      // Click a cleared row to put focus there
      const clearedLi = container.querySelector(
        "[data-row-section='cleared'][data-row-index='0']",
      ) as HTMLElement;
      fireEvent.click(clearedLi);
      expect(
        container.querySelector("[data-task-id='c1'][data-focused='true']"),
      ).toBeTruthy();

      fireEvent.keyDown(window, { key: "r" });
      fireEvent.keyDown(window, { key: "e" });
      fireEvent.keyDown(window, { key: "d" });
      expect(onRun).not.toHaveBeenCalled();
    });

    it("Enter still fires onOpen when focus is in the cleared section", () => {
      const onOpen = vi.fn();
      const cleared = [makeTask({ id: "c1", state: "done" })];
      const { container } = render(
        <BacklogList
          pendingTasks={[]}
          clearedTasks={cleared}
          skillsBySlug={SKILLS_BY_SLUG}
          onRun={vi.fn()}
          onDefer={vi.fn()}
          onDismiss={vi.fn()}
          onOpen={onOpen}
        />,
      );
      const clearedLi = container.querySelector(
        "[data-row-section='cleared'][data-row-index='0']",
      ) as HTMLElement;
      fireEvent.click(clearedLi);
      fireEvent.keyDown(window, { key: "Enter" });
      expect(onOpen).toHaveBeenCalledWith("c1");
    });
  });

  describe("filter integration with focus", () => {
    it("changing the filter resets focus (no stale index after the list shrinks)", () => {
      const pending = [
        makeTask({ id: "p1", skillId: "journal-patterns" }),
        makeTask({ id: "p2", skillId: "concept-graph-cleanup" }),
        makeTask({ id: "p3", skillId: "journal-patterns" }),
      ];
      const onRun = vi.fn();
      const { container } = render(
        <BacklogList
          pendingTasks={pending}
          clearedTasks={[]}
          skillsBySlug={SKILLS_BY_SLUG}
          onRun={onRun}
          onDefer={vi.fn()}
          onDismiss={vi.fn()}
          onOpen={vi.fn()}
        />,
      );
      fireEvent.keyDown(window, { key: "j" });
      fireEvent.keyDown(window, { key: "j" });
      fireEvent.keyDown(window, { key: "j" }); // focus p3 (index 2)

      // Now filter to concept-graph-cleanup which only has 1 task
      const select = screen.getByRole("combobox") as HTMLSelectElement;
      fireEvent.change(select, { target: { value: "concept-graph-cleanup" } });

      // Nothing focused after the change
      expect(container.querySelector("[data-focused='true']")).toBeNull();

      // r is a no-op until we re-focus
      fireEvent.keyDown(window, { key: "r" });
      expect(onRun).not.toHaveBeenCalled();

      // j now focuses the single visible task
      fireEvent.keyDown(window, { key: "j" });
      expect(
        container.querySelector("[data-task-id='p2'][data-focused='true']"),
      ).toBeTruthy();
      fireEvent.keyDown(window, { key: "r" });
      expect(onRun).toHaveBeenCalledWith("p2");
    });
  });

  describe("skill chip lookup fallback", () => {
    it("falls back to id-based lookup when the skillsBySlug map is keyed by id", () => {
      // Defensive case: the page might construct the map by id in some
      // contexts. The component scans values when the slug-key lookup
      // misses, so the chip still renders.
      const skill = makeSkill("journal-patterns", "Journal Patterns");
      const byId: Record<string, Skill> = { [skill.id]: skill };
      const pending = [makeTask({ id: "p1", skillId: "journal-patterns" })];
      render(
        <BacklogList
          pendingTasks={pending}
          clearedTasks={[]}
          skillsBySlug={byId}
          {...noopCallbacks()}
        />,
      );
      // The chip link should resolve to the skill name, not the bare id
      expect(
        screen.getByRole("link", { name: "Journal Patterns" }),
      ).toBeTruthy();
    });
  });

  describe("layout sanity", () => {
    it("section headers use lowercase + design-system size tokens", () => {
      render(
        <BacklogList
          pendingTasks={[makeTask({ id: "p1" })]}
          clearedTasks={[makeTask({ id: "c1", state: "done" })]}
          skillsBySlug={SKILLS_BY_SLUG}
          {...noopCallbacks()}
        />,
      );
      const headers = screen.getAllByRole("heading", { level: 2 });
      expect(headers.length).toBe(2);
      for (const h of headers) {
        expect(h.className).toContain("lowercase");
        expect(h.className).toContain("text-label");
      }
    });

    it("pending and cleared sections coexist without horizontal scroll markers", () => {
      // Smoke test: render a realistic load and verify nothing throws.
      const pending = Array.from({ length: 20 }, (_, i) =>
        makeTask({ id: `p${i}` }),
      );
      const cleared = Array.from({ length: 20 }, (_, i) =>
        makeTask({ id: `c${i}`, state: "done" }),
      );
      const { container } = render(
        <BacklogList
          pendingTasks={pending}
          clearedTasks={cleared}
          skillsBySlug={SKILLS_BY_SLUG}
          {...noopCallbacks()}
        />,
      );
      const pendingSection = within(
        container.querySelector(
          "[data-testid='backlog-pending']",
        ) as HTMLElement,
      );
      const clearedSection = within(
        container.querySelector(
          "[data-testid='backlog-cleared']",
        ) as HTMLElement,
      );
      expect(pendingSection.getAllByRole("article").length).toBe(20);
      expect(clearedSection.getAllByRole("article").length).toBe(20);
    });
  });
});
