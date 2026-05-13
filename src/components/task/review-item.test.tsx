// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { ReviewItem } from "./review-item";
import type { Task } from "@/lib/grove-api.v2.types";

// next/link stub — ProvenanceBadge / ReviewItem don't render Links right
// now, but the mock is harmless and matches the convention in
// task-card.test.tsx so future Link imports don't need a test rewrite.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: { href: string; children: React.ReactNode } & Record<string, unknown>) =>
    React.createElement("a", { href, ...rest }, children),
}));

const SURFACE_TASK: Task = {
  id: "task-surface-1",
  skillId: "skill-perishable-audit",
  title: "mark perishable as durable? (12d old)",
  description: "Claim about Workspace org structure aged past 14 days.",
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
        "Perishable claim from 2026-05-01: \"Yulie reports to Karthik Narain since Oct 2025.\" Still accurate per public record. Worth promoting.",
    },
    provenance: {
      voice: "perishable",
      by: "claude-opus-4-7",
      writtenAt: "2026-05-13T15:00:30Z",
      source: "perishable-audit weekly",
    },
  },
  needsReviewReason: "perishable claim aged past 14-day threshold",
  sourceNotes: ["Resources/People/yulie-kwon-kim.md"],
};

const NOTE_CHANGE_TASK: Task = {
  id: "task-note-change-1",
  skillId: "skill-vault-health",
  title: "vault health check — fix broken wikilink",
  description: "Broken [[Stanley]] wikilink, repair to Resources/People/Stanley.md.",
  state: "review",
  scheduledFor: null,
  startedAt: "2026-05-10T13:00:00Z",
  completedAt: "2026-05-10T13:08:15Z",
  estimatedMinutes: 8,
  actualMinutes: 8,
  result: {
    artifact: {
      type: "note-change",
      notePath: "Resources/People/Stanley.md",
      surfaceText: "repair broken [[Stanley]] → Resources/People/Stanley.md",
    },
    provenance: {
      voice: "durable",
      by: "claude-opus-4-7",
      writtenAt: "2026-05-10T13:08:15Z",
    },
  },
  needsReviewReason: "broken wikilink, safe to repair",
};

const PERISHABLE_SKILL = {
  id: "skill-perishable-audit",
  slug: "perishable-audit",
  name: "Perishable Audit",
};

const VAULT_HEALTH_SKILL = {
  id: "skill-vault-health",
  slug: "vault-health",
  name: "Vault Health Check",
};

function makeHandlers() {
  return {
    onConfirmDurable: vi.fn(),
    onRefine: vi.fn(),
    onDismiss: vi.fn(),
    onMarkStale: vi.fn(),
  };
}

