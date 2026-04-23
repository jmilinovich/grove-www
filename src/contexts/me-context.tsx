"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { MeResponse } from "@/lib/vault-context";

// Shared /api/me fetch so the header + sidebar + any other client component
// don't each issue their own round-trip on every page load. Mounted at the
// resident layout; consumers read via `useMe()`. Null means "still loading"
// or "unauthenticated" — callers that need the distinction can also check
// the `loading` flag on the context value.
interface MeContextValue {
  me: MeResponse | null;
  loading: boolean;
}

const MeContext = createContext<MeContextValue>({ me: null, loading: true });

let inFlight: Promise<MeResponse | null> | null = null;

async function fetchMeOnce(): Promise<MeResponse | null> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const res = await fetch("/api/me");
      if (!res.ok) return null;
      return (await res.json()) as MeResponse;
    } catch {
      return null;
    } finally {
      // Reset so subsequent mounts (e.g. after a router.refresh) can re-fetch.
      // The microtask ensures all same-tick consumers share this promise.
      queueMicrotask(() => { inFlight = null; });
    }
  })();
  return inFlight;
}

export function MeProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchMeOnce().then((data) => {
      if (cancelled) return;
      setMe(data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return <MeContext.Provider value={{ me, loading }}>{children}</MeContext.Provider>;
}

export function useMe(): MeContextValue {
  return useContext(MeContext);
}
