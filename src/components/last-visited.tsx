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

    // On "/": redirect if logged in
    if (pathname === "/") {
      const lastPath = localStorage.getItem("grove_last_path");
      if (lastPath) {
        router.replace(lastPath);
        return;
      }

      // No saved path — try to land on a random note
      // Use Resources/Concepts as the default landing directory
      router.replace("/Resources/Concepts");
    }
  }, [pathname, router]);

  return null;
}
