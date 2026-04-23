"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Home,
  LayoutGrid,
  LogOut,
  PanelLeft,
  Search,
  User,
  Image as ImageIcon,
} from "lucide-react";
import { useSidebar } from "./sidebar-provider";
import { useSearch } from "./search-provider";
import { VaultSwitcher, type VaultEntry } from "./vault-switcher";
import { useScopedLink } from "@/hooks/use-scoped-link";
import { useMe } from "@/contexts/me-context";
import {
  activeScopeFromMe,
  bareHandle,
  scopedPath,
  userScopedPath,
} from "@/lib/vault-context";

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
  const { atHandle, vaultSlug, ready } = useScopedLink();
  const [trail, setTrail] = useState<TrailInfo | null>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);
  // /api/me is shared via MeProvider so the sidebar + header don't each
  // fire their own request on every page load.
  const { me } = useMe();

  useEffect(() => {
    fetch("/api/whoami")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.trail) setTrail(data.trail);
        setRoleLoaded(true);
      })
      .catch(() => setRoleLoaded(true));
  }, []);

  const vaults: VaultEntry[] = useMemo(() => me?.vaults ?? [], [me]);
  const viewerHandle = me?.handle ?? me?.username ?? bareHandle(atHandle ?? "");
  // Current vault: scoped-route params win; fall back to MRU from /v1/me.
  const currentSlug = useMemo(() => {
    if (vaultSlug) return vaultSlug;
    const active = activeScopeFromMe(me);
    return active?.slug ?? "";
  }, [vaultSlug, me]);

  const isNonOwner = trail !== null;
  // Home-button target: trail users → /home; scoped viewers → their vault's
  // dashboard; everyone else → bare /dashboard which will 301 to MRU.
  const homeHref = useMemo(() => {
    if (isNonOwner) return "/home";
    if (ready && atHandle && vaultSlug) {
      return scopedPath(atHandle, vaultSlug, "/dashboard");
    }
    const active = activeScopeFromMe(me);
    if (active) return scopedPath(active.handle, active.slug, "/dashboard");
    return "/dashboard";
  }, [isNonOwner, ready, atHandle, vaultSlug, me]);
  // Profile is user-scoped (P8-B6): `/@<handle>/profile`, no vault slug.
  // Use the route's atHandle when we have it; otherwise fall back to the
  // viewer's handle from /v1/me; last resort is bare `/profile` which 308s
  // to the user-scoped canonical via its own shim.
  const profileHref = useMemo(() => {
    if (ready && atHandle) {
      return userScopedPath(atHandle, "/profile");
    }
    const active = activeScopeFromMe(me);
    if (active) return userScopedPath(active.handle, "/profile");
    return "/profile";
  }, [ready, atHandle, me]);
  const imagesHref = useMemo(() => {
    if (ready && atHandle && vaultSlug) {
      return scopedPath(atHandle, vaultSlug, "/images");
    }
    const active = activeScopeFromMe(me);
    if (active) return scopedPath(active.handle, active.slug, "/images");
    return "/images";
  }, [ready, atHandle, vaultSlug, me]);

  const homeLabel = isNonOwner ? "Home" : "Dashboard";

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-12 flex items-center justify-between px-4 bg-background border-b border-surface-border">
      {/* Left: sidebar toggle + logo + vault switcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="flex items-center justify-center w-8 h-8 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={sidebarOpen}
        >
          <PanelLeft size={18} />
        </button>
        <Link
          href={isNonOwner ? "/home" : "/"}
          className="font-serif text-base font-medium text-foreground hover:text-accent transition-colors"
        >
          Grove
        </Link>
        {trail && (
          <span className="text-detail text-muted border-l border-surface-border pl-3 ml-1">
            {trail.name}
          </span>
        )}
        {!isNonOwner && vaults.length > 0 && viewerHandle && currentSlug && (
          <div className="border-l border-surface-border pl-3 ml-1">
            <VaultSwitcher
              vaults={vaults}
              currentSlug={currentSlug}
              viewerHandle={viewerHandle}
            />
          </div>
        )}
      </div>

      {/* Center: search trigger */}
      <button
        onClick={openSearch}
        className="hidden sm:flex items-center gap-2 rounded-lg border border-surface-border bg-surface/60 px-3 py-1.5 text-label text-muted hover:text-foreground hover:border-muted transition-colors max-w-xs w-full sm:w-64"
      >
        <Search size={14} className="shrink-0" />
        <span className="flex-1 text-left truncate">Search notes...</span>
        <kbd className="hidden md:inline-flex items-center rounded-md border border-surface-border px-1.5 py-0.5 text-detail text-muted font-mono">
          <span className="text-detail">&#8984;</span>K
        </kbd>
      </button>

      {/* Mobile search icon */}
      <button
        onClick={openSearch}
        className="sm:hidden flex items-center justify-center w-8 h-8 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors"
        aria-label="Search notes"
      >
        <Search size={18} />
      </button>

      {/* Right: images + home/dashboard + profile + logout */}
      <div className="flex items-center gap-1">
      {roleLoaded && !isNonOwner && (
        <Link
          href={imagesHref}
          className="flex items-center justify-center w-8 h-8 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors"
          aria-label="Images"
        >
          <ImageIcon size={16} />
        </Link>
      )}
      {roleLoaded && (
        <Link
          href={homeHref}
          className="flex items-center justify-center w-8 h-8 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors"
          aria-label={homeLabel}
        >
          {isNonOwner ? <Home size={16} /> : <LayoutGrid size={16} />}
        </Link>
      )}
      <Link
        href={profileHref}
        className="flex items-center justify-center w-8 h-8 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors"
        aria-label="Profile"
      >
        <User size={16} />
      </Link>
      <button
        onClick={handleLogout}
        className="flex items-center justify-center w-8 h-8 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors"
        aria-label="Log out"
      >
        <LogOut size={16} />
      </button>
      </div>
    </header>
  );
}
