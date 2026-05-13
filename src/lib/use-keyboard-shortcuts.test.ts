// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import React from "react";
import { useKeyboardShortcuts, type ShortcutBinding } from "./use-keyboard-shortcuts";

// Helper: a tiny component that registers a set of bindings while mounted.
function ShortcutMount({ bindings }: { bindings: ShortcutBinding[] }) {
  useKeyboardShortcuts(bindings);
  return React.createElement("div", { "data-testid": "mount" });
}

function setPlatform(platform: string): void {
  Object.defineProperty(navigator, "platform", {
    value: platform,
    configurable: true,
  });
}

function dispatchKey(
  init: KeyboardEventInit & { target?: EventTarget | null } = {},
): KeyboardEvent {
  const { target, ...rest } = init;
  const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...rest });
  if (target) {
    target.dispatchEvent(event);
  } else {
    window.dispatchEvent(event);
  }
  return event;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("useKeyboardShortcuts", () => {
  describe("single key", () => {
    it("fires handler when the matching key is pressed", () => {
      const handler = vi.fn();
      render(
        React.createElement(ShortcutMount, {
          bindings: [{ key: "r", description: "run", handler }],
        }),
      );
      dispatchKey({ key: "r" });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("does not fire when a different key is pressed", () => {
      const handler = vi.fn();
      render(
        React.createElement(ShortcutMount, {
          bindings: [{ key: "r", description: "run", handler }],
        }),
      );
      dispatchKey({ key: "x" });
      expect(handler).not.toHaveBeenCalled();
    });

    it("does not preventDefault for plain keys by default", () => {
      const handler = vi.fn();
      render(
        React.createElement(ShortcutMount, {
          bindings: [{ key: "r", description: "run", handler }],
        }),
      );
      const event = dispatchKey({ key: "r" });
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe("modifier chord", () => {
    beforeEach(() => {
      setPlatform("MacIntel");
    });

    it("fires `⌘k` on metaKey when on Mac and calls preventDefault", () => {
      const handler = vi.fn();
      render(
        React.createElement(ShortcutMount, {
          bindings: [{ key: "⌘k", description: "palette", handler }],
        }),
      );
      const event = dispatchKey({ key: "k", metaKey: true });
      expect(handler).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });

    it("does NOT fire `⌘k` on plain k (no meta) on Mac", () => {
      const handler = vi.fn();
      render(
        React.createElement(ShortcutMount, {
          bindings: [{ key: "⌘k", description: "palette", handler }],
        }),
      );
      dispatchKey({ key: "k" });
      expect(handler).not.toHaveBeenCalled();
    });

    it("does NOT fire `⌘k` on ctrl+k when on Mac", () => {
      const handler = vi.fn();
      render(
        React.createElement(ShortcutMount, {
          bindings: [{ key: "⌘k", description: "palette", handler }],
        }),
      );
      dispatchKey({ key: "k", ctrlKey: true });
      expect(handler).not.toHaveBeenCalled();
    });

    it("fires `⌘k` on ctrlKey when NOT on Mac", () => {
      setPlatform("Win32");
      const handler = vi.fn();
      render(
        React.createElement(ShortcutMount, {
          bindings: [{ key: "⌘k", description: "palette", handler }],
        }),
      );
      const event = dispatchKey({ key: "k", ctrlKey: true });
      expect(handler).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });

    it("does NOT fire `⌘k` on metaKey when NOT on Mac", () => {
      setPlatform("Linux x86_64");
      const handler = vi.fn();
      render(
        React.createElement(ShortcutMount, {
          bindings: [{ key: "⌘k", description: "palette", handler }],
        }),
      );
      dispatchKey({ key: "k", metaKey: true });
      expect(handler).not.toHaveBeenCalled();
    });

    it("respects explicit preventDefault: false on a chord", () => {
      const handler = vi.fn();
      render(
        React.createElement(ShortcutMount, {
          bindings: [
            { key: "⌘k", description: "palette", handler, preventDefault: false },
          ],
        }),
      );
      const event = dispatchKey({ key: "k", metaKey: true });
      expect(handler).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(false);
    });

    it("supports Shift+Tab chord", () => {
      const handler = vi.fn();
      render(
        React.createElement(ShortcutMount, {
          bindings: [{ key: "Shift+Tab", description: "back", handler }],
        }),
      );
      dispatchKey({ key: "Tab", shiftKey: true });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("does NOT fire Shift+Tab on plain Tab", () => {
      const handler = vi.fn();
      render(
        React.createElement(ShortcutMount, {
          bindings: [{ key: "Shift+Tab", description: "back", handler }],
        }),
      );
      dispatchKey({ key: "Tab" });
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("focus gating", () => {
    it("blocks firing when focus is inside <input>", () => {
      const handler = vi.fn();
      render(
        React.createElement(ShortcutMount, {
          bindings: [{ key: "r", description: "run", handler }],
        }),
      );
      const input = document.createElement("input");
      document.body.appendChild(input);
      input.focus();
      dispatchKey({ key: "r", target: input });
      expect(handler).not.toHaveBeenCalled();
      input.remove();
    });

    it("blocks firing when focus is inside <textarea>", () => {
      const handler = vi.fn();
      render(
        React.createElement(ShortcutMount, {
          bindings: [{ key: "r", description: "run", handler }],
        }),
      );
      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);
      textarea.focus();
      dispatchKey({ key: "r", target: textarea });
      expect(handler).not.toHaveBeenCalled();
      textarea.remove();
    });

    it("blocks firing when focus is inside [contenteditable]", () => {
      const handler = vi.fn();
      render(
        React.createElement(ShortcutMount, {
          bindings: [{ key: "r", description: "run", handler }],
        }),
      );
      const ce = document.createElement("div");
      ce.contentEditable = "true";
      document.body.appendChild(ce);
      ce.focus();
      dispatchKey({ key: "r", target: ce });
      expect(handler).not.toHaveBeenCalled();
      ce.remove();
    });
  });

  describe("when() predicate", () => {
    it("blocks firing when when() returns false", () => {
      const handler = vi.fn();
      render(
        React.createElement(ShortcutMount, {
          bindings: [
            { key: "r", description: "run", handler, when: () => false },
          ],
        }),
      );
      dispatchKey({ key: "r" });
      expect(handler).not.toHaveBeenCalled();
    });

    it("allows firing when when() returns true", () => {
      const handler = vi.fn();
      render(
        React.createElement(ShortcutMount, {
          bindings: [
            { key: "r", description: "run", handler, when: () => true },
          ],
        }),
      );
      dispatchKey({ key: "r" });
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("collision resolution", () => {
    it("first-mounted wins when two components register the same key", () => {
      const first = vi.fn();
      const second = vi.fn();
      render(
        React.createElement(
          React.Fragment,
          null,
          React.createElement(ShortcutMount, {
            bindings: [{ key: "r", description: "first", handler: first }],
          }),
          React.createElement(ShortcutMount, {
            bindings: [{ key: "r", description: "second", handler: second }],
          }),
        ),
      );
      dispatchKey({ key: "r" });
      expect(first).toHaveBeenCalledTimes(1);
      expect(second).not.toHaveBeenCalled();
    });
  });

  describe("lifecycle", () => {
    it("removes the listener on unmount (no leak)", () => {
      const handler = vi.fn();
      const { unmount } = render(
        React.createElement(ShortcutMount, {
          bindings: [{ key: "r", description: "run", handler }],
        }),
      );
      dispatchKey({ key: "r" });
      expect(handler).toHaveBeenCalledTimes(1);
      unmount();
      dispatchKey({ key: "r" });
      // Still only the one pre-unmount call.
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("after first unmounts, second wins the key", () => {
      const first = vi.fn();
      const second = vi.fn();
      const { rerender } = render(
        React.createElement(
          React.Fragment,
          null,
          React.createElement(ShortcutMount, {
            bindings: [{ key: "r", description: "first", handler: first }],
          }),
          React.createElement(ShortcutMount, {
            bindings: [{ key: "r", description: "second", handler: second }],
          }),
        ),
      );
      dispatchKey({ key: "r" });
      expect(first).toHaveBeenCalledTimes(1);
      expect(second).not.toHaveBeenCalled();

      // Remove the first mount; the second should now win.
      rerender(
        React.createElement(
          React.Fragment,
          null,
          React.createElement(ShortcutMount, {
            bindings: [{ key: "r", description: "second", handler: second }],
          }),
        ),
      );
      dispatchKey({ key: "r" });
      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(1);
    });
  });
});
