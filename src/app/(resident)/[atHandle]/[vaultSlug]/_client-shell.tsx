"use client";

import { useMemo, type ReactNode } from "react";
import { useBacklogPolling } from "@/lib/use-backlog-polling";
import {
  useKeyboardShortcuts,
  type ShortcutBinding,
} from "@/lib/use-keyboard-shortcuts";

interface ClientShellProps {
  children: ReactNode;
}

/**
 * Client-island boundary for the v2 vault homepage.
 *
 * The parent `page.tsx` is a server component (per PLAN D + Architect
 * panel decision). This shell wraps the server-rendered tree and is the
 * single mount point for cross-cutting client behavior:
 *
 *  - `useBacklogPolling()` refreshes RSC data every 15s while visible,
 *    pausing on tab hide.
 *  - `useKeyboardShortcuts([...])` registers the global, page-level
 *    shortcuts. Per D-15a, per-row keymaps live on the parent list
 *    components (NeedsReviewList / BacklogList), so this shell only
 *    binds the truly global keys.
 *
 * In W1, the shortcut handlers are placeholders — `⌘/` logs that the
 * cheatsheet is coming in W3, and `Esc` is a no-op stub. The full
 * cheatsheet UI lands in W3-SHORT-1.
 */
export default function ClientShell({ children }: ClientShellProps) {
  useBacklogPolling();

  const shortcuts = useMemo<ShortcutBinding[]>(
    () => [
      {
        key: "⌘/",
        description: "Show keyboard shortcuts cheatsheet",
        handler: () => {
          // Placeholder — W3-SHORT-1 wires the real cheatsheet sheet.
          // eslint-disable-next-line no-console
          console.log("shortcuts cheatsheet coming in W3");
        },
        preventDefault: true,
      },
      {
        key: "Esc",
        description: "Dismiss open modal / overlay",
        handler: () => {
          // No-op stub. The real modal-dismiss tree lands alongside
          // the cheatsheet + first-run sheets in W3.
        },
      },
    ],
    [],
  );

  useKeyboardShortcuts(shortcuts);

  return <>{children}</>;
}
