"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSidebar } from "./sidebar-provider";
import { useSearch } from "./search-provider";

interface TrailInfo {
  id: string;
  name: string;
}

function handleLogout() {
  fetch("/api/auth", { method: "DELETE" }).then(() => {
    localStorage.removeItem("grove_last_path");
    window.location.href = "/login";
  });
}

export default function Header() {
  const { toggle, open: sidebarOpen } = useSidebar();
  const { openSearch } = useSearch();
  const [trail, setTrail] = useState<TrailInfo | null>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/whoami")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.trail) setTrail(data.trail);
        setRoleLoaded(true);
      })
      .catch(() => setRoleLoaded(true));
  }, []);

  const isNonOwner = trail !== null;
  const homeHref = isNonOwner ? "/home" : "/dashboard";
  const homeLabel = isNonOwner ? "Home" : "Dashboard";

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-12 flex items-center justify-between px-4 bg-background/95 backdrop-blur-sm border-b border-surface-border">
      {/* Left: sidebar toggle + logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="flex items-center justify-center w-8 h-8 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={sidebarOpen}
        >
          {/* Lucide PanelLeft */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 3v18" />
          </svg>
        </button>
        <Link
          href={isNonOwner ? "/home" : "/"}
          className="font-serif text-base font-medium text-foreground hover:text-accent transition-colors"
        >
          Grove
        </Link>
        {trail && (
          <span className="text-xs text-muted border-l border-surface-border pl-3 ml-1">
            {trail.name}
          </span>
        )}
      </div>

      {/* Center: search trigger */}
      <button
        onClick={openSearch}
        className="hidden sm:flex items-center gap-2 rounded-lg border border-surface-border bg-surface/60 px-3 py-1.5 text-sm text-muted hover:text-foreground hover:border-muted transition-colors max-w-xs w-full sm:w-64"
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
          className="shrink-0"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span className="flex-1 text-left truncate">Search notes...</span>
        <kbd className="hidden md:inline-flex items-center rounded border border-surface-border px-1.5 py-0.5 text-detail text-muted font-mono">
          <span className="text-xs">&#8984;</span>K
        </kbd>
      </button>

      {/* Mobile search icon */}
      <button
        onClick={openSearch}
        className="sm:hidden flex items-center justify-center w-8 h-8 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors"
        aria-label="Search notes"
      >
        <svg
          width="18"
          height="18"
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
      </button>

      {/* Right: images + home/dashboard + profile + logout */}
      <div className="flex items-center gap-1">
      {roleLoaded && !isNonOwner && (
        <Link
          href="/images"
          className="flex items-center justify-center w-8 h-8 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors"
          aria-label="Images"
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
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
        </Link>
      )}
      {roleLoaded && (
        <Link
          href={homeHref}
          className="flex items-center justify-center w-8 h-8 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors"
          aria-label={homeLabel}
        >
          {isNonOwner ? (
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
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-5h-2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
          ) : (
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
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          )}
        </Link>
      )}
      <Link
        href="/profile"
        className="flex items-center justify-center w-8 h-8 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors"
        aria-label="Profile"
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
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      </Link>
      <button
        onClick={handleLogout}
        className="flex items-center justify-center w-8 h-8 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors"
        aria-label="Log out"
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
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
      </div>
    </header>
  );
}
