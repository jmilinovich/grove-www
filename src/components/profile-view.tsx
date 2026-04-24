"use client";

import { useState, useCallback } from "react";
import HandleEditor from "./handle-editor";
import { Button } from "./primitives/button";
import { useScopedLink } from "@/hooks/use-scoped-link";

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
  handle: string | null;
  email: string | null;
  role: string;
  display_name: string | null;
  bio: string | null;
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
  const { link } = useScopedLink();
  const [profile, setProfile] = useState(initialProfile);
  const [nameInput, setNameInput] = useState(initialProfile.display_name ?? "");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameStatus, setNameStatus] = useState<"idle" | "saved" | "error">("idle");
  const [bioInput, setBioInput] = useState(initialProfile.bio ?? "");
  const [bioSaving, setBioSaving] = useState(false);
  const [bioStatus, setBioStatus] = useState<"idle" | "saved" | "error">("idle");
  const [bioError, setBioError] = useState<string | null>(null);
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
      const data = (await res.json()) as { display_name?: string | null };
      setProfile((p) => ({ ...p, display_name: data.display_name ?? null }));
      setNameInput(data.display_name ?? "");
      setNameStatus("saved");
    } catch {
      setNameStatus("error");
    } finally {
      setNameSaving(false);
    }
  }, [nameInput]);

  const saveBio = useCallback(async () => {
    const value = bioInput.trim();
    if (value.length > 280) {
      setBioError("Bio must be 280 characters or fewer.");
      setBioStatus("error");
      return;
    }
    setBioSaving(true);
    setBioStatus("idle");
    setBioError(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: value || null }),
      });
      const data = (await res.json().catch(() => ({}))) as { bio?: string | null; error?: string };
      if (!res.ok) {
        setBioError(data.error ?? "Could not save bio.");
        setBioStatus("error");
        return;
      }
      const savedBio = data.bio ?? null;
      setProfile((p) => ({ ...p, bio: savedBio }));
      setBioInput(savedBio ?? "");
      setBioStatus("saved");
    } catch {
      setBioError("Network error.");
      setBioStatus("error");
    } finally {
      setBioSaving(false);
    }
  }, [bioInput]);

  const onHandleChanged = useCallback((newHandle: string) => {
    setProfile((p) => ({ ...p, username: newHandle, handle: newHandle }));
  }, []);

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
  const bioChanged = (bioInput || "") !== (profile.bio ?? "");
  const otherSessions = profile.sessions.filter((s) => !s.is_current);
  const currentHandle = profile.handle ?? profile.username ?? "";

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-serif text-heading font-medium text-ink">Profile</h1>
        <p className="text-label text-ink/60 mt-1">Manage your identity and access to Grove.</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-label font-medium text-ink/60 uppercase tracking-wide">Identity</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-detail text-ink/60 mb-1">Email</label>
            <div className="text-label text-ink">{profile.email ?? "—"}</div>
          </div>
          <div>
            <label className="block text-detail text-ink/60 mb-1">Role</label>
            <div className="text-label text-ink capitalize">{profile.role}</div>
          </div>
          {currentHandle && (
            <HandleEditor currentHandle={currentHandle} onChanged={onHandleChanged} />
          )}
          <div>
            <label className="block text-detail text-ink/60 mb-1" htmlFor="display-name">Display name</label>
            <div className="flex gap-2 items-center">
              <input
                id="display-name"
                type="text"
                value={nameInput}
                onChange={(e) => { setNameInput(e.target.value); setNameStatus("idle"); }}
                placeholder="Your name"
                maxLength={100}
                className="flex-1 max-w-sm px-3 py-1.5 text-label bg-surface border border-surface-border rounded-md text-ink focus:outline-none focus:border-moss"
              />
              <Button
                type="button"
                onClick={saveName}
                disabled={!nameChanged}
                loading={nameSaving}
                loadingLabel="Saving…"
                size="sm"
              >
                Save
              </Button>
              {nameStatus === "saved" && <span className="text-detail text-moss">Saved</span>}
              {nameStatus === "error" && <span className="text-detail text-harvest">Could not save</span>}
            </div>
          </div>
          <div>
            <label className="block text-detail text-ink/60 mb-1" htmlFor="bio">Bio</label>
            <div className="flex flex-col gap-2 max-w-xl">
              <textarea
                id="bio"
                value={bioInput}
                onChange={(e) => {
                  setBioInput(e.target.value);
                  setBioStatus("idle");
                  setBioError(null);
                }}
                placeholder="A short description (280 characters max)"
                maxLength={280}
                rows={3}
                className="w-full px-3 py-1.5 text-label bg-surface border border-surface-border rounded-md text-ink focus:outline-none focus:border-moss resize-y"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={saveBio}
                  disabled={!bioChanged}
                  loading={bioSaving}
                  loadingLabel="Saving…"
                  size="sm"
                >
                  Save
                </Button>
                <span className="text-detail text-ink/60">{bioInput.length}/280</span>
                {bioStatus === "saved" && <span className="text-detail text-moss">Saved</span>}
                {bioStatus === "error" && <span className="text-detail text-harvest">{bioError ?? "Could not save"}</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-label font-medium text-ink/60 uppercase tracking-wide">Sessions</h2>
          {otherSessions.length > 0 && (
            <button
              type="button"
              onClick={signOutAll}
              disabled={signOutAllBusy}
              className="text-detail text-harvest hover:underline disabled:opacity-40"
            >
              {signOutAllBusy ? "Signing out…" : "Sign out of all other sessions"}
            </button>
          )}
        </div>
        {error && <div className="text-detail text-harvest">{error}</div>}
        {profile.sessions.length === 0 ? (
          <div className="text-label text-ink/60">No active sessions.</div>
        ) : (
          <ul className="divide-y divide-surface-border border border-surface-border rounded-md">
            {profile.sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <div className="text-label text-ink flex items-center gap-2">
                    <span>{describeClient(s.user_agent)}</span>
                    {s.is_current && (
                      <span className="text-detail bg-moss/15 text-moss px-1.5 py-0.5 rounded-md">This device</span>
                    )}
                  </div>
                  <div className="text-detail text-ink/60 mt-0.5">
                    Last active {relativeTime(s.last_used_at ?? s.created_at)} · Signed in {relativeTime(s.created_at)}
                  </div>
                </div>
                {!s.is_current && (
                  <button
                    type="button"
                    onClick={() => revokeSession(s.id)}
                    disabled={busySessionId === s.id}
                    className="text-detail text-harvest hover:underline disabled:opacity-40 ml-4 shrink-0"
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
        <h2 className="text-label font-medium text-ink/60 uppercase tracking-wide">API keys</h2>
        {profile.keys.length === 0 ? (
          <div className="text-label text-ink/60">No API keys.</div>
        ) : (
          <ul className="divide-y divide-surface-border border border-surface-border rounded-md">
            {profile.keys.map((k) => (
              <li key={k.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <div className="text-label text-ink truncate">{k.name}</div>
                  <div className="text-detail text-ink/60 mt-0.5">
                    {k.scopes.filter(Boolean).join(" · ")} · Last used {relativeTime(k.last_used_at)}
                  </div>
                </div>
                <a href={link("/dashboard/access/keys")} className="text-detail text-moss hover:underline ml-4 shrink-0">
                  Manage
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-label font-medium text-ink/60 uppercase tracking-wide">Trail access</h2>
        {profile.trails.length === 0 ? (
          <div className="text-label text-ink/60">No trails.</div>
        ) : (
          <ul className="divide-y divide-surface-border border border-surface-border rounded-md">
            {profile.trails.map((t) => (
              <li key={t.id} className="px-4 py-3">
                <div className="text-label text-ink">{t.name}</div>
                {t.description && <div className="text-detail text-ink/60 mt-0.5">{t.description}</div>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
