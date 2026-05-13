// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

// `_client-shell.tsx` is `'use client'` and pulls in client-only hooks.
// We stub it to keep this server-component test focused on what
// W1-ROUTE-1 owns: that the page renders the placeholder card and
// hands its children to a client-shell boundary. The client-shell's
// hook wiring is exercised by the W1-LIB-1 + W1-KBD-1 unit tests.
vi.mock("./_client-shell", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="client-shell">{children}</div>
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("VaultHomepage (W1-ROUTE-1 scaffold)", () => {
  it("renders without error for valid params", async () => {
    const { default: VaultHomepage } = await import("./page");
    const element = await VaultHomepage({
      params: Promise.resolve({ atHandle: "jm", vaultSlug: "personal" }),
    });
    expect(() => render(element)).not.toThrow();
  });

  it("renders the v2 placeholder text", async () => {
    const { default: VaultHomepage } = await import("./page");
    const element = await VaultHomepage({
      params: Promise.resolve({ atHandle: "jm", vaultSlug: "personal" }),
    });
    render(element);
    expect(
      screen.getByText(/v2 dashboard — under construction/i),
    ).toBeTruthy();
  });

  it("wraps the placeholder in the client-shell boundary", async () => {
    const { default: VaultHomepage } = await import("./page");
    const element = await VaultHomepage({
      params: Promise.resolve({ atHandle: "jm", vaultSlug: "personal" }),
    });
    render(element);
    const shell = screen.getByTestId("client-shell");
    expect(shell).toBeTruthy();
    // Placeholder must live INSIDE the client-shell, not as a sibling —
    // that's the whole point of the boundary in W1.
    expect(
      shell.textContent?.includes("v2 dashboard — under construction"),
    ).toBe(true);
  });

  it("shows the resolved vault slug", async () => {
    const { default: VaultHomepage } = await import("./page");
    const element = await VaultHomepage({
      params: Promise.resolve({ atHandle: "jm", vaultSlug: "personal" }),
    });
    render(element);
    expect(screen.getByText(/Vault · personal/i)).toBeTruthy();
  });
});
