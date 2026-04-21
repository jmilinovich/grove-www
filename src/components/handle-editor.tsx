"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./primitives/button";

/** Mirrors the backend `isValidHandle()` shape check in src/users.ts. */
const HANDLE_RE = /^[a-z0-9][a-z0-9_-]{0,29}$/;
const RESERVED = new Set([
  "admin", "api", "v1", "login", "logout", "signup", "dashboard", "profile",
  "keys", "images", "home", "trails", "s", "u", "me", "settings", "help",
  "about", "docs", "support", "privacy", "terms", "well-known", "auth",
]);

type Availability =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available" }
  | { state: "taken" }
  | { state: "error" };

function shapeError(handle: string): string | null {
  if (handle.length === 0) return "Handle is required.";
  if (handle.length > 30) return "Handle must be 30 characters or fewer.";
  if (!HANDLE_RE.test(handle)) {
    return "Handle must be lowercase letters, digits, `_` or `-`, starting with a letter or digit.";
  }
  if (RESERVED.has(handle)) return "That handle is reserved.";
  return null;
}

export interface HandleEditorProps {
  currentHandle: string;
  onChanged: (newHandle: string, oldHandle: string) => void;
}

/**
 * Profile handle editor (P16-5). Debounces availability checks against
 * `/api/residents/:handle`, shows a live `grove.md/@<handle>` preview, and
 * PATCH-es `/api/me` on save. On success the parent lifts the new handle
 * into profile state and shows an "old URL still works" note.
 */
export default function HandleEditor({ currentHandle, onChanged }: HandleEditorProps) {
  const [value, setValue] = useState(currentHandle);
  const [availability, setAvailability] = useState<Availability>({ state: "idle" });
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<{ oldHandle: string; newHandle: string } | null>(null);
  const checkSeq = useRef(0);

  const trimmed = value.trim();
  const changed = trimmed !== currentHandle;
  const localError = changed ? shapeError(trimmed) : null;

  // Debounced availability probe — only runs for shape-valid, changed values.
  useEffect(() => {
    if (!changed || localError) {
      setAvailability({ state: "idle" });
      return;
    }
    setAvailability({ state: "checking" });
    const seq = ++checkSeq.current;
    const handle = trimmed;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/residents/${encodeURIComponent(handle)}`, {
          cache: "no-store",
        });
        if (seq !== checkSeq.current) return;
        if (res.status === 404) setAvailability({ state: "available" });
        else if (res.ok) setAvailability({ state: "taken" });
        else setAvailability({ state: "error" });
      } catch {
        if (seq === checkSeq.current) setAvailability({ state: "error" });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [trimmed, changed, localError]);

  const statusMessage = useMemo<{ tone: "error" | "ok" | "muted"; text: string } | null>(() => {
    if (serverError) return { tone: "error", text: serverError };
    if (!changed) return null;
    if (localError) return { tone: "error", text: localError };
    switch (availability.state) {
      case "checking": return { tone: "muted", text: "Checking availability…" };
      case "available": return { tone: "ok", text: "Handle is available." };
      case "taken": return { tone: "error", text: "That handle is taken." };
      case "error": return { tone: "error", text: "Could not check availability." };
      default: return null;
    }
  }, [availability, changed, localError, serverError]);

  const canSave = changed && !localError && availability.state === "available" && !saving;

  const save = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    setServerError(null);
    const oldHandle = currentHandle;
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as { handle?: string; error?: string };
      if (!res.ok) {
        setServerError(data.error ?? "Could not save handle.");
        return;
      }
      const saved = data.handle ?? trimmed;
      setLastSaved({ oldHandle, newHandle: saved });
      onChanged(saved, oldHandle);
    } catch {
      setServerError("Network error.");
    } finally {
      setSaving(false);
    }
  }, [canSave, currentHandle, trimmed, onChanged]);

  return (
    <div>
      <label className="block text-detail text-ink/60 mb-1" htmlFor="handle">Handle</label>
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-label text-ink/40 pointer-events-none">@</span>
          <input
            id="handle"
            type="text"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={value}
            onChange={(e) => {
              setValue(e.target.value.toLowerCase());
              setServerError(null);
              setLastSaved(null);
            }}
            placeholder="handle"
            maxLength={30}
            className="w-full pl-7 pr-3 py-1.5 text-label bg-surface border border-surface-border rounded-md text-ink focus:outline-none focus:border-moss"
          />
        </div>
        <Button
          type="button"
          onClick={save}
          disabled={!canSave}
          loading={saving}
          loadingLabel="Saving…"
          size="sm"
        >
          Save
        </Button>
      </div>
      <div className="mt-1 text-detail text-ink/60">
        Your URL: <span className="font-mono text-ink/60">grove.md/@{trimmed || currentHandle}</span>
      </div>
      {statusMessage && (
        <div
          className={
            "mt-1 text-detail " +
            (statusMessage.tone === "error"
              ? "text-harvest"
              : statusMessage.tone === "ok"
                ? "text-moss"
                : "text-ink/60")
          }
        >
          {statusMessage.text}
        </div>
      )}
      {lastSaved && (
        <div className="mt-1 text-detail text-ink/60">
          Saved. Old URL redirects:{" "}
          <span className="font-mono">grove.md/@{lastSaved.oldHandle}</span>
          {" → "}
          <span className="font-mono">grove.md/@{lastSaved.newHandle}</span>
        </div>
      )}
    </div>
  );
}
