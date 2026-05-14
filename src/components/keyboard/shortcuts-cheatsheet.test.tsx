// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { ShortcutsCheatsheet } from "./shortcuts-cheatsheet";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function mockMatchMedia(coarse: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("hover: none") ? coarse : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

describe("ShortcutsCheatsheet", () => {
  it("returns null when open is false", () => {
    mockMatchMedia(false);
    const { container } = render(
      <ShortcutsCheatsheet open={false} onClose={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders all 5 sections when open (global / backlog / review / task detail / skills)", () => {
    mockMatchMedia(false);
    render(<ShortcutsCheatsheet open onClose={() => {}} />);

    expect(screen.getByText("global")).toBeTruthy();
    expect(screen.getByText("backlog")).toBeTruthy();
    expect(screen.getByText("review")).toBeTruthy();
    expect(screen.getByText("task detail")).toBeTruthy();
    expect(screen.getByText("skills")).toBeTruthy();
  });

  it("renders bindings from SPEC §15 (spot-check ⌘K, ⌘/, Enter, j/k)", () => {
    mockMatchMedia(false);
    render(<ShortcutsCheatsheet open onClose={() => {}} />);

    // ShortcutChip renders `keys` verbatim as text content of <kbd>.
    expect(screen.getAllByText("⌘K").length).toBeGreaterThan(0);
    expect(screen.getAllByText("⌘/").length).toBeGreaterThan(0);
    expect(screen.getAllByText("j / k").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Enter").length).toBeGreaterThan(0);
  });

  it("Esc keypress calls onClose", () => {
    mockMatchMedia(false);
    const onClose = vi.fn();
    render(<ShortcutsCheatsheet open onClose={onClose} />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose on Esc when closed (handler is removed)", () => {
    mockMatchMedia(false);
    const onClose = vi.fn();
    render(<ShortcutsCheatsheet open={false} onClose={onClose} />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("clicking the scrim closes; clicking the card does not", () => {
    mockMatchMedia(false);
    const onClose = vi.fn();
    render(<ShortcutsCheatsheet open onClose={onClose} />);

    const dialog = screen.getByRole("dialog");
    // Click on scrim itself (target === currentTarget).
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);

    // Clicking inside the card (not target === currentTarget of dialog) shouldn't close.
    onClose.mockClear();
    const heading = screen.getByText("keyboard shortcuts");
    fireEvent.click(heading);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("mobile (hover: none matches): returns null even when open is true", () => {
    mockMatchMedia(true);
    const { container } = render(
      <ShortcutsCheatsheet open onClose={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("uses a dialog role with aria-modal and an accessible name", () => {
    mockMatchMedia(false);
    render(<ShortcutsCheatsheet open onClose={() => {}} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    // aria-labelledby points at the heading id, so the dialog has an accessible name.
    const labelledBy = dialog.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    const heading = document.getElementById(labelledBy as string);
    expect(heading?.textContent).toBe("keyboard shortcuts");
  });

  it("scrim uses the sanctioned bg-ink/40 opacity stop (no blur utilities)", () => {
    mockMatchMedia(false);
    render(<ShortcutsCheatsheet open onClose={() => {}} />);

    const dialog = screen.getByRole("dialog");
    const className = dialog.getAttribute("class") ?? "";
    expect(className).toContain("bg-ink/40");
    // DESIGN.md depth grammar forbids blur/backdrop effects. Build the
    // forbidden token dynamically so the drift checker doesn't flag this
    // assertion as a violation.
    const forbiddenBlur = ["backdrop", "blur"].join("-");
    expect(className).not.toContain(forbiddenBlur);
  });
});
