"use client";

import { useSearch } from "./search-provider";

export default function HomeSearch({ trailName }: { trailName: string }) {
  const { openSearch } = useSearch();

  return (
    <button
      type="button"
      onClick={openSearch}
      className="w-full flex items-center gap-3 rounded-lg border border-surface-border bg-surface/60 px-4 py-3 text-left text-sm text-ink/60 hover:text-ink hover:border-muted transition-colors"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <span className="flex-1 truncate">Search {trailName}…</span>
      <kbd className="hidden sm:inline-flex items-center rounded border border-surface-border px-1.5 py-0.5 text-detail text-muted font-mono">
        <span className="text-xs">&#8984;</span>K
      </kbd>
    </button>
  );
}
