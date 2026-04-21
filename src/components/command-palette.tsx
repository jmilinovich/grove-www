"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useSearch } from "./search-provider";

interface SearchResult {
  path: string;
  title: string;
  snippet: string;
  score: number;
}

export default function CommandPalette() {
  const { open, openSearch, closeSearch } = useSearch();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const router = useRouter();

  const resetState = useCallback(() => {
    setQuery("");
    setResults([]);
    setSelectedIndex(0);
    setError(null);
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) {
          closeSearch();
          resetState();
        } else {
          resetState();
          openSearch();
        }
      }
      if (e.key === "Escape" && open) {
        closeSearch();
        resetState();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, openSearch, closeSearch, resetState]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setError(null);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setSelectedIndex(0);
        }
      } catch {
        setError("Search unavailable");
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Navigate to result
  function navigateTo(path: string) {
    const href = "/" + path.replace(/\.md$/, "");
    closeSearch();
    resetState();
    router.push(href);
  }

  // Keyboard navigation within results
  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      navigateTo(results[selectedIndex].path);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeSearch();
          resetState();
        }
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/40"
        onClick={() => {
          closeSearch();
          resetState();
        }}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg mx-4 rounded-lg border border-surface-border bg-cream overflow-hidden">
        <div className="flex items-center gap-3 border-b border-surface-border px-4 py-3">
          <Search size={16} className="shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search notes..."
            className="flex-1 bg-transparent text-foreground text-label outline-none placeholder:text-muted"
            spellCheck={false}
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-muted border-t-accent rounded-full animate-spin" />
          )}
        </div>

        {results.length > 0 && (
          <ul className="max-h-72 overflow-y-auto py-2">
            {results.map((result, i) => (
              <li key={result.path}>
                <button
                  className={`w-full text-left px-4 py-2.5 flex flex-col gap-0.5 transition-colors ${
                    i === selectedIndex
                      ? "bg-surface-hover text-foreground"
                      : "text-muted-light hover:bg-surface-hover"
                  }`}
                  onClick={() => navigateTo(result.path)}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <span className="text-label font-medium truncate">
                    {result.title}
                  </span>
                  <span className="text-detail text-muted truncate">
                    {result.path}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {query.trim() && !loading && results.length === 0 && (
          <div className="px-4 py-8 text-center text-label text-muted">
            No results found
          </div>
        )}

        {error && !loading && (
          <div className="px-4 py-8 text-center text-label text-muted">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
