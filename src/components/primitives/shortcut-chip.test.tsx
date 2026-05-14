// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ShortcutChip } from "./shortcut-chip";

afterEach(() => {
  cleanup();
});

describe("ShortcutChip", () => {
  it("renders the keys text verbatim", () => {
    render(<ShortcutChip keys="r" />);
    expect(screen.getByText("r")).toBeTruthy();
  });

  it("renders ⌘k as written", () => {
    render(<ShortcutChip keys="⌘K" />);
    expect(screen.getByText("⌘K")).toBeTruthy();
  });

  it("uses the <kbd> element for semantics", () => {
    const { container } = render(<ShortcutChip keys="r" />);
    const kbd = container.querySelector("kbd");
    expect(kbd).toBeTruthy();
    expect(kbd?.textContent).toBe("r");
  });

  it("applies the shortcut-chip token classes (font-mono + bg-surface)", () => {
    const { container } = render(<ShortcutChip keys="r" />);
    const kbd = container.querySelector("kbd");
    expect(kbd).toBeTruthy();
    const className = kbd?.getAttribute("class") ?? "";
    expect(className).toContain("font-mono");
    expect(className).toContain("bg-surface");
    expect(className).toContain("text-detail");
    expect(className).toContain("rounded-sm");
  });

  it("is hidden by default and becomes visible at md (mobile-hidden via hidden md:inline-flex)", () => {
    const { container } = render(<ShortcutChip keys="r" />);
    const kbd = container.querySelector("kbd");
    const className = kbd?.getAttribute("class") ?? "";
    expect(className).toContain("hidden");
    expect(className).toContain("md:inline-flex");
  });

  it("has an accessible aria-label naming it as a keyboard shortcut", () => {
    render(<ShortcutChip keys="⌘/" />);
    const el = screen.getByLabelText("Keyboard shortcut: ⌘/");
    expect(el).toBeTruthy();
  });
});