// happy-dom in this project doesn't ship localStorage out of the box
// (it's gated behind a CLI flag we don't pass). Define a minimal
// in-memory Storage shim on window so the production code path —
// `window.localStorage.getItem` / `setItem` — exercises real semantics.
// Reset between tests so the first-write ack flag doesn't bleed.
beforeEach(() => {
  if (typeof window === "undefined") return;
  const store = new Map<string, string>();
  const shim: Storage = {
    get length() {
      return store.size;
    },
    clear: () => {
      store.clear();
    },
    getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    writable: true,
    value: shim,
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ReviewItem — surface artifact", () => {
  it("renders the surface text in serif prose with source notes underneath", () => {
    render(
      <ReviewItem
        task={SURFACE_TASK}
        skill={PERISHABLE_SKILL}
        vaultSlug="main"
        {...makeHandlers()}
      />,
    );

    // Skill chip + title
    expect(screen.getByText("Perishable Audit")).toBeTruthy();
    expect(
      screen.getByText("mark perishable as durable? (12d old)"),
    ).toBeTruthy();

    // Surface text body
    const body = screen.getByTestId("surface-text");
    expect(body).toBeTruthy();
    expect(body.textContent).toContain("Yulie reports to Karthik Narain");
    // Lora family applied
    expect(body.className).toContain("font-serif");

    // Source notes rendered as inline wikilink-styled segments
    expect(screen.getByText(/yulie-kwon-kim\.md/)).toBeTruthy();
  });

  it("renders the provenance badge with the artifact's voice", () => {
    render(
      <ReviewItem
        task={SURFACE_TASK}
        skill={PERISHABLE_SKILL}
        vaultSlug="main"
        {...makeHandlers()}
      />,
    );
    // ProvenanceBadge for perishable voice renders the literal label
    // "perishable" on the chip button.
    expect(screen.getByRole("button", { name: "perishable" })).toBeTruthy();
  });

  it("renders all four action buttons with shortcut chips", () => {
    const { container } = render(
      <ReviewItem
        task={SURFACE_TASK}
        skill={PERISHABLE_SKILL}
        vaultSlug="main"
        {...makeHandlers()}
      />,
    );

    expect(screen.getByRole("button", { name: /confirm/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /refine/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /dismiss/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /stale/i })).toBeTruthy();

    const chipTexts = Array.from(container.querySelectorAll("kbd")).map(
      (c) => c.textContent,
    );
    // c/r/x/s footer chips (the provenance badge has no kbd).
    expect(chipTexts).toEqual(["c", "r", "x", "s"]);
  });
});

describe("ReviewItem — note-change artifact", () => {
  it("renders a side-by-side (md) / stacked (mobile) diff layout with the note path and fallback text", () => {
    const { container } = render(
      <ReviewItem
        task={NOTE_CHANGE_TASK}
        skill={VAULT_HEALTH_SKILL}
        vaultSlug="main"
        {...makeHandlers()}
      />,
    );

    const split = container.querySelector('[data-testid="note-change-split"]');
    expect(split).toBeTruthy();
    // Responsive grammar locked in
    expect(split?.className).toContain("flex-col");
    expect(split?.className).toContain("md:flex-row");

    const beforePane = screen.getByTestId("note-change-before");
    expect(beforePane.textContent).toContain("Resources/People/Stanley.md");

    const afterPane = screen.getByTestId("note-change-after");
    // diff is undefined in mock; falls back to artifact.surfaceText
    expect(afterPane.textContent).toContain(
      "repair broken [[Stanley]] → Resources/People/Stanley.md",
    );
  });
});

describe("ReviewItem — refine modal", () => {
  it("clicking refine opens a modal with a textarea (not inline)", () => {
    render(
      <ReviewItem
        task={SURFACE_TASK}
        skill={PERISHABLE_SKILL}
        vaultSlug="main"
        {...makeHandlers()}
      />,
    );

    // No modal until refine is clicked
    expect(screen.queryByTestId("refine-modal")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /refine/i }));

    const modal = screen.getByTestId("refine-modal");
    expect(modal).toBeTruthy();
    expect(modal.getAttribute("role")).toBe("dialog");
    expect(screen.getByTestId("refine-textarea")).toBeTruthy();
  });

  it("Submit fires onRefine with the trimmed text and closes the modal", () => {
    const handlers = makeHandlers();
    render(
      <ReviewItem
        task={SURFACE_TASK}
        skill={PERISHABLE_SKILL}
        vaultSlug="main"
        {...handlers}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /refine/i }));
    const textarea = screen.getByTestId("refine-textarea") as HTMLTextAreaElement;
    fireEvent.change(textarea, {
      target: { value: "  rephrase as durable; drop the hedge  " },
    });

    fireEvent.click(screen.getByTestId("refine-submit"));

    expect(handlers.onRefine).toHaveBeenCalledTimes(1);
    expect(handlers.onRefine).toHaveBeenCalledWith(
      "rephrase as durable; drop the hedge",
    );
    // Modal closes
    expect(screen.queryByTestId("refine-modal")).toBeNull();
  });

  it("Cancel closes the modal without calling onRefine", () => {
    const handlers = makeHandlers();
    render(
      <ReviewItem
        task={SURFACE_TASK}
        skill={PERISHABLE_SKILL}
        vaultSlug="main"
        {...handlers}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /refine/i }));
    expect(screen.getByTestId("refine-modal")).toBeTruthy();

    fireEvent.click(screen.getByTestId("refine-cancel"));
    expect(handlers.onRefine).not.toHaveBeenCalled();
    expect(screen.queryByTestId("refine-modal")).toBeNull();
  });

  it("Submit with empty text does not fire onRefine", () => {
    const handlers = makeHandlers();
    render(
      <ReviewItem
        task={SURFACE_TASK}
        skill={PERISHABLE_SKILL}
        vaultSlug="main"
        {...handlers}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /refine/i }));
    fireEvent.click(screen.getByTestId("refine-submit"));

    expect(handlers.onRefine).not.toHaveBeenCalled();
    // Modal stays open
    expect(screen.getByTestId("refine-modal")).toBeTruthy();
  });
});

describe("ReviewItem — confirm-durable on surface artifact", () => {
  it("fires onConfirmDurable immediately (no first-write modal for surface)", () => {
    const handlers = makeHandlers();
    render(
      <ReviewItem
        task={SURFACE_TASK}
        skill={PERISHABLE_SKILL}
        vaultSlug="main"
        {...handlers}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(handlers.onConfirmDurable).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("first-write-modal")).toBeNull();
  });
});

