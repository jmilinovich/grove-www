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
    // On note pages: save the path
    if (pathname !== "/" && pathname !== "/login" && !pathname.startsWith("/api/")) {
      localStorage.setItem("grove_last_path", pathname);
      return;
    }

    // On "/": try to redirect if logged in
    if (pathname === "/") {
      // Always try the search first to confirm we're actually logged in
      fetch("/api/search?q=*&limit=30")
        .then((r) => {
          if (!r.ok) return null;
          return r.json();
        })
        .then((data) => {
          if (!data?.results?.length) return;

          // Check for a saved last path
          const lastPath = localStorage.getItem("grove_last_path");
          if (lastPath) {
            router.replace(lastPath);
            return;
          }

          // No last path — pick a random note
          const results = data.results;
          const pick = results[Math.floor(Math.random() * results.length)];
          const href = "/" + pick.path.replace(/\.md$/, "");
          router.replace(href);
        })
        .catch(() => {
          // Not logged in or API error — stay on marketing page
        });
    }
  }, [pathname, router]);

  return null;
}
