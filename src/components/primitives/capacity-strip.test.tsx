// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { CapacityStrip } from "./capacity-strip";
import type { ThroughputView } from "@/lib/grove-api.v2.types";

function makeThroughput(overrides: Partial<ThroughputView> = {}): ThroughputView {
  return {
    rollingWeekVelocity: 5,
    cleared7d: 23,
    pending: 41,
    estimatedClearText: "≈2 weeks at your pace",
    planCeiling: 30,
    showCeiling: true,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe("CapacityStrip — warming-up state", () => {
  it("renders 'warming up — N cleared so far' when rollingWeekVelocity is null", () => {
    render(
      <CapacityStrip
        throughput={makeThroughput({
          rollingWeekVelocity: null,
          cleared7d: 7,
          estimatedClearText: "this should be ignored",
        })}
        planTier="free"
      />,
    );
    expect(screen.getByText(/warming up — 7 cleared so far/)).toBeTruthy();
  });

  it("hides projection and upgrade CTA while warming up, even on free over ceiling", () => {
    render(
      <CapacityStrip
        throughput={makeThroughput({
          rollingWeekVelocity: null,
          cleared7d: 7,
          pending: 99,
          planCeiling: 30,
          showCeiling: true,
        })}
        planTier="free"
      />,
    );
    // Expand
    fireEvent.click(screen.getByRole("button"));
    // No /week pace text in the panel
    expect(screen.queryByText(/week pace/)).toBeNull();
    // No upgrade CTA
    expect(screen.queryByText(/upgrade to pro/i)).toBeNull();
  });
});

describe("CapacityStrip — projection state", () => {
  it("renders estimatedClearText as lead when rollingWeekVelocity is set", () => {
    render(
      <CapacityStrip
        throughput={makeThroughput({
          rollingWeekVelocity: 5,
          estimatedClearText: "≈2 weeks at your pace",
          showCeiling: true,
        })}
        planTier="free"
      />,
    );
    expect(screen.getByText("≈2 weeks at your pace")).toBeTruthy();
  });

  it("shows cleared7d / pending / pace in expanded panel", () => {
    render(
      <CapacityStrip
        throughput={makeThroughput({
          rollingWeekVelocity: 5,
          cleared7d: 23,
          pending: 41,
        })}
        planTier="pro"
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText(/23 cleared this week/)).toBeTruthy();
    expect(screen.getByText(/41 pending/)).toBeTruthy();
    expect(screen.getByText(/week pace/)).toBeTruthy();
    expect(screen.getByText(/week pace/).textContent).toContain("5");
  });
});

describe("CapacityStrip — upgrade CTA visibility", () => {
  it("shows the CTA when free + showCeiling + pending > planCeiling", () => {
    render(
      <CapacityStrip
        throughput={makeThroughput({
          rollingWeekVelocity: 5,
          pending: 41,
          planCeiling: 30,
          showCeiling: true,
        })}
        planTier="free"
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText(/upgrade to pro/i)).toBeTruthy();
  });

  it("hides the CTA on the pro tier even when over ceiling", () => {
    render(
      <CapacityStrip
        throughput={makeThroughput({
          rollingWeekVelocity: 5,
          pending: 41,
          planCeiling: 30,
          showCeiling: true,
        })}
        planTier="pro"
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByText(/upgrade to pro/i)).toBeNull();
  });

  it("hides the CTA when showCeiling is false (free, under cap)", () => {
    render(
      <CapacityStrip
        throughput={makeThroughput({
          rollingWeekVelocity: 5,
          pending: 41,
          planCeiling: 30,
          showCeiling: false,
        })}
        planTier="free"
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByText(/upgrade to pro/i)).toBeNull();
  });

  it("hides the CTA when pending <= planCeiling", () => {
    render(
      <CapacityStrip
        throughput={makeThroughput({
          rollingWeekVelocity: 5,
          pending: 30,
          planCeiling: 30,
          showCeiling: true,
        })}
        planTier="free"
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByText(/upgrade to pro/i)).toBeNull();
  });
});

describe("CapacityStrip — keyboard interaction", () => {
  it("Enter on the chip toggles expanded", () => {
    render(
      <CapacityStrip throughput={makeThroughput()} planTier="free" />,
    );
    const chip = screen.getByRole("button");
    expect(chip.getAttribute("aria-expanded")).toBe("false");

    fireEvent.keyDown(chip, { key: "Enter" });
    expect(chip.getAttribute("aria-expanded")).toBe("true");

    fireEvent.keyDown(chip, { key: "Enter" });
    expect(chip.getAttribute("aria-expanded")).toBe("false");
  });

  it("Space on the chip toggles expanded", () => {
    render(
      <CapacityStrip throughput={makeThroughput()} planTier="free" />,
    );
    const chip = screen.getByRole("button");
    fireEvent.keyDown(chip, { key: " " });
    expect(chip.getAttribute("aria-expanded")).toBe("true");
  });

  it("Esc on the chip collapses and returns focus to chip", () => {
    render(
      <CapacityStrip throughput={makeThroughput()} planTier="free" />,
    );
    const chip = screen.getByRole("button") as HTMLButtonElement;
    chip.focus();
    fireEvent.keyDown(chip, { key: "Enter" });
    expect(chip.getAttribute("aria-expanded")).toBe("true");

    fireEvent.keyDown(chip, { key: "Escape" });
    expect(chip.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(chip);
  });

  it("Esc inside the expanded panel collapses and returns focus to chip", () => {
    render(
      <CapacityStrip throughput={makeThroughput()} planTier="free" />,
    );
    const chip = screen.getByRole("button") as HTMLButtonElement;
    fireEvent.click(chip);
    const panel = screen.getByRole("region");
    fireEvent.keyDown(panel, { key: "Escape" });
    expect(chip.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(chip);
  });
});

describe("CapacityStrip — aria wiring", () => {
  it("aria-controls on the chip matches the panel id when expanded", () => {
    render(
      <CapacityStrip throughput={makeThroughput()} planTier="free" />,
    );
    const chip = screen.getByRole("button");
    fireEvent.click(chip);
    const panel = screen.getByRole("region");
    expect(chip.getAttribute("aria-controls")).toBe(panel.getAttribute("id"));
  });
});
