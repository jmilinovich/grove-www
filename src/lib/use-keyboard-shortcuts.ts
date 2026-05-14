"use client";

import { useEffect } from "react";

// Keyboard shortcut primitive (SPEC §15, PLAN D-15a/b/c).
//
// Scope:
// - Single keys and modifier chords ONLY. No sequential chords (`g b`).
// - `⌘` resolves to metaKey on Mac, ctrlKey elsewhere (hook owns the
//   platform mapping so callers can write `'⌘k'` once).
// - Focus inside `<input>`, `<textarea>`, or `[contenteditable]` blocks
//   firing — typing should never collide with a keymap.
// - `when` predicate gates context.
// - Conflicting bindings: first-mounted wins, silently. No registry; no
//   throw. The next-mounted handler simply never fires for the colliding
//   key while the first is mounted.
// - Mobile: no JS guard. The hook still mounts; nothing binds because
//   there is no keyboard. ShortcutChip hides via CSS at small viewports.

export type ShortcutBinding = {
  /** Canonical key string. Examples: 'r', 'Enter', 'Esc', '⌘k', '⌘/', 'Shift+Tab'. */
  key: string;
  /** Human-readable label for the cheatsheet. Not displayed by the hook itself. */
  description: string;
  /** Invoked when the binding matches and is not gated out. */
  handler: () => void;
  /** Optional gate — if it returns false, the handler does not fire. */
  when?: () => boolean;
  /** Optional: call event.preventDefault() before firing. Defaults to true for modifier chords, false for plain keys. */
  preventDefault?: boolean;
};

type ParsedKey = {
  /** The base key, lowercased for letters, otherwise canonical (e.g. 'Enter', 'Escape', '/', 'Tab'). */
  base: string;
  meta: boolean;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  /** True when the binding string included `⌘` (cross-platform meta-or-ctrl). */
  cmdLike: boolean;
};

// Module-level mounted-binding queue. First-mounted wins for any given
// resolved key signature; later registrations of the same signature are
// silently ignored while the prior one is mounted. The queue is keyed by
// the binding's identity object so unmount-order is irrelevant.
type MountedEntry = {
  parsed: ParsedKey;
  binding: ShortcutBinding;
};
const mounted: MountedEntry[] = [];

function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  const platform = (navigator.platform || "").toString();
  if (platform.includes("Mac")) return true;
  // Modern Chromium reports 'MacIntel'; some browsers may move toward
  // `userAgentData.platform` exclusively, but `platform` still works in
  // current evergreen browsers and is what SPEC §15 specifies.
  return false;
}

function parseKey(key: string): ParsedKey {
  // Tokens are joined with `+`. `⌘` is a token that means "meta on Mac,
  // ctrl elsewhere". The final token is the base key.
  const parts = key.split("+").map((p) => p.trim()).filter(Boolean);
  let meta = false;
  let ctrl = false;
  let alt = false;
  let shift = false;
  let cmdLike = false;

  const flushModifier = (token: string): boolean => {
    const t = token.toLowerCase();
    if (t === "⌘" || t === "cmd" || t === "meta") {
      // `⌘` is platform-conditional; resolved at match time.
      cmdLike = true;
      return true;
    }
    if (t === "ctrl" || t === "control") {
      ctrl = true;
      return true;
    }
    if (t === "alt" || t === "option") {
      alt = true;
      return true;
    }
    if (t === "shift") {
      shift = true;
      return true;
    }
    return false;
  };

  // Special handling: a single token that starts with `⌘` and has more
  // characters (e.g. `⌘k`, `⌘/`) is sugar for `⌘+<rest>`. Split it.
  if (parts.length === 1 && parts[0].startsWith("⌘") && parts[0].length > 1) {
    parts[0] = parts[0].slice(1);
    cmdLike = true;
  }

  let base = "";
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isLast = i === parts.length - 1;
    if (isLast && !flushModifier(part)) {
      base = part;
    } else if (!flushModifier(part)) {
      // Unknown modifier token in non-final position — treat as base.
      base = part;
    }
  }

  // Normalize base.
  base = normalizeBase(base);

  return { base, meta, ctrl, alt, shift, cmdLike };
}

