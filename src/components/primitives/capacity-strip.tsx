"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown, ChevronUp, Leaf } from "lucide-react";
import type { ThroughputView } from "@/lib/grove-api.v2.types";

export interface CapacityStripProps {
  throughput: ThroughputView;
  planTier: "free" | "pro";
}

// CapacityStrip — full-width header strip that surfaces vault throughput.
//
// Collapsed: garden glyph + lead text + caret.
// Expanded:  panel with cleared-this-week / pending / weekly pace, plus an
//            upgrade CTA when a free-tier vault has more pending than its
//            plan ceiling allows.
//
// First-14-days "warming up" state: when `rollingWeekVelocity === null`,
// projection and ceiling are suppressed and the lead text falls back to
// "warming up — {cleared7d} cleared so far".
//
// Accessibility: aria-expanded + aria-controls on the chip; the panel
// references back via aria-labelledby. No focus trap when expanded — Tab
// moves out naturally (Architect panel: focus traps on dropdowns are a
// screen-reader anti-pattern). Esc collapses and returns focus to the chip.
export function CapacityStrip({
  throughput,
  planTier,
}: CapacityStripProps) {
  const [expanded, setExpanded] = useState(false);
  const chipRef = useRef<HTMLButtonElement | null>(null);
  const panelId = useId();
  const chipId = useId();

  const warmingUp = throughput.rollingWeekVelocity === null;
  const leadText = warmingUp
    ? `warming up — ${throughput.cleared7d} cleared so far`
    : throughput.estimatedClearText;

  const showUpgradeCTA =
    !warmingUp &&
    planTier === "free" &&
    throughput.showCeiling &&
    throughput.pending > throughput.planCeiling;

  const toggle = () => setExpanded((prev) => !prev);

  const onChipKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
      return;
    }
    if (event.key === "Escape" && expanded) {
      event.preventDefault();
      setExpanded(false);
      chipRef.current?.focus();
    }
  };

  const onPanelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setExpanded(false);
      chipRef.current?.focus();
    }
  };

  const Caret = expanded ? ChevronUp : ChevronDown;

  return (
    <div className="bg-cream border-b border-surface-border">
      <div className="px-6 py-3">
        <button
          ref={chipRef}
          id={chipId}
          type="button"
          onClick={toggle}
          onKeyDown={onChipKeyDown}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="inline-flex items-center gap-2 font-sans text-label text-ink"
        >
          <Leaf
            className="text-moss"
            width={16}
            height={16}
            strokeWidth={2}
            aria-hidden="true"
          />
          <span>{leadText}</span>
          <Caret
            className="text-ink/60"
            width={16}
            height={16}
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>
      </div>

      {expanded ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={chipId}
          onKeyDown={onPanelKeyDown}
          className="border-t border-surface-border p-6 font-sans text-label text-ink"
        >
          <div className="text-ink/60">
            {throughput.cleared7d} cleared this week
            <span aria-hidden="true"> · </span>
            {throughput.pending} pending
            {warmingUp ? null : (
              <>
                <span aria-hidden="true"> · </span>
                {throughput.rollingWeekVelocity}/week pace
              </>
            )}
          </div>

          {showUpgradeCTA ? (
            <div className="mt-3">
              <a
                href="/billing"
                className="inline-flex items-center font-sans text-label text-moss"
              >
                upgrade to Pro
              </a>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
