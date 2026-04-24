"use client";

import { useCallback, useState } from "react";
import { Button } from "./primitives/button";
import { useScopedLink } from "@/hooks/use-scoped-link";

interface UserMeta {
  id: string;
  username: string | null;
  email: string | null;
  role: string;
  created_at: string;
  last_login_at: string | null;
  key_count: number;
  trails: string[];
}

interface Trail {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
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

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    owner: "bg-earth text-cream",
    member: "bg-moss/15 text-moss",
    viewer: "bg-surface text-muted",
  };
  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-detail font-medium ${colors[role] ?? colors.viewer}`}>
      {role}
    </span>
  );
}

export default function MemberTable({
  initialUsers,
  trails,
  onRowClick,
}: {
  initialUsers: UserMeta[];
  trails: Trail[];
  onRowClick?: (userId: string) => void;
}) {
  const { vaultSlug } = useScopedLink();
  const [users, setUsers] = useState(initialUsers);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  // Default scope: "vault" when the user is inside a scoped route (most of the
  // time). "trail" is still available for narrowing invites to a single trail.
  // If there are zero trails, scope is always "vault" and the Scope selector
  // is hidden.
  const [inviteScope, setInviteScope] = useState<"vault" | "trail">("vault");
  const [inviteTrail, setInviteTrail] = useState(trails[0]?.id ?? "");
  const [inviteRole, setInviteRole] = useState<"viewer" | "member">("viewer");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const refreshUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
  }, []);

  const handleInvite = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    setInviteLoading(true);

    try {
      // Two invite shapes per /v1/admin/invite: `{email, trail_id, role}` to
      // grant access to a single trail, `{email, vault, role}` to add the
      // user to the vault's member list.
      const payload =
        inviteScope === "vault" && vaultSlug
          ? { email: inviteEmail.trim(), vault: vaultSlug, role: inviteRole }
          : { email: inviteEmail.trim(), trail_id: inviteTrail, role: inviteRole };

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Invite failed" }));
        setInviteError(data.error ?? "Invite failed");
        return;
      }

      setInviteEmail("");
      setShowInvite(false);
      await refreshUsers();
    } catch {
      setInviteError("Network error");
    } finally {
      setInviteLoading(false);
    }
  }, [inviteEmail, inviteScope, inviteTrail, inviteRole, vaultSlug, refreshUsers]);

  const handleDelete = useCallback(async (userId: string) => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } finally {
      setDeleteLoading(false);
      setConfirmDelete(null);
    }
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-title font-medium tracking-[-0.015em]">Members</h1>
        <Button onClick={() => setShowInvite(!showInvite)} size="sm">
          {showInvite ? "Cancel" : "Invite"}
        </Button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <form
          onSubmit={handleInvite}
          className="mb-6 rounded-lg border border-surface-border bg-surface/60 p-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-end">
            <div>
              <label htmlFor="invite-email" className="block text-detail uppercase tracking-[0.1em] text-muted mb-1">
                Email
              </label>
              <input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                required
                autoFocus
                className="w-full bg-cream border border-ink/15 rounded-md px-3 py-2 text-label text-foreground placeholder:text-muted focus:outline-none focus:border-moss transition-colors"
              />
            </div>

            <div>
              <label htmlFor="invite-scope" className="block text-detail uppercase tracking-[0.1em] text-muted mb-1">
                Scope
              </label>
              <select
                id="invite-scope"
                value={inviteScope}
                onChange={(e) => setInviteScope(e.target.value as "vault" | "trail")}
                disabled={!vaultSlug && trails.length === 0}
                className="bg-cream border border-ink/15 rounded-md px-3 py-2 text-label text-foreground focus:outline-none focus:border-moss transition-colors"
              >
                {vaultSlug && <option value="vault">Full vault</option>}
                {trails.length > 0 && <option value="trail">Trail</option>}
              </select>
            </div>

            {inviteScope === "trail" && trails.length > 0 && (
              <div>
                <label htmlFor="invite-trail" className="block text-detail uppercase tracking-[0.1em] text-muted mb-1">
                  Trail
                </label>
                <select
                  id="invite-trail"
                  value={inviteTrail}
                  onChange={(e) => setInviteTrail(e.target.value)}
                  className="bg-cream border border-ink/15 rounded-md px-3 py-2 text-label text-foreground focus:outline-none focus:border-moss transition-colors"
                >
                  {trails.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-detail uppercase tracking-[0.1em] text-muted mb-1">
                Role
              </label>
              <div className="flex items-center gap-3 py-2">
                <label className="flex items-center gap-1.5 text-label cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="viewer"
                    checked={inviteRole === "viewer"}
                    onChange={() => setInviteRole("viewer")}
                    className="accent-moss"
                  />
                  Viewer
                </label>
                <label className="flex items-center gap-1.5 text-label cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="member"
                    checked={inviteRole === "member"}
                    onChange={() => setInviteRole("member")}
                    className="accent-moss"
                  />
                  Member
                </label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={
                !inviteEmail ||
                (inviteScope === "trail" && !inviteTrail) ||
                (inviteScope === "vault" && !vaultSlug)
              }
              loading={inviteLoading}
              loadingLabel="Sending…"
              size="sm"
              className="whitespace-nowrap"
            >
              Send invite
            </Button>
          </div>

          {inviteError && (
            <p className="text-label text-harvest mt-2">{inviteError}</p>
          )}
        </form>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-surface-border">
        <table className="w-full text-label">
          <thead>
            <tr className="border-b border-surface-border bg-surface/60">
              <th className="text-left px-6 py-2.5 text-detail uppercase tracking-[0.1em] text-muted font-medium">Email</th>
              <th className="text-left px-6 py-2.5 text-detail uppercase tracking-[0.1em] text-muted font-medium">Role</th>
              <th className="text-left px-6 py-2.5 text-detail uppercase tracking-[0.1em] text-muted font-medium hidden sm:table-cell">Last login</th>
              <th className="text-left px-6 py-2.5 text-detail uppercase tracking-[0.1em] text-muted font-medium hidden md:table-cell">Trails</th>
              <th className="text-left px-6 py-2.5 text-detail uppercase tracking-[0.1em] text-muted font-medium hidden md:table-cell">Keys</th>
              <th className="text-right px-6 py-2.5 text-detail uppercase tracking-[0.1em] text-muted font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                onClick={onRowClick ? () => onRowClick(user.id) : undefined}
                className={[
                  "border-b border-surface-border last:border-b-0 hover:bg-surface/40 transition-colors",
                  onRowClick ? "cursor-pointer" : "",
                ].join(" ")}
              >
                <td className="px-6 py-3 text-foreground">
                  {user.email ?? user.username ?? user.id}
                </td>
                <td className="px-6 py-3">
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-6 py-3 text-muted hidden sm:table-cell">
                  {relativeTime(user.last_login_at)}
                </td>
                <td className="px-6 py-3 text-muted hidden md:table-cell">
                  {user.trails.length > 0 ? user.trails.join(", ") : "\u2014"}
                </td>
                <td className="px-6 py-3 text-muted hidden md:table-cell">
                  {user.key_count}
                </td>
                <td
                  className="px-6 py-3 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  {user.role !== "owner" && (
                    <>
                      {confirmDelete === user.id ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="text-detail text-muted">Sure?</span>
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={deleteLoading}
                            className="text-detail text-harvest font-medium hover:underline disabled:opacity-50"
                          >
                            Remove
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-detail text-muted hover:text-foreground"
                          >
                            No
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(user.id)}
                          className="text-detail text-muted hover:text-harvest transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted">
                  No members yet. Invite someone to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
