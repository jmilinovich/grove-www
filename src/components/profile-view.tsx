"use client";

import { useState, useCallback } from "react";

interface TrailSummary {
  id: string;
  name: string;
  description: string;
}

interface KeySummary {
  id: string;
  name: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
}

interface SessionSummary {
  id: string;
  user_agent: string | null;
  created_at: string;
  last_used_at: string | null;
  expires_at: string;
  is_current: boolean;
}

export interface Profile {
  id: string;
  username: string | null;
  email: string | null;
  role: string;
  display_name: string | null;
  trails: TrailSummary[];
  keys: KeySummary[];
  sessions: SessionSummary[];
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

function describeClient(ua: string | null): string {
  if (!ua) return "Unknown device";
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Android/.test(ua)) return "Android";
  if (/Mac OS X/.test(ua)) return /Safari/.test(ua) && !/Chrome/.test(ua) ? "Safari on Mac" : "Chrome on Mac";
  if (/Windows/.test(ua)) return "Windows";
  if (/Linux/.test(ua)) return "Linux";
  if (/curl|node|python|grove-cli/i.test(ua)) return ua.split(/\s+/)[0] ?? ua;
  return ua.slice(0, 60);
}

export default function ProfileView({ initialProfile }: { initialProfile: Profile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [nameInput, setNameInput] = useState(initialProfile.display_name ?? "");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameStatus, setNameStatus] = useState<"idle" | "saved" | "error">("idle");
  const [busySessionId, setBusySessionId] = useState<string | null>(null);
  const [signOutAllBusy, setSignOutAllBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveName = useCallback(async () => {
    setNameSaving(true);
    setNameStatus("idle");
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: nameInput || null }),
      });
      if (!res.ok) {
        setNameStatus("error");
        return;
      }
      const data = (await res.json()) as Profile;
      setProfile((p) => ({ ...p, display_name: data.display_name }));
      setNameInput(data.display_name ?? "");
      setNameStatus("saved");
    } catch {
      setNameStatus("error");
    } finally {
      setNameSaving(false);
    }
  }, [nameInput]);

  const revokeSession = useCallback(async (sessionId: string) => {
    setBusySessionId(sessionId);
    setError(null);
    try {
      const res = await fetch(`/api/me/sessions/${encodeURIComponent(sessionId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setError("Could not revoke session");
        return;
      }
      setProfile((p) => ({ ...p, sessions: p.sessions.filter((s) => s.id !== sessionId) }));
    } catch {
      setError("Network error");
    } finally {
      setBusySessionId(null);
    }
  }, []);

  const signOutAll = useCallback(async () => {
    setSignOutAllBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/me/sessions", { method: "DELETE" });
      if (!res.ok) {
        setError("Could not sign out other sessions");
        return;
      }
      setProfile((p) => ({ ...p, sessions: p.sessions.filter((s) => s.is_current) }));
    } catch {
      setError("Network error");
    } finally {
      setSignOutAllBusy(false);
    }
  }, []);

  const nameChanged = (nameInput || "") !== (profile.display_name ?? "");
  const otherSessions = profile.sessions.filter((s) => !s.is_current);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Profile</h1>
        <p className="text-sm text-ink/60 mt-1">Manage your identity and access to Grove.</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-ink/60 uppercase tracking-wide">Identity</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-ink/50 mb-1">Email</label>
            <div className="text-sm text-ink">{profile.email ?? "—"}</div>
          </div>
          <div>
            <label className="block text-xs text-ink/50 mb-1">Role</label>
            <div className="text-sm text-ink capitalize">{profile.role}</div>
          </div>
          <div>
            <label className="block text-xs text-ink/50 mb-1" htmlFor="display-name">Display name</label>
            <div className="flex gap-2 items-center">
              <input
                id="display-name"
                type="text"
                value={nameInput}
                onChange={(e) => { setNameInput(e.target.value); setNameStatus("idle"); }}
                placeholder="Your name"
                maxLength={100}
                className="flex-1 max-w-sm px-3 py-1.5 text-sm bg-surface border border-surface-border rounded text-ink focus:outline-none focus:border-moss"
              />
              <button
                type="button"
                onClick={saveName}
                disabled={nameSaving || !nameChanged}
                className="px-3 py-1.5 text-sm bg-moss text-cream rounded hover:bg-moss/90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {nameSaving ? "Saving…" : "Save"}
              </button>
              {nameStatus === "saved" && <span className="text-xs text-moss">Saved</span>}
              {nameStatus === "error" && <span className="text-xs text-rust">Could not save</span>}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-ink/60 uppercase tracking-wide">Sessions</h2>
          {otherSessions.length > 0 && (
            <button
              type="button"
              onClick={signOutAll}
              disabled={signOutAllBusy}
              className="text-xs text-rust hover:underline disabled:opacity-40"
            >
              {signOutAllBusy ? "Signing out…" : "Sign out of all other sessions"}
            </button>
          )}
        </div>
        {error && <div className="text-xs text-rust">{error}</div>}
        {profile.sessions.length === 0 ? (
          <div className="text-sm text-ink/50">No active sessions.</div>
        ) : (
          <ul className="divide-y divide-surface-border border border-surface-border rounded">
            {profile.sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm text-ink flex items-center gap-2">
                    <span>{describeClient(s.user_agent)}</span>
                    {s.is_current && (
                      <span className="text-xs bg-moss/15 text-moss px-1.5 py-0.5 rounded">This device</span>
                    )}
                  </div>
                  <div className="text-xs text-ink/50 mt-0.5">
                    Last active {relativeTime(s.last_used_at ?? s.created_at)} · Signed in {relativeTime(s.created_at)}
                  </div>
                </div>
                {!s.is_current && (
                  <button
                    type="button"
                    onClick={() => revokeSession(s.id)}
                    disabled={busySessionId === s.id}
                    className="text-xs text-rust hover:underline disabled:opacity-40 ml-4 shrink-0"
                  >
                    {busySessionId === s.id ? "Signing out…" : "Sign out"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-ink/60 uppercase tracking-wide">API keys</h2>
        {profile.keys.length === 0 ? (
          <div className="text-sm text-ink/50">No API keys.</div>
        ) : (
          <ul className="divide-y divide-surface-border border border-surface-border rounded">
            {profile.keys.map((k) => (
              <li key={k.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm text-ink truncate">{k.name}</div>
                  <div className="text-xs text-ink/50 mt-0.5">
                    {k.scopes.filter(Boolean).join(" · ")} · Last used {relativeTime(k.last_used_at)}
                  </div>
                </div>
                <a href="/dashboard/keys" className="text-xs text-moss hover:underline ml-4 shrink-0">
                  Manage
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-ink/60 uppercase tracking-wide">Trail access</h2>
        {profile.trails.length === 0 ? (
          <div className="text-sm text-ink/50">No trails.</div>
        ) : (
          <ul className="divide-y divide-surface-border border border-surface-border rounded">
            {profile.trails.map((t) => (
              <li key={t.id} className="px-4 py-3">
                <div className="text-sm text-ink">{t.name}</div>
                {t.description && <div className="text-xs text-ink/50 mt-0.5">{t.description}</div>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
