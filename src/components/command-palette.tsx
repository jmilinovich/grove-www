"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  path: string;
  title: string;
  snippet: string;
  score: number;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const router = useRouter();

  // Open/close handlers
  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery("");
    setResults([]);
    setSelectedIndex(0);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) {
          closePalette();
        } else {
          openPalette();
        }
      }
      if (e.key === "Escape" && open) {
        closePalette();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, openPalette, closePalette]);

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
    closePalette();
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

  function handleLogout() {
    fetch("/api/auth", { method: "DELETE" }).then(() => {
      localStorage.removeItem("grove_last_path");
      window.location.href = "/login";
    });
  }

  if (!open) {
    return (
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-sm text-muted hover:text-foreground hover:border-muted transition-colors"
          aria-label="Log out"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="hidden sm:inline">Log out</span>
        </button>
        <button
          onClick={openPalette}
          className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-sm text-muted hover:text-foreground hover:border-muted transition-colors"
          aria-label="Search notes"
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
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline-flex items-center rounded border border-surface-border px-1.5 py-0.5 text-[10px] text-muted font-mono">
            <span className="text-xs">&#8984;</span>K
          </kbd>
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) closePalette();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closePalette} />

      {/* Palette */}
      <div className="relative w-full max-w-lg mx-4 rounded-xl border border-surface-border bg-surface shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 border-b border-surface-border px-4 py-3">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-muted"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search notes..."
            className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted"
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
                  <span className="text-sm font-medium truncate">
                    {result.title}
                  </span>
                  <span className="text-xs text-muted truncate">
                    {result.path}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {query.trim() && !loading && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted">
            No results found
          </div>
        )}

        {error && !loading && (
          <div className="px-4 py-8 text-center text-sm text-muted">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
