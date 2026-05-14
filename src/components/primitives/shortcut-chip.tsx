import type { JSX } from "react";

// Visible keyboard-shortcut affordance (SPEC §15, DESIGN.md
// `shortcut-chip` token added by W1-DESIGN-1).
//
// Rendered alongside affordances like `[r] run [e] defer`. The hook
// itself (`useKeyboardShortcuts`) handles binding registration — this
// component is purely visual.
//
// Mobile: hidden via CSS at sub-md widths (no `@media (hover: none)`
// utility exists in this Tailwind setup yet — `hidden md:inline` is the
// sanctioned fallback documented in PLAN W1-KBD-1, since shortcuts only
// appear on desktop where md+ applies).

interface ShortcutChipProps {
  keys: string;
}

export function ShortcutChip({ keys }: ShortcutChipProps): JSX.Element {
  return (
    <kbd
      className="hidden md:inline-flex items-center bg-surface text-ink/60 border border-surface-border rounded-sm px-[0.3rem] py-[0.05rem] font-mono text-detail"
      aria-label={`Keyboard shortcut: ${keys}`}
    >
      {keys}
    </kbd>
  );
}
