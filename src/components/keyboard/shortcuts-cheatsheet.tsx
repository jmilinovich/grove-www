"use client";

import { useEffect, useId, useRef, type JSX } from "react";
import { ShortcutChip } from "@/components/primitives/shortcut-chip";

// Shortcuts cheatsheet overlay (SPEC §15, PLAN W3-SHORT-1).
//
// Hardcoded content per D-15c — no dynamic registry. The opening
// keybind (⌘/) is registered by the global keyboard handler in the
// client shell (v2.5 wiring); this component only renders the overlay
// when `open` is true and handles Esc to dismiss.
//
// Mobile: returns null when `matchMedia('(hover: none)')` matches
// (desktop-only per SPEC §15 — "Mobile gracefully ignores keyboard
// shortcuts").
//
// Modal pattern follows DESIGN.md guidance: a sanctioned `bg-ink/40`
// scrim (no blur effects — forbidden by DESIGN.md depth grammar) and
// a cream content card with surface-border on rounded-lg.

interface ShortcutsCheatsheetProps {
  open: boolean;
  onClose: () => void;
}

interface ShortcutRow {
  keys: string;
  description: string;
}

interface ShortcutSection {
  title: string;
  rows: ShortcutRow[];
}

// Verbatim from SPEC §15 — sections + bindings.
const SECTIONS: ShortcutSection[] = [
  {
    title: "global",
    rows: [
      { keys: "⌘K", description: "command palette / run a skill" },
      { keys: "⌘/", description: "shortcuts cheatsheet" },
      { keys: "Esc", description: "dismiss modal / close detail / unfocus" },
      { keys: "g b", description: "go to backlog (homepage)" },
      { keys: "g s", description: "go to skills" },
      { keys: "?", description: "help" },
    ],
  },
  {
    title: "backlog",
    rows: [
      { keys: "j / k", description: "next / prev task in current section" },
      { keys: "↓ / ↑", description: "next / prev task (arrow alias)" },
      { keys: "Tab / Shift+Tab", description: "between sections (review → pending → cleared)" },
      { keys: "Enter", description: "open task detail" },
      { keys: "r", description: "run task (pending) / refine (review)" },
      { keys: "e", description: "defer" },
      { keys: "d", description: "dismiss" },
    ],
  },
  {
    title: "review",
    rows: [
      { keys: "c", description: "confirm durable" },
      { keys: "r", description: "open refine inline" },
      { keys: "x", description: "dismiss" },
      { keys: "s", description: "mark stale" },
    ],
  },
  {
    title: "task detail",
    rows: [
      { keys: "↑ / ↓", description: "cycle related notes" },
      { keys: "Enter", description: "primary action (run / confirm)" },
      { keys: "Esc", description: "back to backlog" },
    ],
  },
  {
    title: "skills",
    rows: [
      { keys: "i", description: "install (browse — v3, slot reserved)" },
      { keys: "c", description: "configure cadence (installed)" },
      { keys: "r", description: "run now" },
    ],
  },
];

function isCoarsePointer(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(hover: none)").matches;
}

export function ShortcutsCheatsheet({
  open,
  onClose,
}: ShortcutsCheatsheetProps): JSX.Element | null {
  const headingId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Esc closes. Bound on document so it fires regardless of focus
  // position inside the overlay.
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;
  if (isCoarsePointer()) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 p-12 overflow-y-auto"
      onClick={(event) => {
        // Scrim click closes; clicks inside the card don't bubble here.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="bg-cream border border-surface-border rounded-lg p-12 max-w-2xl mx-auto w-full"
      >
        <h2
          id={headingId}
          className="font-sans font-medium text-label text-ink lowercase mb-8"
        >
          keyboard shortcuts
        </h2>

        <div className="flex flex-col gap-8">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h3 className="font-sans font-medium text-label text-ink lowercase mb-4">
                {section.title}
              </h3>
              <ul className="flex flex-col gap-2">
                {section.rows.map((row) => (
                  <li
                    key={`${section.title}-${row.keys}`}
                    className="flex items-center gap-4"
                  >
                    <ShortcutChip keys={row.keys} />
                    <span className="text-ink/60 text-body">{row.description}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
