"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface SidebarContextValue {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  open: false,
  toggle: () => {},
  close: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

const STORAGE_KEY = "grove_sidebar_open";
const FIRST_VISIT_KEY = "grove_sidebar_visited";

export default function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Read initial state from localStorage on mount
  useEffect(() => {
    const visited = localStorage.getItem(FIRST_VISIT_KEY);
    if (!visited) {
      // First visit — show sidebar open
      setOpen(true);
      localStorage.setItem(FIRST_VISIT_KEY, "1");
    } else {
      const stored = localStorage.getItem(STORAGE_KEY);
      setOpen(stored === "1");
    }
    setHydrated(true);
  }, []);

  // Persist state changes
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
    }
  }, [open, hydrated]);

  // Keyboard shortcut: Cmd+\ / Ctrl+\
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  const close = useCallback(() => setOpen(false), []);

  return (
    <SidebarContext value={{ open, toggle, close }}>
      {children}
    </SidebarContext>
  );
}
