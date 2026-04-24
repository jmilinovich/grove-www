"use client";

import { useEffect, useState } from "react";

type Mode = "past" | "bidirectional";

interface Props {
  iso: string | null;
  fallback?: string;
  mode?: Mode;
}

// Renders a timestamp as a relative string ("11h ago") while staying
// hydration-safe. SSR emits a deterministic absolute date slug so the
// first client render matches; a post-mount effect then swaps in the
// live relative string and refreshes it once per minute.
export function RelativeTime({ iso, fallback = "Never", mode = "past" }: Props) {
  const [text, setText] = useState(() => stableFallback(iso, fallback));

  useEffect(() => {
    if (!iso) return;
    const tick = () => setText(formatRelative(iso, mode));
    tick();
    const interval = window.setInterval(tick, 60_000);
    return () => window.clearInterval(interval);
  }, [iso, mode]);

  return <>{text}</>;
}

function stableFallback(iso: string | null, fallback: string): string {
  if (!iso) return fallback;
  return new Date(iso).toISOString().slice(0, 10);
}

function formatRelative(iso: string, mode: Mode): string {
  const ms = Date.now() - new Date(iso).getTime();

  if (mode === "past") {
    if (ms < 0) return absoluteDate(iso);
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return "Just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const days = Math.floor(hr / 24);
    if (days < 30) return `${days}d ago`;
    return absoluteDate(iso);
  }

  const past = ms >= 0;
  const abs = Math.abs(ms);
  const sec = Math.floor(abs / 1000);
  if (sec < 60) return past ? "just now" : "in <1m";
  const min = Math.floor(sec / 60);
  if (min < 60) return past ? `${min}m ago` : `in ${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return past ? `${hr}h ago` : `in ${hr}h`;
  const days = Math.floor(hr / 24);
  if (days < 30) return past ? `${days}d ago` : `in ${days}d`;
  return absoluteDate(iso);
}

function absoluteDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
