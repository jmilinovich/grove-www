"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";
import type { VaultEntry } from "@/lib/vault-context";

export type { VaultEntry };

export interface VaultSwitcherProps {
  /** The vaults this user belongs to. Always-rendered — just disabled at n=1. */
  vaults: VaultEntry[];
  /** Slug of the vault currently displayed. May be empty on user-scoped pages. */
  currentSlug: string;
  /** Handle used for the "@<handle> /" chrome label. */
  viewerHandle: string;
  /** Called when the user picks a vault. Defaults to `window.location.href = …`. */
  onSelect?: (vault: VaultEntry) => void;
}

/**
 * Vault switcher (P8-B4).
 *
 * Header dropdown. Label is `@<handle> / <slug>` in monospace. Clicking
 * opens a combobox listing every vault the user has access to; selection
 * navigates to `/@<handle>/<slug>/dashboard`. Keyboard shortcut: Cmd+Shift+V
 * (the PLAN.md decision to avoid the Cmd+Shift+K collision with Slack/Linear).
 *
 * Always rendered when there is at least one vault so the chrome doesn't
 * shift mid-session. Disabled at n=1 — click still opens for completeness
 * but the single entry is rendered as the current one.
 *
 * ARIA: role="combobox" with aria-expanded. An `aria-live="polite"` region
 * announces the selected vault's name on change so screen readers pick up
 * the context switch.
 */
export function VaultSwitcher({
  vaults,
  currentSlug,
  viewerHandle,
  onSelect,
}: VaultSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [lastAnnounced, setLastAnnounced] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  // On user-scoped pages (`/@<h>/profile`, `/@<h>/settings/*`) there is no
  // `vaultSlug` in the URL — the switcher should show a neutral "Switch
  // to vault…" launcher instead of claiming a vault is active. Derived
  // from `useParams()` so the component reflects the current route without
  // any parent wiring (see SPEC.md P8-B6 component behavior).
  const routeParams = useParams();
  const onUserScopedPage =
    typeof routeParams?.vaultSlug !== "string" ||
    (routeParams.vaultSlug as string).length === 0;

  if (vaults.length === 0) return null;
  const current = vaults.find((v) => v.slug === currentSlug) ?? vaults[0];
  const singleVault = vaults.length === 1;

  // Cmd+Shift+V (Mac) / Ctrl+Shift+V (elsewhere) toggles the dropdown.
  // Skip if focus is already in an input/textarea/contenteditable so the
  // shortcut doesn't eat clipboard paste in editors.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.key === "v" || e.key === "V")) return;
      if (!(e.metaKey || e.ctrlKey) || !e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
      }
      e.preventDefault();
      setOpen((o) => !o);
      setTimeout(() => buttonRef.current?.focus(), 0);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Click-outside closes the panel.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || buttonRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function selectVault(v: VaultEntry) {
    setOpen(false);
    setLastAnnounced(`Switched to ${v.name}`);
    if (onSelect) {
      onSelect(v);
    } else {
      const url = `/@${v.owner_handle}/${v.slug}/dashboard`;
      window.location.href = url;
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-label="Switch vault"
        aria-disabled={singleVault && !onUserScopedPage}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-md border border-ink/15 bg-white/60 px-2.5 py-1.5 font-mono text-sm text-ink hover:bg-white focus:outline-none focus:ring-2 focus:ring-moss/40"
      >
        {onUserScopedPage ? (
          <span className="text-ink/60">Switch to vault…</span>
        ) : (
          <>
            <span>@{viewerHandle}</span>
            <span className="text-ink/40">/</span>
            <span>{current.slug}</span>
          </>
        )}
        {(onUserScopedPage || !singleVault) && (
          <ChevronDown className="size-3.5 opacity-50" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          id={listboxId}
          role="listbox"
          aria-label="Your vaults"
          className="absolute right-0 mt-1 w-64 rounded-md border border-ink/15 bg-white z-50"
        >
          <ul className="py-1">
            {vaults.map((v) => {
              // On user-scoped pages nothing is "currently active" — no
              // check mark, no bolding, just a plain list.
              const active = !onUserScopedPage && v.slug === current.slug;
              return (
                <li key={v.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => selectVault(v)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-ink/15 focus:outline-none focus:bg-ink/15 ${active ? "font-medium" : ""}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-mono">@{v.owner_handle}/{v.slug}</span>
                      <span className="text-xs text-ink/60">{v.name} · {v.role}</span>
                    </div>
                    {active && <Check className="size-4 text-moss" aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Screen-reader live region. Mounted always, updates on each switch. */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {lastAnnounced}
      </div>
    </div>
  );
}
