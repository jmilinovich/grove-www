"use client";

import { useEffect, useState } from "react";

/**
 * Returns `true` while the tab is foregrounded
 * (`document.visibilityState === 'visible'`), `false` otherwise.
 *
 * Updates synchronously on the `visibilitychange` event. Designed to be
 * cheap enough to mount on every backlog page — no timers, just one
 * listener on `document`.
 *
 * SSR-safe: on the server (no `document`), returns `true` so consumers
 * that gate behavior on visibility don't accidentally suppress their
 * initial render.
 */
export function usePageVisibility(): boolean {
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof document === "undefined") return true;
    return document.visibilityState === "visible";
  });

  useEffect(() => {
    if (typeof document === "undefined") return;

    function onChange() {
      setVisible(document.visibilityState === "visible");
    }

    // Sync once on mount in case the value changed before the listener
    // was attached (e.g. user switched tabs between SSR hydration and
    // effect execution).
    onChange();
    document.addEventListener("visibilitychange", onChange);
    return () => {
      document.removeEventListener("visibilitychange", onChange);
    };
  }, []);

  return visible;
}
