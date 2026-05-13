/**
 * Time formatting helpers. Replaces `date-fns` per D-20 — uses native
 * `Intl.RelativeTimeFormat` and `Intl.DateTimeFormat`, which are zero
 * runtime cost and properly localized.
 */

const MS_SECOND = 1_000;
const MS_MINUTE = 60 * MS_SECOND;
const MS_HOUR = 60 * MS_MINUTE;
const MS_DAY = 24 * MS_HOUR;
const MS_WEEK = 7 * MS_DAY;
const MS_MONTH = 30 * MS_DAY;
const MS_YEAR = 365 * MS_DAY;

type RelUnit = "second" | "minute" | "hour" | "day" | "week" | "month" | "year";

const relFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
  style: "short",
});

/**
 * Renders an ISO timestamp as a short relative phrase:
 * `"2d ago"`, `"in 3h"`, `"just now"`, `"5mo ago"`.
 *
 * Returns the input string unchanged if it can't be parsed — never throws.
 */
export function formatRelative(iso: string): string {
  const target = Date.parse(iso);
  if (Number.isNaN(target)) return iso;
  const diff = target - Date.now();
  const abs = Math.abs(diff);
  const sign = diff < 0 ? -1 : 1;

  let value: number;
  let unit: RelUnit;
  if (abs < MS_MINUTE) {
    value = Math.round(abs / MS_SECOND);
    unit = "second";
  } else if (abs < MS_HOUR) {
    value = Math.round(abs / MS_MINUTE);
    unit = "minute";
  } else if (abs < MS_DAY) {
    value = Math.round(abs / MS_HOUR);
    unit = "hour";
  } else if (abs < MS_WEEK) {
    value = Math.round(abs / MS_DAY);
    unit = "day";
  } else if (abs < MS_MONTH) {
    value = Math.round(abs / MS_WEEK);
    unit = "week";
  } else if (abs < MS_YEAR) {
    value = Math.round(abs / MS_MONTH);
    unit = "month";
  } else {
    value = Math.round(abs / MS_YEAR);
    unit = "year";
  }

  return relFormatter.format(sign * value, unit);
}

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
});

const dateOnlyFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Smart relative date/time formatting for scheduled actions:
 * - same calendar day → `"tonight 11pm"` / `"today 6am"`
 * - tomorrow → `"tomorrow 10am"`
 * - within the next week → `"Mon 6am"`
 * - further out → `"May 21, 6am"`
 *
 * Returns the input string unchanged if it can't be parsed.
 */
export function formatScheduledTime(iso: string): string {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return iso;
  const target = new Date(ts);
  const now = new Date();

  const time = timeFormatter.format(target).toLowerCase().replace(/\s/g, "");

  if (isSameLocalDay(target, now)) {
    // "tonight" if it's 6pm or later locally, else "today"
    const isEvening = target.getHours() >= 18;
    return `${isEvening ? "tonight" : "today"} ${time}`;
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (isSameLocalDay(target, tomorrow)) {
    return `tomorrow ${time}`;
  }

  const diffDays = Math.floor(
    (startOfLocalDay(target).getTime() - startOfLocalDay(now).getTime()) / MS_DAY,
  );
  if (diffDays > 0 && diffDays < 7) {
    const weekday = weekdayFormatter.format(target);
    return `${weekday} ${time}`;
  }

  return `${dateOnlyFormatter.format(target)}, ${time}`;
}
