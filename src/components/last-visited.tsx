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
      const lastPath = localStorage.getItem("grove_last_path");
      if (lastPath) {
        router.replace(lastPath);
        return;
      }

      // No last path — fetch a random note to land on
      fetch("/api/search?q=concept&limit=20")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data?.results?.length) return;
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
