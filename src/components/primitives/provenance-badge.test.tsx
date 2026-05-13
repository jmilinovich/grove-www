// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { ProvenanceBadge } from "./provenance-badge";

afterEach(() => {
  cleanup();
});

describe("ProvenanceBadge (W1-PRIM-1)", () => {
  it("renders 'durable' chip with moss tone for voice='durable'", () => {
    render(<ProvenanceBadge voice="durable" />);
    const chip = screen.getByRole("button", { name: "durable" });
    expect(chip.className).toContain("text-moss");
    expect(chip.getAttribute("aria-expanded")).toBe("false");
  });

  it("renders 'perishable' chip with harvest tone for voice='perishable'", () => {
    render(<ProvenanceBadge voice="perishable" />);
    const chip = screen.getByRole("button", { name: "perishable" });
    expect(chip.className).toContain("text-harvest");
    expect(chip.className).toContain("border-[var(--harvest-15)]");
  });

  it("returns null for voice='legacy-unknown'", () => {
    const { container } = render(<ProvenanceBadge voice="legacy-unknown" />);
    expect(container.firstChild).toBeNull();
  });

  it("toggles popover on Enter", () => {
    render(<ProvenanceBadge voice="durable" by="claude-opus-4-7" />);
    const chip = screen.getByRole("button", { name: "durable" });
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.keyDown(chip, { key: "Enter" });
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(chip.getAttribute("aria-expanded")).toBe("true");
    fireEvent.keyDown(chip, { key: "Enter" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("toggles popover on Space", () => {
    render(<ProvenanceBadge voice="durable" by="claude-opus-4-7" />);
    const chip = screen.getByRole("button", { name: "durable" });
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.keyDown(chip, { key: " " });
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.keyDown(chip, { key: " " });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("toggles popover on click", () => {
    render(<ProvenanceBadge voice="durable" />);
    const chip = screen.getByRole("button", { name: "durable" });
    fireEvent.click(chip);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(chip.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(chip);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("chip is a <button type='button'> with disclosure attributes", () => {
    render(<ProvenanceBadge voice="durable" />);
    const chip = screen.getByRole("button", { name: "durable" });
    expect(chip.tagName).toBe("BUTTON");
    expect(chip.getAttribute("type")).toBe("button");
    expect(chip.getAttribute("aria-controls")).toBeTruthy();
    fireEvent.click(chip);
    const dialog = screen.getByRole("dialog");
    expect(chip.getAttribute("aria-controls")).toBe(dialog.id);
  });

  it("renders all 5 metadata fields when provided", () => {
    render(
      <ProvenanceBadge
        voice="perishable"
        by="claude-opus-4-7"
        writtenAt="2026-05-12T00:00:00Z"
        source="conversation-123"
        reason="pattern named from one conversation; needs more cases"
        basis={["path/to/source.md", "https://example.com/post"]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "perishable" }));
    expect(screen.getByText("claude-opus-4-7")).toBeTruthy();
    expect(screen.getByText("2026-05-12T00:00:00Z")).toBeTruthy();
    expect(screen.getByText("conversation-123")).toBeTruthy();
    expect(
      screen.getByText("pattern named from one conversation; needs more cases"),
    ).toBeTruthy();
    expect(screen.getByText("path/to/source.md")).toBeTruthy();
    expect(screen.getByText("https://example.com/post")).toBeTruthy();
  });

  it("renders basis[] as <ul> of <li>", () => {
    render(
      <ProvenanceBadge
        voice="perishable"
        basis={["a.md", "b.md", "c.md"]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "perishable" }));
    const list = screen.getByRole("list");
    expect(list.tagName).toBe("UL");
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toBe("a.md");
    expect(items[2].textContent).toBe("c.md");
  });

  it("renders long basis[] (10+ entries) without breaking layout", () => {
    const longBasis = Array.from({ length: 12 }, (_, i) => `source-${i}.md`);
    render(<ProvenanceBadge voice="perishable" basis={longBasis} />);
    fireEvent.click(screen.getByRole("button", { name: "perishable" }));
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(12);
    // dialog uses overflow-auto so long content scrolls within bounds
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("overflow-auto");
  });

  it("Esc closes popover and returns focus to the chip", () => {
    render(<ProvenanceBadge voice="durable" by="claude-opus-4-7" />);
    const chip = screen.getByRole("button", { name: "durable" });
    fireEvent.click(chip);
    expect(screen.getByRole("dialog")).toBeTruthy();
    // chip should be focusable; simulate focus moving inside the dialog
    chip.blur();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(chip);
  });
});
