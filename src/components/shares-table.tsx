"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export interface ShareRow {
  id: string;
  note_path: string;
  url: string;
  created_by: string;
  created_at: string;
  expires_at: string;
  max_views: number | null;
  view_count: number;
  last_accessed_at: string | null;
  revoked_by: string | null;
  revoked_at: string | null;
  status: "active" | "expired" | "revoked";
}

type SortKey = "created_at" | "expires_at" | "view_count" | "note_path" | "status";
type SortDir = "asc" | "desc";

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const past = ms >= 0;
  const abs = Math.abs(ms);
  const sec = Math.floor(abs / 1000);
  if (sec < 60) return past ? "just now" : "in <1m";
  const min = Math.floor(sec / 60);
  if (min < 60) return past ? `${min}m ago` : `in ${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return past ? `${hr}h ago` : `in ${hr}h`;
  const days = Math.floor(hr / 24);
  if (days < 30) return past ? `${days}d ago` : `in ${days}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function viewsLabel(count: number, max: number | null): string {
  return max === null ? `${count} / ∞` : `${count}/${max}`;
}

function extractHandle(url: string): string | null {
  const m = url.match(/\/@([^/]+)\/s\//);
  return m ? m[1]! : null;
}

function noteHref(row: ShareRow): string | null {
  const handle = extractHandle(row.url);
  if (!handle) return null;
  const path = row.note_path.replace(/\.md$/, "");
  return `/@${handle}/${path}`;
}

function statusBadge(status: ShareRow["status"]): string {
  if (status === "active") return "bg-moss/15 text-moss";
  if (status === "expired") return "bg-ink/10 text-ink/50";
  return "bg-harvest/15 text-harvest/80";
}

function shortId(id: string): string {
  return id.length > 10 ? `${id.slice(0, 10)}…` : id;
}

export default function SharesTable({
  initialShares,
}: {
  initialShares: ShareRow[];
}) {
  const [shares, setShares] = useState<ShareRow[]>(initialShares);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [revokeLoading, setRevokeLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const activeCount = useMemo(
    () => shares.filter((s) => s.status === "active").length,
    [shares],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? shares.filter((s) => s.note_path.toLowerCase().includes(q))
      : shares;
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av ?? "").localeCompare(String(bv ?? ""));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [shares, query, sortKey, sortDir]);

  const toggleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir(key === "note_path" ? "asc" : "desc");
      }
    },
    [sortKey],
  );

  const handleCopy = useCallback(async (row: ShareRow) => {
    try {
      await navigator.clipboard.writeText(row.url);
      setCopiedId(row.id);
      setTimeout(() => setCopiedId((cur) => (cur === row.id ? null : cur)), 2000);
    } catch {
      setToast("Couldn't copy to clipboard");
      setTimeout(() => setToast(null), 2500);
    }
  }, []);

  const handleRevoke = useCallback(
    async (row: ShareRow) => {
      setRevokeLoading(row.id);
      const prev = shares;
      const nowIso = new Date().toISOString();
      // Optimistic: mark row revoked immediately.
      setShares((list) =>
        list.map((s) =>
          s.id === row.id
            ? { ...s, status: "revoked", revoked_at: nowIso }
            : s,
        ),
      );
      try {
        const res = await fetch(`/api/admin/share/${encodeURIComponent(row.id)}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          setShares(prev);
          setToast("Revoke failed — try again");
          setTimeout(() => setToast(null), 2500);
        }
      } catch {
        setShares(prev);
        setToast("Revoke failed — try again");
        setTimeout(() => setToast(null), 2500);
      } finally {
        setRevokeLoading(null);
        setConfirmRevoke(null);
      }
    },
    [shares],
  );

  const sortIndicator = useCallback(
    (key: SortKey) => {
      if (sortKey !== key) return "";
      return sortDir === "asc" ? " ↑" : " ↓";
    },
    [sortKey, sortDir],
  );

  return (
    <div data-hydrated={hydrated ? "true" : "false"} data-testid="shares-root">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="font-serif text-title font-medium tracking-[-0.015em]">
          Shares
        </h1>
        <p className="text-sm text-ink/60" data-testid="shares-active-count">
          {activeCount} active
        </p>
      </div>

      {shares.length === 0 ? (
        <p className="text-sm text-ink/60" data-testid="shares-empty">
          No shares yet. Open any note and click Share in its header.
        </p>
      ) : (
        <>
          <div className="mb-4">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by note path"
              aria-label="Search shares by note path"
              className="w-full bg-white border border-ink/15 rounded px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/15 transition-colors"
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-surface-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface/50">
                  <SortHeader
                    label="Note"
                    active={sortKey === "note_path"}
                    indicator={sortIndicator("note_path")}
                    onClick={() => toggleSort("note_path")}
                  />
                  <th className="text-left px-4 py-2.5 text-xs uppercase tracking-[0.1em] text-muted font-medium hidden sm:table-cell">
                    Link
                  </th>
                  <SortHeader
                    label="Status"
                    active={sortKey === "status"}
                    indicator={sortIndicator("status")}
                    onClick={() => toggleSort("status")}
                  />
                  <SortHeader
                    label="Created"
                    active={sortKey === "created_at"}
                    indicator={sortIndicator("created_at")}
                    onClick={() => toggleSort("created_at")}
                    className="hidden md:table-cell"
                  />
                  <SortHeader
                    label="Expires"
                    active={sortKey === "expires_at"}
                    indicator={sortIndicator("expires_at")}
                    onClick={() => toggleSort("expires_at")}
                    className="hidden md:table-cell"
                  />
                  <SortHeader
                    label="Views"
                    active={sortKey === "view_count"}
                    indicator={sortIndicator("view_count")}
                    onClick={() => toggleSort("view_count")}
                    className="hidden lg:table-cell"
                  />
                  <th className="text-right px-4 py-2.5 text-xs uppercase tracking-[0.1em] text-muted font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-muted"
                      data-testid="shares-no-match"
                    >
                      No shares match “{query}”.
                    </td>
                  </tr>
                )}
                {visible.map((row) => {
                  const muted = row.status !== "active";
                  const href = noteHref(row);
                  return (
                    <tr
                      key={row.id}
                      data-testid={`share-row-${row.id}`}
                      data-status={row.status}
                      className={[
                        "border-b border-surface-border last:border-b-0 transition-colors",
                        muted ? "text-ink/40 bg-surface/30" : "hover:bg-surface/30 text-foreground",
                      ].join(" ")}
                    >
                      <td className="px-4 py-3 font-medium max-w-[14rem] truncate">
                        {href ? (
                          <a
                            href={href}
                            className={muted ? "hover:underline" : "text-ink hover:underline"}
                            title={row.note_path}
                          >
                            {row.note_path}
                          </a>
                        ) : (
                          <span title={row.note_path}>{row.note_path}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <code className="font-mono text-xs">{shortId(row.id)}</code>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            "inline-flex items-center text-xs px-2 py-0.5 rounded",
                            statusBadge(row.status),
                          ].join(" ")}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {relativeTime(row.created_at)}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {relativeTime(row.expires_at)}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {viewsLabel(row.view_count, row.max_views)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {confirmRevoke === row.id ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="text-xs text-ink/60">
                              Revoke? Link stops working.
                            </span>
                            <button
                              onClick={() => handleRevoke(row)}
                              disabled={revokeLoading === row.id}
                              className="text-xs text-harvest font-medium hover:underline disabled:opacity-50"
                              data-testid={`confirm-revoke-${row.id}`}
                            >
                              Revoke
                            </button>
                            <button
                              onClick={() => setConfirmRevoke(null)}
                              className="text-xs text-ink/60 hover:text-ink"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-3">
                            <button
                              onClick={() => handleCopy(row)}
                              className="text-xs text-moss hover:text-moss/60 transition-colors"
                              data-testid={`copy-${row.id}`}
                            >
                              {copiedId === row.id ? "Copied!" : "Copy"}
                            </button>
                            {row.status === "active" && (
                              <button
                                onClick={() => setConfirmRevoke(row.id)}
                                className="text-xs text-harvest hover:text-harvest/60 transition-colors"
                                data-testid={`revoke-${row.id}`}
                              >
                                Revoke
                              </button>
                            )}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {toast && (
        <div
          role="alert"
          data-testid="shares-toast"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-cream text-sm px-4 py-2 rounded-lg shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function SortHeader({
  label,
  active,
  indicator,
  onClick,
  className = "",
}: {
  label: string;
  active: boolean;
  indicator: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <th
      className={[
        "text-left px-4 py-2.5 text-xs uppercase tracking-[0.1em] text-muted font-medium",
        className,
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onClick}
        className={[
          "inline-flex items-center gap-1 hover:text-ink transition-colors",
          active ? "text-ink" : "",
        ].join(" ")}
      >
        <span>{label}</span>
        <span aria-hidden="true" className="text-[10px]">
          {indicator}
        </span>
      </button>
    </th>
  );
}