function normalizeBase(raw: string): string {
  if (!raw) return "";
  // Single letters → lowercase (KeyboardEvent.key is case-sensitive: 'r'
  // vs 'R' depending on shift). We always match case-insensitively for
  // letters.
  if (raw.length === 1) {
    const lower = raw.toLowerCase();
    return lower;
  }
  // Multi-character names — canonicalize a few common spellings.
  const lower = raw.toLowerCase();
  if (lower === "esc" || lower === "escape") return "escape";
  if (lower === "enter" || lower === "return") return "enter";
  if (lower === "tab") return "tab";
  if (lower === "space" || lower === "spacebar") return " ";
  if (lower === "up" || lower === "arrowup") return "arrowup";
  if (lower === "down" || lower === "arrowdown") return "arrowdown";
  if (lower === "left" || lower === "arrowleft") return "arrowleft";
  if (lower === "right" || lower === "arrowright") return "arrowright";
  return lower;
}

function matches(parsed: ParsedKey, event: KeyboardEvent): boolean {
  const eventBase = normalizeBase(event.key);
  if (eventBase !== parsed.base) return false;

  // Resolve cmdLike to platform: on Mac it requires metaKey, elsewhere ctrlKey.
  const mac = isMac();
  const requireMeta = parsed.meta || (parsed.cmdLike && mac);
  const requireCtrl = parsed.ctrl || (parsed.cmdLike && !mac);

  if (requireMeta !== event.metaKey) return false;
  if (requireCtrl !== event.ctrlKey) return false;
  if (parsed.alt !== event.altKey) return false;
  if (parsed.shift !== event.shiftKey) return false;
  return true;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target) return false;
  if (!(target instanceof Element)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if ((target as HTMLElement).isContentEditable) return true;
  return false;
}

function sameSignature(a: ParsedKey, b: ParsedKey): boolean {
  return (
    a.base === b.base &&
    a.meta === b.meta &&
    a.ctrl === b.ctrl &&
    a.alt === b.alt &&
    a.shift === b.shift &&
    a.cmdLike === b.cmdLike
  );
}

function hasModifier(parsed: ParsedKey): boolean {
  return parsed.meta || parsed.ctrl || parsed.alt || parsed.cmdLike;
}

export function useKeyboardShortcuts(bindings: ShortcutBinding[]): void {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const entries: MountedEntry[] = bindings.map((binding) => ({
      parsed: parseKey(binding.key),
      binding,
    }));

    // Register in mount order. First-mounted wins on collisions.
    for (const entry of entries) {
      mounted.push(entry);
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      for (const candidate of entries) {
        if (!matches(candidate.parsed, event)) continue;

        // Collision check: is there an earlier-mounted entry with the
        // same resolved signature? If so, we lose silently.
        let firstForSig: MountedEntry | null = null;
        for (const m of mounted) {
          if (sameSignature(m.parsed, candidate.parsed)) {
            firstForSig = m;
            break;
          }
        }
        if (firstForSig !== candidate) continue;

        if (candidate.binding.when && !candidate.binding.when()) continue;

        const shouldPreventDefault =
          candidate.binding.preventDefault ?? hasModifier(candidate.parsed);
        if (shouldPreventDefault) {
          event.preventDefault();
        }
        candidate.binding.handler();
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      for (const entry of entries) {
        const idx = mounted.indexOf(entry);
        if (idx >= 0) mounted.splice(idx, 1);
      }
    };
    // We intentionally re-run when bindings change so callers can pass
    // freshly-closured handlers each render. Callers concerned about
    // churn should memoize.
  }, [bindings]);
}
