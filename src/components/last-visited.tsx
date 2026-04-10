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
    // (check for note-content class which only exists on successful renders)
    if (pathname !== "/" && pathname !== "/login" && !pathname.startsWith("/api/")) {
      requestAnimationFrame(() => {
        if (document.querySelector(".note-content")) {
          localStorage.setItem("grove_last_path", pathname);
        }
      });
      return;
    }

    // On "/": try to redirect if logged in
    if (pathname === "/") {
      // Verify auth by hitting search, then redirect
      fetch("/api/search?q=*&limit=30")
        .then((r) => {
          if (!r.ok) return null;
          return r.json();
        })
        .then((data) => {
          if (!data?.results?.length) return;

          // Check for a saved last path — verify it's in the search results
          const lastPath = localStorage.getItem("grove_last_path");
          if (lastPath) {
            // Validate the saved path still exists
            const lastPathClean = lastPath.replace(/^\//, "");
            const exists = data.results.some(
              (r: { path: string }) =>
                r.path.replace(/\.md$/, "") === lastPathClean ||
                r.path === lastPathClean,
            );
            if (exists) {
              router.replace(lastPath);
              return;
            }
            // Stale path — clear it
            localStorage.removeItem("grove_last_path");
          }

          // Pick a random note from results
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
