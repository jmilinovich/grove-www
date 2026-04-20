"use client";

import { useState, useCallback } from "react";

interface KeyMeta {
  id: string;
  name: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

function relativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ScopeBadge({ scope }: { scope: string }) {
  return (
    <span className="inline-flex items-center bg-moss/15 text-moss text-xs px-2 py-0.5 rounded">
      {scope}
    </span>
  );
}

export default function KeyTable({ initialKeys }: { initialKeys: KeyMeta[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);

  const refreshKeys = useCallback(async () => {
    const res = await fetch("/api/admin/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "list" }),
    });
    if (res.ok) {
      const data = await res.json();
      setKeys(data.keys ?? []);
    }
  }, []);

  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setCreateError("");
      setCreateLoading(true);

      try {
        const res = await fetch("/api/admin/keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create", name: createName.trim() }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Create failed" }));
          setCreateError(data.error ?? "Create failed");
          return;
        }

        const data = await res.json();
        setNewToken(data.token ?? null);
        setCreateName("");
        await refreshKeys();
      } catch {
        setCreateError("Network error");
      } finally {
        setCreateLoading(false);
      }
    },
    [createName, refreshKeys]
  );

  const handleRevoke = useCallback(async (keyId: string) => {
    setRevokeLoading(true);
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke", id: keyId }),
      });
      if (res.ok) {
        setKeys((prev) => prev.filter((k) => k.id !== keyId));
      }
    } finally {
      setRevokeLoading(false);
      setConfirmRevoke(null);
    }
  }, []);

  const handleCopy = useCallback(async () => {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [newToken]);

  const handleDismissToken = useCallback(() => {
    setNewToken(null);
    setCopied(false);
    setShowCreate(false);
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-title font-medium tracking-[-0.015em]">API Keys</h1>
        {!showCreate && !newToken && (
          <button
            onClick={() => setShowCreate(true)}
            className="bg-ink text-cream rounded px-7 py-3.5 text-sm font-medium hover:bg-earth transition-colors active:scale-[0.98]"
          >
            Create key
          </button>
        )}
      </div>

      {/* New token reveal */}
      {newToken && (
        <div className="mb-6 rounded-lg border border-surface-border bg-surface/50 p-4">
          <p className="text-sm font-medium text-foreground mb-1">Key created</p>
          <p className="text-xs text-harvest mb-3">Save this now — it won&apos;t be shown again.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-surface font-mono text-sm p-3 rounded break-all">
              {newToken}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 text-sm text-moss hover:text-moss/60 transition-colors font-medium"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button
            onClick={handleDismissToken}
            className="mt-3 text-xs text-muted hover:text-foreground transition-colors"
          >
            Done, I&apos;ve saved it
          </button>
        </div>
      )}

      {/* Create form */}
      {showCreate && !newToken && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-lg border border-surface-border bg-surface/50 p-4"
        >
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label
                htmlFor="key-name"
                className="block text-xs uppercase tracking-[0.1em] text-muted mb-1"
              >
                Key name
              </label>
              <input
                id="key-name"
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. claude-desktop"
                required
                autoFocus
                className="w-full bg-white border border-ink/15 rounded px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/15 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={createLoading || !createName.trim()}
              className="bg-ink text-cream rounded px-4 py-2 text-sm font-medium hover:bg-earth transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {createLoading ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setCreateName("");
                setCreateError("");
              }}
              className="text-sm text-muted hover:text-foreground transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
          </div>
          {createError && <p className="text-sm text-harvest mt-2">{createError}</p>}
        </form>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-surface-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-surface/50">
              <th className="text-left px-4 py-2.5 text-xs uppercase tracking-[0.1em] text-muted font-medium">
                Name
              </th>
              <th className="text-left px-4 py-2.5 text-xs uppercase tracking-[0.1em] text-muted font-medium hidden sm:table-cell">
                Scopes
              </th>
              <th className="text-left px-4 py-2.5 text-xs uppercase tracking-[0.1em] text-muted font-medium hidden md:table-cell">
                Created
              </th>
              <th className="text-left px-4 py-2.5 text-xs uppercase tracking-[0.1em] text-muted font-medium hidden md:table-cell">
                Last used
              </th>
              <th className="text-left px-4 py-2.5 text-xs uppercase tracking-[0.1em] text-muted font-medium hidden lg:table-cell">
                Expires
              </th>
              <th className="text-right px-4 py-2.5 text-xs uppercase tracking-[0.1em] text-muted font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr
                key={key.id}
                className="border-b border-surface-border last:border-b-0 hover:bg-surface/30 transition-colors"
              >
                <td className="px-4 py-3 text-foreground font-medium">{key.name}</td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  {key.scopes.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {key.scopes.map((s) => (
                        <ScopeBadge key={s} scope={s} />
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted">&mdash;</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted hidden md:table-cell">
                  {relativeTime(key.created_at)}
                </td>
                <td className="px-4 py-3 text-muted hidden md:table-cell">
                  {relativeTime(key.last_used_at)}
                </td>
                <td className="px-4 py-3 text-muted hidden lg:table-cell">
                  {key.expires_at ? relativeTime(key.expires_at) : "Never"}
                </td>
                <td className="px-4 py-3 text-right">
                  {confirmRevoke === key.id ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="text-xs text-muted">Sure?</span>
                      <button
                        onClick={() => handleRevoke(key.id)}
                        disabled={revokeLoading}
                        className="text-xs text-harvest font-medium hover:underline disabled:opacity-50"
                      >
                        Revoke
                      </button>
                      <button
                        onClick={() => setConfirmRevoke(null)}
                        className="text-xs text-muted hover:text-foreground"
                      >
                        No
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmRevoke(key.id)}
                      className="text-xs text-harvest hover:text-harvest/60 transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No API keys. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
