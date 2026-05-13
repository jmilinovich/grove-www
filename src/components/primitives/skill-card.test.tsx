// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SkillCard } from "./skill-card";
import type { Skill } from "@/lib/grove-api.v2.types";

const INSTALLED_SKILL: Skill = {
  id: "skill-journal-patterns",
  slug: "journal-patterns",
  name: "Weekly Journal Patterns",
  domain: "journal",
  author: "builtin",
  description: "surfaces patterns from your journal entries",
  sampleTasks: [
    "themes across the last 14 days",
    "topics you've stopped writing about",
  ],
  cadenceOptions: ["weekly", "on-demand"],
  defaultCadence: "weekly",
  defaultArtifactType: "surface",
  installState: "installed",
};

const DISABLED_SKILL: Skill = {
  ...INSTALLED_SKILL,
  installState: "disabled",
};

// Anchor relative-time output by freezing "now" so `formatRelative` is
// deterministic in tests. 2026-05-12 is the canonical "today" for this
// project (see CLAUDE.md currentDate).
const FROZEN_NOW = new Date("2026-05-12T12:00:00Z");

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("SkillCard (W1-PRIM-4)", () => {
  it("renders name, description, cadence, last-run, and next-run", () => {
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_NOW);

    render(
      <SkillCard
        skill={INSTALLED_SKILL}
        // 2 days before frozen now → "2 days ago" / "2d ago"
        lastRunAt="2026-05-10T12:00:00Z"
        // Within next week → weekday format ("Mon …")
        nextRunAt="2026-05-18T13:00:00Z"
      />,
    );

    expect(screen.getByText("Weekly Journal Patterns")).toBeTruthy();
    expect(
      screen.getByText("surfaces patterns from your journal entries"),
    ).toBeTruthy();

    // Metadata row contains cadence, last-run, and a next-run prefix.
    expect(screen.getByText(/cadence: weekly/)).toBeTruthy();
    expect(screen.getByText(/last run:/)).toBeTruthy();
    expect(screen.getByText(/next:/)).toBeTruthy();
  });

  it("shows 'last run: never' when lastRunAt is undefined", () => {
    render(<SkillCard skill={INSTALLED_SKILL} />);
    expect(screen.getByText(/last run: never/)).toBeTruthy();
  });

  it("omits the 'next:' segment when nextRunAt is undefined", () => {
    render(<SkillCard skill={INSTALLED_SKILL} />);
    expect(screen.queryByText(/next:/)).toBeNull();
  });

  it("fires onRunNow, onConfigure, onDisable when their actions are clicked", () => {
    const onRunNow = vi.fn();
    const onConfigure = vi.fn();
    const onDisable = vi.fn();

    render(
      <SkillCard
        skill={INSTALLED_SKILL}
        onRunNow={onRunNow}
        onConfigure={onConfigure}
        onDisable={onDisable}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /run/i }));
    expect(onRunNow).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /configure/i }));
    expect(onConfigure).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /disable/i }));
    expect(onDisable).toHaveBeenCalledTimes(1);
  });

  it("does not render an action when its callback is omitted", () => {
    render(<SkillCard skill={INSTALLED_SKILL} onRunNow={vi.fn()} />);
    expect(screen.getByRole("button", { name: /run/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /configure/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /disable/i })).toBeNull();
  });

  it("renders ShortcutChip only when shortcuts prop is passed", () => {
    const onRunNow = vi.fn();
    const onConfigure = vi.fn();
    const { container, rerender } = render(
      <SkillCard
        skill={INSTALLED_SKILL}
        onRunNow={onRunNow}
        onConfigure={onConfigure}
      />,
    );
    expect(container.querySelectorAll("kbd").length).toBe(0);

    rerender(
      <SkillCard
        skill={INSTALLED_SKILL}
        onRunNow={onRunNow}
        onConfigure={onConfigure}
        shortcuts={{ run: "r", configure: "c" }}
      />,
    );
    const chips = container.querySelectorAll("kbd");
    expect(chips.length).toBe(2);
    expect(chips[0]?.textContent).toBe("r");
    expect(chips[1]?.textContent).toBe("c");
  });

  it("grays out actions when installState === 'disabled' (text-ink/40)", () => {
    const { container } = render(
      <SkillCard
        skill={DISABLED_SKILL}
        onRunNow={vi.fn()}
        onConfigure={vi.fn()}
        onDisable={vi.fn()}
      />,
    );
    // Action row carries the tertiary-opacity class.
    const actionRow = container.querySelector(".text-ink\\/40");
    expect(actionRow).toBeTruthy();

    // The action buttons are explicitly `disabled`.
    const runBtn = screen.getByRole("button", { name: /run/i });
    expect(runBtn.hasAttribute("disabled")).toBe(true);

    const configureBtn = screen.getByRole("button", { name: /configure/i });
    expect(configureBtn.hasAttribute("disabled")).toBe(true);
  });

  it("does not fire callbacks when the card is disabled", () => {
    const onRunNow = vi.fn();
    render(
      <SkillCard skill={DISABLED_SKILL} onRunNow={onRunNow} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /run/i }));
    // <button disabled> swallows the click — handler must not fire.
    expect(onRunNow).not.toHaveBeenCalled();
  });

  it("focused=true adds the moss left border; focused=false does not", () => {
    const { container, rerender } = render(
      <SkillCard skill={INSTALLED_SKILL} />,
    );
    expect(container.querySelector(".border-l-moss")).toBeNull();
    expect(container.querySelector(".border-l-transparent")).toBeTruthy();

    rerender(<SkillCard skill={INSTALLED_SKILL} focused={true} />);
    expect(container.querySelector(".border-l-moss")).toBeTruthy();
    expect(container.querySelector(".border-l-transparent")).toBeNull();
  });

  it("uses design-system size tokens (no arbitrary text-[...] sizes)", () => {
    const { container } = render(
      <SkillCard skill={INSTALLED_SKILL} onRunNow={vi.fn()} />,
    );
    const html = container.innerHTML;
    // Title size token
    expect(html).toContain("text-subhead");
    // Description size token
    expect(html).toContain("text-body");
    // Metadata size token
    expect(html).toContain("text-detail");
    // No arbitrary text sizes (e.g. `text-[14px]`) leaked in.
    expect(/text-\[[^\]]+\]/.test(html)).toBe(false);
  });
});
