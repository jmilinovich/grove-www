// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

// `next/cache` cacheTag() throws outside Next.js's request runtime
// unless `cacheComponents` is wired up via next.config — which vitest
// doesn't load. Stubbing it here is the standard pattern in this repo
// (see `_actions/tasks.test.ts`) and matches what we mock for the
// updateTag side of the same cache-tag contract.
vi.mock("next/cache", () => ({
  cacheTag: vi.fn(),
  updateTag: vi.fn(),
}));

// W2-PAGE-1: the page is now an async server component that composes
// the cached `fetchBacklog` payload through <CapacityStrip /> + the
// <BacklogIsland /> client subtree. The tests below exercise the
// server-render contract: that the right primitives end up in the tree
// against the mock fixture, that the resolved data flows through to
// rendered text, and that the cache directive on fetchBacklog doesn't
// break the unwrap.
//
// `_client-shell.tsx` is `'use client'` and pulls in client-only hooks
// (useBacklogPolling, useKeyboardShortcuts) + the Server Actions. We
// stub the default export and the BacklogIsland named export — both
// live in that module — so the server-component test stays focused on
// what the PAGE owns: the composition, not the keymap or polling
// wiring (covered by W1-LIB-1 / W1-KBD-1 / W2-LIST-* unit tests).
vi.mock("./_client-shell", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="client-shell">{children}</div>
  ),
  BacklogIsland: ({
    data,
    vaultSlug,
  }: {
    data: { pendingTasks: Array<{ id: string; title: string }> };
    vaultSlug: string;
  }) => (
    <div data-testid="backlog-island" data-vault-slug={vaultSlug}>
      {data.pendingTasks.map((t) => (
        <span key={t.id} data-testid="pending-title">
          {t.title}
        </span>
      ))}
    </div>
  ),
}));

// CapacityStrip is a client component (uses useState/useId). We render
// a minimal stub that surfaces the lead text so we can assert against
// the mock-fixture's throughput string without firing all the
// disclosure/keyboard machinery in this test.
vi.mock("@/components/primitives/capacity-strip", () => ({
  CapacityStrip: ({
    throughput,
    planTier,
  }: {
    throughput: {
      estimatedClearText: string;
      cleared7d: number;
      pending: number;
    };
    planTier: string;
  }) => (
    <div data-testid="capacity-strip" data-plan-tier={planTier}>
      <span data-testid="capacity-lead">{throughput.estimatedClearText}</span>
      <span data-testid="capacity-cleared">{throughput.cleared7d}</span>
      <span data-testid="capacity-pending">{throughput.pending}</span>
    </div>
  ),
}));

beforeEach(() => {
  // Ensure mock mode regardless of host env; the test must not depend
  // on whether GROVE_API_MODE is set in the shell.
  delete process.env.GROVE_API_MODE;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("VaultHomepage (W2-PAGE-1 composition)", () => {
  it("renders without error against mock backlog data", async () => {
    const { default: VaultHomepage } = await import("./page");
    const element = await VaultHomepage({
      params: Promise.resolve({ atHandle: "jm", vaultSlug: "personal" }),
    });
    expect(() => render(element)).not.toThrow();
  });

  it("wraps everything in the client-shell boundary", async () => {
    const { default: VaultHomepage } = await import("./page");
    const element = await VaultHomepage({
      params: Promise.resolve({ atHandle: "jm", vaultSlug: "personal" }),
    });
    render(element);
    const shell = screen.getByTestId("client-shell");
    expect(shell).toBeTruthy();
    // Both the capacity strip and the backlog island must live INSIDE
    // the client-shell — that's where polling + global keymap mount.
    expect(shell.querySelector('[data-testid="capacity-strip"]')).toBeTruthy();
    expect(shell.querySelector('[data-testid="backlog-island"]')).toBeTruthy();
  });

  it("renders the CapacityStrip with the mock throughput payload", async () => {
    const { default: VaultHomepage } = await import("./page");
    const element = await VaultHomepage({
      params: Promise.resolve({ atHandle: "jm", vaultSlug: "personal" }),
    });
    render(element);
    const strip = screen.getByTestId("capacity-strip");
    expect(strip).toBeTruthy();
    // Mock fixture: planTier = "free", cleared7d derived from mock store.
    expect(strip.getAttribute("data-plan-tier")).toBe("free");
    // estimatedClearText is mock-derived; we just assert it landed as
    // a non-empty string (mock returns "≈… weeks at your pace" or
    // "under a week at your pace" / "warming up").
    const lead = screen.getByTestId("capacity-lead").textContent ?? "";
    expect(lead.length).toBeGreaterThan(0);
  });

  it("includes the estimated-clear-text from the mock throughput view", async () => {
    const { default: VaultHomepage } = await import("./page");
    const element = await VaultHomepage({
      params: Promise.resolve({ atHandle: "jm", vaultSlug: "personal" }),
    });
    render(element);
    // The mock throughput compute returns one of three forms; matching
    // on the trailing phrase "at your pace" or the warmup phrase keeps
    // the test robust to fixture-count changes.
    const lead = screen.getByTestId("capacity-lead").textContent ?? "";
    expect(/at your pace|warming up/.test(lead)).toBe(true);
  });

  it("passes the vaultSlug down to the BacklogIsland", async () => {
    const { default: VaultHomepage } = await import("./page");
    const element = await VaultHomepage({
      params: Promise.resolve({ atHandle: "jm", vaultSlug: "personal" }),
    });
    render(element);
    const island = screen.getByTestId("backlog-island");
    expect(island.getAttribute("data-vault-slug")).toBe("personal");
  });

  it("surfaces at least one pending task title from the mock fixture", async () => {
    const { default: VaultHomepage } = await import("./page");
    const element = await VaultHomepage({
      params: Promise.resolve({ atHandle: "jm", vaultSlug: "personal" }),
    });
    render(element);
    // The mock fixture (task-101) seeds "weekly journal patterns" as
    // a pending task. Asserting on a known fixture title proves the
    // data round-trip from fetchBacklog → page → island actually
    // pipes content into the rendered tree.
    const titles = screen.getAllByTestId("pending-title").map((n) => n.textContent ?? "");
    expect(titles.length).toBeGreaterThan(0);
    expect(titles).toContain("weekly journal patterns");
  });
});
