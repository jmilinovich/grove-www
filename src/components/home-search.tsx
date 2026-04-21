"use client";

import { Search } from "lucide-react";
import { useSearch } from "./search-provider";

export default function HomeSearch({ trailName }: { trailName: string }) {
  const { openSearch } = useSearch();

  return (
    <button
      type="button"
      onClick={openSearch}
      className="w-full flex items-center gap-3 rounded-lg border border-surface-border bg-surface/60 px-4 py-3 text-left text-label text-ink/60 hover:text-ink hover:border-muted transition-colors"
    >
      <Search size={16} className="shrink-0" />
      <span className="flex-1 truncate">Search {trailName}…</span>
      <kbd className="hidden sm:inline-flex items-center rounded-md border border-surface-border px-1.5 py-0.5 text-detail text-muted font-mono">
        <span className="text-detail">&#8984;</span>K
      </kbd>
    </button>
  );
}
