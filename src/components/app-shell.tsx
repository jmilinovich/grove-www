"use client";

import { usePathname } from "next/navigation";
import Header from "./header";
import Sidebar from "./sidebar";

const CHROME_HIDDEN_PATHS = ["/login", "/"];

export default function AppShell({
  children,
  isSignedIn,
}: {
  children: React.ReactNode;
  isSignedIn: boolean;
}) {
  const pathname = usePathname();

  const isResidentScope = /^\/%40|^\/@/.test(pathname);
  const isPublicScope = pathname.startsWith("/trails/") || pathname.startsWith("/s/") || isResidentScope;
  const hiddenPath = CHROME_HIDDEN_PATHS.includes(pathname);

  // Hide chrome on login + marketing root always.
  // On "public" scopes (@handle, trails, shares): hide chrome when signed out
  //   so visitors see the minimal public layout; show chrome when signed in
  //   so owners have their usual nav.
  // Everywhere else (dashboard, home, profile, images): always show chrome.
  //
  // isSignedIn is resolved SSR by the root layout from the api_key cookie,
  // so there's no /api/whoami round-trip and no FOUC.
  const showChrome = !hiddenPath && (!isPublicScope || isSignedIn);

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
