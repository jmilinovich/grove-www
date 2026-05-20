// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { ReviewItem } from "./review-item";
import type { ReviewOption, Task } from "@/lib/grove-api.v2.types";

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

const SURFACE_OPTIONS: ReviewOption[] = [
  { id: "opt-1", label: "confirm durable", source: "schema" },
  { id: "opt-2", label: "mark stale", source: "schema" },
];

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
  itemType: "enrichment",
  options: SURFACE_OPTIONS,
};

const NOTE_CHANGE_OPTIONS: ReviewOption[] = [
  { id: "opt-1", label: "apply repair", source: "schema" },
  { id: "opt-2", label: "skip", source: "schema" },
];

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
  itemType: "enrichment",
  options: NOTE_CHANGE_OPTIONS,
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
    onApplyOption: vi.fn(),
    onRefine: vi.fn(),
    onDismiss: vi.fn(),
  };
}

const DECISION_OPTIONS: ReviewOption[] = [
  { id: "opt-1", label: "link to Anna Chen", source: "schema" },
  { id: "opt-2", label: "link to Anna Kim", source: "schema" },
  { id: "opt-3", label: "do not link", source: "schema" },
];

const DECISION_TASK: Task = {
  id: "task-decision-1",
  skillId: "skill-concept-graph-cleanup",
  title: "disambiguate Anna in Journal/2026-05-19.md",
  description: "ambiguous reference",
  state: "review",
  scheduledFor: null,
  startedAt: "2026-05-19T18:00:00Z",
  completedAt: "2026-05-19T18:00:12Z",
  estimatedMinutes: 1,
  actualMinutes: 1,
  result: null,
  needsReviewReason: "ambiguous reference; LLM cannot pick without context",
  sourceNotes: ["Journal/2026-05-19.md"],
  itemType: "disambiguation",
  options: DECISION_OPTIONS,
};

const CLEANUP_SKILL = {
  id: "skill-concept-graph-cleanup",
  slug: "concept-graph-cleanup",
  name: "Concept Graph Cleanup",
};

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

  it("renders the dynamic action footer (no legacy four-button row)", () => {
    const { container } = render(
      <ReviewItem
        task={SURFACE_TASK}
        skill={PERISHABLE_SKILL}
        vaultSlug="main"
        {...makeHandlers()}
      />,
    );

    expect(
      container.querySelector("[data-testid='review-actions-dynamic']"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-testid='review-actions-legacy']"),
    ).toBeNull();
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

    fireEvent.click(screen.getByTestId("review-ghost-refine"));

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

    fireEvent.click(screen.getByTestId("review-ghost-refine"));
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

    fireEvent.click(screen.getByTestId("review-ghost-refine"));
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

    fireEvent.click(screen.getByTestId("review-ghost-refine"));
    fireEvent.click(screen.getByTestId("refine-submit"));

    expect(handlers.onRefine).not.toHaveBeenCalled();
    // Modal stays open
    expect(screen.getByTestId("refine-modal")).toBeTruthy();
  });
});

describe("ReviewItem — dynamic options (post-C-INBOX-1 default)", () => {
  it("renders N option buttons + refine + dismiss for a decision-backed task", () => {
    const { container } = render(
      <ReviewItem
        task={DECISION_TASK}
        skill={CLEANUP_SKILL}
        vaultSlug="main"
        {...makeHandlers()}
      />,
    );

    const dynamicFooter = container.querySelector(
      "[data-testid='review-actions-dynamic']",
    );
    expect(dynamicFooter).toBeTruthy();
    expect(
      container.querySelector("[data-testid='review-actions-legacy']"),
    ).toBeNull();

    const optionButtons = container.querySelectorAll(
      "[data-testid^='review-option-']",
    );
    expect(optionButtons.length).toBe(3);
    expect(optionButtons[0].textContent).toContain("link to Anna Chen");
    expect(optionButtons[1].textContent).toContain("link to Anna Kim");
    expect(optionButtons[2].textContent).toContain("do not link");

    expect(
      container.querySelector("[data-testid='review-ghost-refine']"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-testid='review-ghost-dismiss']"),
    ).toBeTruthy();
  });

  it("clicking an option button fires onApplyOption with the option id", () => {
    const handlers = makeHandlers();
    const { container } = render(
      <ReviewItem
        task={DECISION_TASK}
        skill={CLEANUP_SKILL}
        vaultSlug="main"
        {...handlers}
      />,
    );

    const second = container.querySelector(
      "[data-testid='review-option-opt-2']",
    ) as HTMLButtonElement;
    fireEvent.click(second);

    expect(handlers.onApplyOption).toHaveBeenCalledTimes(1);
    expect(handlers.onApplyOption).toHaveBeenCalledWith("opt-2");
  });

  it("clicking the dismiss ghost button fires onDismiss directly", () => {
    const handlers = makeHandlers();
    const { container } = render(
      <ReviewItem
        task={DECISION_TASK}
        skill={CLEANUP_SKILL}
        vaultSlug="main"
        {...handlers}
      />,
    );

    fireEvent.click(
      container.querySelector(
        "[data-testid='review-ghost-dismiss']",
      ) as HTMLButtonElement,
    );

    expect(handlers.onDismiss).toHaveBeenCalledTimes(1);
  });

  it("clicking the refine ghost button opens the modal; submitting fires onRefine with trimmed text", () => {
    const handlers = makeHandlers();
    const { container } = render(
      <ReviewItem
        task={DECISION_TASK}
        skill={CLEANUP_SKILL}
        vaultSlug="main"
        {...handlers}
      />,
    );

    fireEvent.click(
      container.querySelector(
        "[data-testid='review-ghost-refine']",
      ) as HTMLButtonElement,
    );

    const modal = screen.getByTestId("refine-modal");
    expect(modal).toBeTruthy();

    const textarea = screen.getByTestId("refine-textarea") as HTMLTextAreaElement;
    fireEvent.change(textarea, {
      target: { value: "  actually merge into Anna Kim  " },
    });
    fireEvent.click(screen.getByTestId("refine-submit"));

    expect(handlers.onRefine).toHaveBeenCalledTimes(1);
    expect(handlers.onRefine).toHaveBeenCalledWith(
      "actually merge into Anna Kim",
    );
    expect(screen.queryByTestId("refine-modal")).toBeNull();
  });
});
