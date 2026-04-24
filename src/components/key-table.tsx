"use client";

import { useState, useCallback } from "react";
import { Button } from "./primitives/button";
import { RelativeTime } from "./primitives/relative-time";

interface KeyMeta {
  id: string;
  name: string;
  scopes: string | string[];
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

function ScopeBadge({ scope }: { scope: string }) {
  return (
    <span className="inline-flex items-center bg-moss/15 text-moss text-detail px-2 py-0.5 rounded-md">
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
          <Button onClick={() => setShowCreate(true)} size="lg">
            Create key
          </Button>
        )}
      </div>

      {/* New token reveal */}
      {newToken && (
        <div className="mb-6 rounded-lg border border-surface-border bg-surface/60 p-6">
          <p className="text-label font-medium text-foreground mb-1">Key created</p>
          <p className="text-detail text-harvest mb-3">Save this now — it won&apos;t be shown again.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-surface font-mono text-label p-3 rounded-md break-all">
              {newToken}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 text-label text-moss hover:text-moss/60 transition-colors font-medium"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button
            onClick={handleDismissToken}
            className="mt-3 text-detail text-muted hover:text-foreground transition-colors"
          >
            Done, I&apos;ve saved it
          </button>
        </div>
      )}

      {/* Create form */}
      {showCreate && !newToken && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-lg border border-surface-border bg-surface/60 p-6"
        >
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label
                htmlFor="key-name"
                className="block text-detail uppercase tracking-[0.1em] text-muted mb-1"
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
                className="w-full bg-cream border border-ink/15 rounded-md px-3 py-2 text-label text-foreground placeholder:text-muted focus:outline-none focus:border-moss transition-colors"
              />
            </div>
            <Button
              type="submit"
              disabled={!createName.trim()}
              loading={createLoading}
              loadingLabel="Creating…"
              size="sm"
              className="whitespace-nowrap"
            >
              Create
            </Button>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setCreateName("");
                setCreateError("");
              }}
              className="text-label text-muted hover:text-foreground transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
          </div>
          {createError && <p className="text-label text-harvest mt-2">{createError}</p>}
        </form>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-surface-border">
        <table className="w-full text-label">
          <thead>
            <tr className="border-b border-surface-border bg-surface/60">
              <th className="text-left px-6 py-2.5 text-detail uppercase tracking-[0.1em] text-muted font-medium">
                Name
              </th>
              <th className="text-left px-6 py-2.5 text-detail uppercase tracking-[0.1em] text-muted font-medium hidden sm:table-cell">
                Scopes
              </th>
              <th className="text-left px-6 py-2.5 text-detail uppercase tracking-[0.1em] text-muted font-medium hidden md:table-cell">
                Created
              </th>
              <th className="text-left px-6 py-2.5 text-detail uppercase tracking-[0.1em] text-muted font-medium hidden md:table-cell">
                Last used
              </th>
              <th className="text-left px-6 py-2.5 text-detail uppercase tracking-[0.1em] text-muted font-medium hidden lg:table-cell">
                Expires
              </th>
              <th className="text-right px-6 py-2.5 text-detail uppercase tracking-[0.1em] text-muted font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr
                key={key.id}
                className="border-b border-surface-border last:border-b-0 hover:bg-surface/40 transition-colors"
              >
                <td className="px-6 py-3 text-foreground font-medium">{key.name}</td>
                <td className="px-6 py-3 hidden sm:table-cell">
                  {key.scopes ? (
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(key.scopes) ? key.scopes : key.scopes.split(",")).map((s) => (
                        <ScopeBadge key={s} scope={s} />
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted">&mdash;</span>
                  )}
                </td>
                <td className="px-6 py-3 text-muted hidden md:table-cell">
                  <RelativeTime iso={key.created_at} />
                </td>
                <td className="px-6 py-3 text-muted hidden md:table-cell">
                  <RelativeTime iso={key.last_used_at} />
                </td>
                <td className="px-6 py-3 text-muted hidden lg:table-cell">
                  <RelativeTime iso={key.expires_at} />
                </td>
                <td className="px-6 py-3 text-right">
                  {confirmRevoke === key.id ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="text-detail text-muted">Sure?</span>
                      <button
                        onClick={() => handleRevoke(key.id)}
                        disabled={revokeLoading}
                        className="text-detail text-harvest font-medium hover:underline disabled:opacity-50"
                      >
                        Revoke
                      </button>
                      <button
                        onClick={() => setConfirmRevoke(null)}
                        className="text-detail text-muted hover:text-foreground"
                      >
                        No
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmRevoke(key.id)}
                      className="text-detail text-harvest hover:text-harvest/60 transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted">
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
