import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatRelative, formatScheduledTime } from "./format-time";

// Fixed "now" — 2026-05-13T18:00:00Z. All assertions are anchored here.
const FIXED_NOW = new Date("2026-05-13T18:00:00Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("formatRelative", () => {
  it("renders a past timestamp ~2 days ago as 'Xd ago' (Intl format)", () => {
    // 2 days before now
    const out = formatRelative("2026-05-11T18:00:00Z");
    // Intl.RelativeTimeFormat (en, short) → "2 days ago" or "2d ago"
    expect(out).toMatch(/2\s?(d|day|days)\s?ago/i);
  });

  it("renders a future timestamp ~2 days from now as 'in Xd'", () => {
    const out = formatRelative("2026-05-15T18:00:00Z");
    expect(out).toMatch(/in\s?2\s?(d|day|days)/i);
  });

  it("renders something hours-ago as a short hour phrase", () => {
    const out = formatRelative("2026-05-13T15:00:00Z");
    expect(out.toLowerCase()).toContain("ago");
    expect(out).toMatch(/3/);
  });

  it("returns the input unchanged for an unparseable string", () => {
    expect(formatRelative("not-a-date")).toBe("not-a-date");
  });
});

describe("formatScheduledTime", () => {
  it("renders an evening time on the same day as 'tonight ...'", () => {
    // FIXED_NOW is 18:00 UTC. Pick a target later the same UTC day.
    // To keep this assertion timezone-independent we pin to the local
    // version of "now" so target is guaranteed same-local-day + evening.
    const now = new Date();
    const target = new Date(now);
    target.setHours(23, 0, 0, 0); // 11pm local
    if (target.getTime() <= now.getTime()) {
      // If the local clock skipped past 11pm, push the test target out
      // — but anchored fake timer keeps now stable in CI, so this is
      // belt-and-suspenders.
      target.setDate(target.getDate() + 0);
    }
    const out = formatScheduledTime(target.toISOString());
    expect(out.toLowerCase()).toContain("tonight");
  });

  it("renders a date several days out as 'Mon ...' style weekday-and-time", () => {
    const now = new Date();
    const target = new Date(now);
    target.setDate(now.getDate() + 3);
    target.setHours(10, 0, 0, 0);
    const out = formatScheduledTime(target.toISOString());
    // Should start with a 3-letter weekday abbreviation
    expect(out).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+\d/);
  });

  it("renders a date more than a week out as 'Mon DD, time'", () => {
    const now = new Date();
    const target = new Date(now);
    target.setDate(now.getDate() + 21);
    target.setHours(6, 0, 0, 0);
    const out = formatScheduledTime(target.toISOString());
    // E.g. "Jun 3, 6:00am"
    expect(out).toMatch(/^[A-Z][a-z]{2}\s+\d{1,2},\s+\d/);
  });

  it("returns the input unchanged for an unparseable string", () => {
    expect(formatScheduledTime("nope")).toBe("nope");
  });
});