describe("ReviewItem — first-write confirmation for write artifacts", () => {
  it("first confirm on a note-change artifact opens the first-write modal", () => {
    const handlers = makeHandlers();
    render(
      <ReviewItem
        task={NOTE_CHANGE_TASK}
        skill={VAULT_HEALTH_SKILL}
        vaultSlug="main"
        {...handlers}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

    // Modal shown; underlying confirm NOT fired yet
    expect(screen.getByTestId("first-write-modal")).toBeTruthy();
    expect(handlers.onConfirmDurable).not.toHaveBeenCalled();
  });

  it("clicking continue in the first-write modal fires onConfirmDurable and persists the flag", () => {
    const handlers = makeHandlers();
    render(
      <ReviewItem
        task={NOTE_CHANGE_TASK}
        skill={VAULT_HEALTH_SKILL}
        vaultSlug="main"
        {...handlers}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    fireEvent.click(screen.getByTestId("first-write-confirm"));

    expect(handlers.onConfirmDurable).toHaveBeenCalledTimes(1);
    // Modal closed
    expect(screen.queryByTestId("first-write-modal")).toBeNull();
    // Flag persisted
    expect(
      window.localStorage.getItem(
        "grove.first-write-ack.main.skill-vault-health",
      ),
    ).toBe("1");
  });

  it("clicking cancel in the first-write modal does NOT fire onConfirmDurable and does NOT set the flag", () => {
    const handlers = makeHandlers();
    render(
      <ReviewItem
        task={NOTE_CHANGE_TASK}
        skill={VAULT_HEALTH_SKILL}
        vaultSlug="main"
        {...handlers}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    fireEvent.click(screen.getByTestId("first-write-cancel"));

    expect(handlers.onConfirmDurable).not.toHaveBeenCalled();
    expect(screen.queryByTestId("first-write-modal")).toBeNull();
    expect(
      window.localStorage.getItem(
        "grove.first-write-ack.main.skill-vault-health",
      ),
    ).toBeNull();
  });

  it("once the flag is set, subsequent confirms skip the modal and fire onConfirmDurable directly", () => {
    // Pre-set the ack flag for (main, skill-vault-health).
    window.localStorage.setItem(
      "grove.first-write-ack.main.skill-vault-health",
      "1",
    );

    const handlers = makeHandlers();
    render(
      <ReviewItem
        task={NOTE_CHANGE_TASK}
        skill={VAULT_HEALTH_SKILL}
        vaultSlug="main"
        {...handlers}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(handlers.onConfirmDurable).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("first-write-modal")).toBeNull();
  });

  it("the flag is scoped per (vault, skill): a different vault still prompts", () => {
    // Ack only for "main" — the user opens the same skill in "personal".
    window.localStorage.setItem(
      "grove.first-write-ack.main.skill-vault-health",
      "1",
    );

    const handlers = makeHandlers();
    render(
      <ReviewItem
        task={NOTE_CHANGE_TASK}
        skill={VAULT_HEALTH_SKILL}
        vaultSlug="personal"
        {...handlers}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(handlers.onConfirmDurable).not.toHaveBeenCalled();
    expect(screen.getByTestId("first-write-modal")).toBeTruthy();
  });

  it("the flag is scoped per (vault, skill): a different skill in the same vault still prompts", () => {
    // Ack vault-health in main — now a *different* write skill confirms.
    window.localStorage.setItem(
      "grove.first-write-ack.main.skill-vault-health",
      "1",
    );

    const OTHER_TASK: Task = {
      ...NOTE_CHANGE_TASK,
      skillId: "skill-concept-graph-cleanup",
    };
    const OTHER_SKILL = {
      id: "skill-concept-graph-cleanup",
      slug: "concept-graph-cleanup",
      name: "Concept Graph Cleanup",
    };

    const handlers = makeHandlers();
    render(
      <ReviewItem
        task={OTHER_TASK}
        skill={OTHER_SKILL}
        vaultSlug="main"
        {...handlers}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(handlers.onConfirmDurable).not.toHaveBeenCalled();
    expect(screen.getByTestId("first-write-modal")).toBeTruthy();
  });
});

describe("ReviewItem — dismiss and mark-stale", () => {
  it("clicking dismiss fires onDismiss", () => {
    const handlers = makeHandlers();
    render(
      <ReviewItem
        task={SURFACE_TASK}
        skill={PERISHABLE_SKILL}
        vaultSlug="main"
        {...handlers}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(handlers.onDismiss).toHaveBeenCalledTimes(1);
  });

  it("clicking stale fires onMarkStale", () => {
    const handlers = makeHandlers();
    render(
      <ReviewItem
        task={SURFACE_TASK}
        skill={PERISHABLE_SKILL}
        vaultSlug="main"
        {...handlers}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /stale/i }));
    expect(handlers.onMarkStale).toHaveBeenCalledTimes(1);
  });
});
