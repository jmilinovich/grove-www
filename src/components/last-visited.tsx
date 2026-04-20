"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Tracks the last visited note path in localStorage.
 * On "/", redirects to last path or a random note if logged in.
 */
export default function LastVisited() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // On note pages: only save if the page actually rendered content
    if (pathname !== "/" && pathname !== "/login" && !pathname.startsWith("/api/")) {
      requestAnimationFrame(() => {
        if (document.querySelector(".note-content")) {
          localStorage.setItem("grove_last_path", pathname);
        }
      });
      return;
    }

    // On "/": redirect only if logged in (has auth cookie)
    if (pathname === "/") {
      const hasToken = document.cookie.includes("grove_token");
      if (!hasToken) return; // Let unauthenticated visitors see the landing page

      const lastPath = localStorage.getItem("grove_last_path");
      if (lastPath) {
        router.replace(lastPath);
        return;
      }

      // No saved path — role-aware default: trail users land on /home,
      // owners land on a browsable folder.
      fetch("/api/whoami")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          router.replace(data?.trail ? "/home" : "/Resources/Concepts");
        })
        .catch(() => router.replace("/Resources/Concepts"));
    }
  }, [pathname, router]);

  return null;
}
