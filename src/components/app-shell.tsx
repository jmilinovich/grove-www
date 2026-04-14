"use client";

import { usePathname } from "next/navigation";
import Header from "./header";
import Sidebar from "./sidebar";

const CHROME_HIDDEN_PATHS = ["/login", "/"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showChrome = !CHROME_HIDDEN_PATHS.includes(pathname) && !pathname.startsWith("/trails/") && !pathname.startsWith("/s/");

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
