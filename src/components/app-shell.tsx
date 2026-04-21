"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "./header";
import Sidebar from "./sidebar";

const CHROME_HIDDEN_PATHS = ["/login", "/"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);

  // Probe auth once so resident-scope routes (/@<handle>/...) and share/trail
  // public routes get the full app chrome when the viewer is signed in —
  // otherwise they fall back to their own minimal public layout.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/whoami")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (!cancelled) setIsSignedIn(Boolean(data)); })
      .catch(() => { if (!cancelled) setIsSignedIn(false); });
    return () => { cancelled = true; };
  }, []);

  const isResidentScope = /^\/%40|^\/@/.test(pathname);
  const isPublicScope = pathname.startsWith("/trails/") || pathname.startsWith("/s/") || isResidentScope;
  const hiddenPath = CHROME_HIDDEN_PATHS.includes(pathname);

  // Hide chrome on login + marketing root always.
  // On "public" scopes (@handle, trails, shares): hide chrome when signed out
  //   so visitors see the minimal public layout; show chrome when signed in
  //   so owners have their usual nav.
  // Everywhere else (dashboard, home, profile, images): always show chrome.
  const showChrome = !hiddenPath && (!isPublicScope || isSignedIn === true);

  if (!showChrome) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <div className="flex pt-12 min-h-screen">
        <Sidebar />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </>
  );
}
