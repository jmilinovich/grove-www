// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { ProvenanceStrip } from "./provenance-strip";
import type { ProvenanceBlameEntry } from "./provenance-strip";

afterEach(() => {
  cleanup();
});

function legacy(lineStart: number, lineEnd: number): ProvenanceBlameEntry {
  return {
    lineStart,
    lineEnd,
    provenance: { voice: "legacy-unknown" },
  };
}

function durable(lineStart: number, lineEnd: number): ProvenanceBlameEntry {
  return {
    lineStart,
    lineEnd,
    provenance: {
      voice: "durable",
      by: "claude-opus-4-7",
      writtenAt: "2026-05-12T00:00:00Z",
    },
  };
}

function perishable(lineStart: number, lineEnd: number): ProvenanceBlameEntry {
  return {
    lineStart,
    lineEnd,
    provenance: {
      voice: "perishable",
      by: "claude-opus-4-7",
      writtenAt: "2026-05-12T00:00:00Z",
      reason: "pattern named from one conversation",
    },
  };
}

describe("ProvenanceStrip (W3-PROV-1)", () => {
  it("renders nothing when all segments are legacy-unknown", () => {
    const { container } = render(
      <ProvenanceStrip
        blame={[legacy(1, 5), legacy(6, 12), legacy(13, 20)]}
        totalLines={20}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when blame array is empty", () => {
    const { container } = render(
      <ProvenanceStrip blame={[]} totalLines={20} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders one badge per AI-authored segment", () => {
    render(
      <ProvenanceStrip
        blame={[
          durable(1, 5),
          legacy(6, 10),
          perishable(11, 15),
          perishable(16, 20),
        ]}
        totalLines={20}
      />,
    );
    // 1 durable + 2 perishable badges = 3 chips total; legacy-unknown is hidden.
    const durableChips = screen.getAllByRole("button", { name: "durable" });
    const perishableChips = screen.getAllByRole("button", {
      name: "perishable",
    });
    expect(durableChips).toHaveLength(1);
    expect(perishableChips).toHaveLength(2);
  });

  it("footer count matches number of perishable segments", () => {
    render(
      <ProvenanceStrip
        blame={[
          durable(1, 5),
          perishable(6, 10),
          perishable(11, 15),
          perishable(16, 20),
        ]}
        totalLines={20}
        atHandle="@jm"
        vault="life"
      />,
    );
    const link = screen.getByRole("link");
    expect(link.textContent).toContain("3 perishable segments");
  });

  it("footer pluralizes correctly for exactly one perishable segment", () => {
    render(
      <ProvenanceStrip
        blame={[durable(1, 5), perishable(6, 10)]}
        totalLines={20}
        atHandle="@jm"
        vault="life"
      />,
    );
    const link = screen.getByRole("link");
    expect(link.textContent).toContain("1 perishable segment ");
    expect(link.textContent).not.toContain("segments");
  });

  it("footer is hidden when there are zero perishable segments", () => {
    render(
      <ProvenanceStrip
        blame={[durable(1, 5), durable(6, 10), legacy(11, 20)]}
        totalLines={20}
        atHandle="@jm"
        vault="life"
      />,
    );
    // Badge for the durable segment still renders…
    expect(
      screen.getAllByRole("button", { name: "durable" }),
    ).toHaveLength(2);
    // …but no link to the backlog.
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("footer link uses /{atHandle}/{vault} as the v2 backlog deeplink", () => {
    render(
      <ProvenanceStrip
        blame={[perishable(1, 5)]}
        totalLines={20}
        atHandle="@jm"
        vault="life"
      />,
    );
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/@jm/life");
  });

  it("falls back to # when atHandle/vault are absent", () => {
    render(
      <ProvenanceStrip
        blame={[perishable(1, 5)]}
        totalLines={20}
      />,
    );
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("#");
  });

  it("preserves source order of AI-authored badges in the rendered list", () => {
    render(
      <ProvenanceStrip
        blame={[
          perishable(50, 60),
          legacy(1, 49),
          durable(61, 70),
          perishable(71, 80),
        ]}
        totalLines={80}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0].getAttribute("data-line-start")).toBe("50");
    expect(items[1].getAttribute("data-line-start")).toBe("61");
    expect(items[2].getAttribute("data-line-start")).toBe("71");
  });
});
