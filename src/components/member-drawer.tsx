"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RelativeTime } from "./primitives/relative-time";

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

export default function MemberDrawer({ memberId }: { memberId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("member");
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?");
  }, [router, searchParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/admin/users")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        if (cancelled) return;
        const found = (data.users as UserMeta[] | undefined)?.find(
          (u) => u.id === memberId,
        );
        if (!found) setError("Member not found");
        else setUser(found);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load member");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [close]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Member details"
      className="fixed inset-0 z-50 flex justify-end"
    >
      <div
        onClick={close}
        className="absolute inset-0 bg-ink/15"
        aria-hidden="true"
      />
      <aside className="relative w-full max-w-md bg-background border-l border-surface-border overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="font-serif text-heading font-medium">Member</h2>
          <button
            onClick={close}
            aria-label="Close"
            className="text-muted hover:text-foreground text-label"
          >
            Close
          </button>
        </div>
        <div className="px-6 py-6 space-y-4">
          {loading && <p className="text-label text-muted">Loading…</p>}
          {error && <p className="text-label text-harvest">{error}</p>}
          {user && (
            <dl className="space-y-3 text-label">
              <div>
                <dt className="text-detail uppercase tracking-[0.1em] text-muted">Email</dt>
                <dd className="text-foreground">{user.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-detail uppercase tracking-[0.1em] text-muted">Handle</dt>
                <dd className="text-foreground">{user.username ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-detail uppercase tracking-[0.1em] text-muted">Role</dt>
                <dd className="text-foreground">{user.role}</dd>
              </div>
              <div>
                <dt className="text-detail uppercase tracking-[0.1em] text-muted">Last login</dt>
                <dd className="text-foreground"><RelativeTime iso={user.last_login_at} /></dd>
              </div>
              <div>
                <dt className="text-detail uppercase tracking-[0.1em] text-muted">Joined</dt>
                <dd className="text-foreground"><RelativeTime iso={user.created_at} /></dd>
              </div>
              <div>
                <dt className="text-detail uppercase tracking-[0.1em] text-muted">Keys</dt>
                <dd className="text-foreground">{user.key_count}</dd>
              </div>
              <div>
                <dt className="text-detail uppercase tracking-[0.1em] text-muted">Trails</dt>
                <dd className="text-foreground">
                  {user.trails.length > 0 ? user.trails.join(", ") : "—"}
                </dd>
              </div>
            </dl>
          )}
        </div>
      </aside>
    </div>
  );
}
