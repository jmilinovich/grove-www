"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Folder } from "lucide-react";
import { useSidebar } from "./sidebar-provider";

interface TreeEntry {
  name: string;
  path: string;
  isFolder: boolean;
  children?: TreeEntry[];
}

function FolderIcon({ className }: { className?: string }) {
  return <Folder size={14} className={className} />;
}

function ChevronIcon({ expanded, className }: { expanded: boolean; className?: string }) {
  return (
    <ChevronRight
      size={12}
      className={`transition-transform duration-150 ${expanded ? "rotate-90" : ""} ${className ?? ""}`}
    />
  );
}

function TreeNode({
  entry,
  depth = 0,
  handle,
}: {
  entry: TreeEntry;
  depth?: number;
  handle: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<TreeEntry[] | null>(entry.children ?? null);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  // Build canonical scoped URL. Sidebar is rendered outside resident scope
  // (on /dashboard, /home, etc.) so it must emit `/@<handle>/<path>` — a bare
  // `/path` would hit the legacy catch-all which only redirects signed-in
  // users with a resolved handle.
  const prefix = handle ? `/@${handle}` : "";
  const scopedPath = `${prefix}/${entry.path}`;
  const isActive = pathname === scopedPath || pathname.startsWith(`${scopedPath}/`);

  const handleToggle = useCallback(async () => {
    if (!entry.isFolder) return;

    if (expanded) {
      setExpanded(false);
      return;
    }

    if (children === null) {
      setLoading(true);
      try {
        const res = await fetch(`/api/list?prefix=${encodeURIComponent(entry.path)}`);
        if (res.ok) {
          const data = await res.json();
          const subfolders = new Set<string>();
          const directNotes: TreeEntry[] = [];

          for (const e of data.entries) {
            const relative = e.path.slice(entry.path.length + 1);
            const slashIndex = relative.indexOf("/");
            if (slashIndex !== -1) {
              subfolders.add(relative.slice(0, slashIndex));
            } else {
              // Direct child note
              directNotes.push({
                name: e.name,
                path: e.path.replace(/\.md$/, ""),
                isFolder: false,
              });
            }
          }

          const folderEntries: TreeEntry[] = [...subfolders].sort().map((name) => ({
            name,
            path: `${entry.path}/${name}`,
            isFolder: true,
          }));

          // Folders first, then notes sorted alphabetically
          setChildren([
            ...folderEntries,
            ...directNotes.sort((a, b) => a.name.localeCompare(b.name)),
          ]);
        }
      } catch {
        // Silently fail — user can retry
      } finally {
        setLoading(false);
      }
    }

    setExpanded(true);
  }, [entry, expanded, children]);

  return (
    <li>
      <div
        className="flex items-center group"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {entry.isFolder ? (
          <>
            <button
              onClick={handleToggle}
              className="flex items-center gap-1.5 py-1.5 pr-2 text-muted hover:text-foreground transition-colors"
              aria-expanded={expanded}
            >
              <ChevronIcon expanded={expanded} className="text-ink/40" />
            </button>
            <Link
              href={scopedPath}
              className={`flex items-center gap-2 flex-1 py-1.5 text-label rounded-md transition-colors truncate ${
                isActive
                  ? "text-foreground font-medium"
                  : "text-muted-light hover:text-foreground"
              }`}
            >
              <FolderIcon className="shrink-0 text-ink/40" />
              <span className="truncate">{entry.name}</span>
            </Link>
          </>
        ) : (
          <Link
            href={scopedPath}
            className={`flex items-center gap-2 flex-1 py-1.5 pl-5 text-label rounded-md transition-colors truncate ${
              isActive
                ? "text-foreground font-medium"
                : "text-muted-light hover:text-foreground"
            }`}
          >
            <span className="truncate">{entry.name}</span>
          </Link>
        )}
      </div>

      {expanded && children && children.length > 0 && (
        <ul>
          {children.map((child) => (
            <TreeNode key={child.path} entry={child} depth={depth + 1} handle={handle} />
          ))}
        </ul>
      )}

      {loading && (
        <div
          className="py-1.5 text-detail text-muted"
          style={{ paddingLeft: `${(depth + 1) * 12 + 28}px` }}
        >
          Loading...
        </div>
      )}
    </li>
  );
}

export default function Sidebar() {
  const { open, close } = useSidebar();
  const [firstVisit, setFirstVisit] = useState(false);
  const [topLevelFolders, setTopLevelFolders] = useState<TreeEntry[] | null>(null);
  const [handle, setHandle] = useState<string | null>(null);

  useEffect(() => {
    const visited = localStorage.getItem("grove_sidebar_hint_shown");
    if (!visited) {
      setFirstVisit(true);
      localStorage.setItem("grove_sidebar_hint_shown", "1");
    }
  }, []);

  // Resolve the current user's canonical handle once — all tree-node hrefs
  // are built as `/@<handle>/<path>` so clicks stay within the scoped routes.
  useEffect(() => {
    async function loadHandle() {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) return;
        const me = (await res.json()) as { handle?: string | null; username?: string | null };
        const h = me.handle ?? me.username ?? null;
        if (h) setHandle(h);
      } catch {
        // Leave handle null — links will fall back to bare paths, and the
        // legacy catch-all will redirect signed-in users.
      }
    }
    loadHandle();
  }, []);

  // Fetch top-level folders from the API — only shows what the user's key can access
  useEffect(() => {
    async function loadFolders() {
      try {
        const res = await fetch("/api/list?prefix=");
        if (!res.ok) return;
        const data = await res.json();

        const folders = new Set<string>();
        for (const entry of data.entries) {
          const slashIndex = entry.path.indexOf("/");
          if (slashIndex !== -1) {
            folders.add(entry.path.slice(0, slashIndex));
          }
        }

        setTopLevelFolders(
          [...folders].sort().map((name) => ({
            name,
            path: name,
            isFolder: true,
          })),
        );
      } catch {
        // Fall back to nothing if fetch fails
      }
    }
    loadFolders();
  }, []);

  return (
    <>
      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-ink/15 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          shrink-0 overflow-hidden transition-all duration-200 ease-out
          lg:relative lg:z-auto
          ${open ? "w-64" : "w-0"}
          max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-30 max-lg:pt-12
          ${open ? "max-lg:w-64" : "max-lg:w-0"}
        `}
        aria-label="Vault navigation"
      >
        <div className="w-64 h-full overflow-y-auto bg-background border-r border-surface-border px-2 py-4">
          {firstVisit && (
            <p className="px-2 pb-3 text-detail text-muted">
              Your table of contents.
            </p>
          )}

          <nav>
            {topLevelFolders === null ? (
              <div className="px-2 py-2 text-detail text-muted">Loading...</div>
            ) : topLevelFolders.length === 0 ? (
              <div className="px-2 py-2 text-detail text-muted">No accessible folders.</div>
            ) : (
              <ul className="space-y-0.5">
                {topLevelFolders.map((entry) => (
                  <TreeNode key={entry.path} entry={entry} handle={handle} />
                ))}
              </ul>
            )}
          </nav>
        </div>
      </aside>
    </>
  );
}
