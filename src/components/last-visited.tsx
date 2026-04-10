"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Tracks the last visited note path in localStorage.
 * On the marketing page ("/"), redirects to it if logged in.
 */
export default function LastVisited() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // On note pages: save the path
    if (pathname !== "/" && pathname !== "/login" && !pathname.startsWith("/api/")) {
      localStorage.setItem("grove_last_path", pathname);
      return;
    }

    // On "/": redirect to last path if we have a cookie (logged in)
    if (pathname === "/") {
      const lastPath = localStorage.getItem("grove_last_path");
      const hasCookie = document.cookie.includes("grove_token=");
      if (lastPath && hasCookie) {
        router.replace(lastPath);
      }
    }
  }, [pathname, router]);

  return null;
}
