"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMe } from "@/contexts/me-context";
import { useScopedLink } from "@/hooks/use-scoped-link";
import { bareHandle } from "@/lib/vault-context";

function initialsFrom(source: string | null | undefined): string {
  if (!source) return "?";
  const trimmed = source.trim();
  if (!trimmed) return "?";
  if (trimmed.includes("@")) {
    const local = trimmed.split("@")[0];
    return local.slice(0, 2).toUpperCase();
  }
  const parts = trimmed.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

function signOut() {
  fetch("/api/auth", { method: "DELETE" }).then(() => {
    try {
      localStorage.removeItem("grove_last_path");
    } catch {
      // swallow — localStorage can throw in private mode / SSR
    }
    window.location.href = "/login";
  });
}

export default function AvatarMenu() {
  const { me } = useMe();
  const { atHandle, userLink } = useScopedLink();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const handle = me?.handle ?? me?.username ?? (atHandle ? bareHandle(atHandle) : "");
  const email = me?.email ?? null;
  const initials = initialsFrom(email ?? handle);

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    }
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        menuRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    window.addEventListener("mousedown", handleClick);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("mousedown", handleClick);
    };
  }, [open, close]);

  if (!me) return null;

  const profileHref = handle ? userLink("/profile") : "/profile";
  const settingsHref = handle ? userLink("/settings/vaults") : "/settings/vaults";

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center justify-center w-8 h-8 rounded-full bg-surface border border-surface-border text-detail font-medium text-foreground hover:bg-surface/60 transition-colors"
      >
        {initials}
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-md border border-surface-border bg-background py-1"
        >
          {email && (
            <div className="px-3 py-2 text-detail text-muted border-b border-surface-border">
              Signed in as{" "}
              <span className="text-foreground">{email}</span>
            </div>
          )}
          <Link
            href={profileHref}
            role="menuitem"
            prefetch={false}
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-label text-foreground hover:bg-surface transition-colors"
          >
            Profile
          </Link>
          <Link
            href={settingsHref}
            role="menuitem"
            prefetch={false}
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-label text-foreground hover:bg-surface transition-colors"
          >
            Account settings
          </Link>
          <div className="border-t border-surface-border my-1" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            className="w-full text-left px-3 py-2 text-label text-foreground hover:bg-surface transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
