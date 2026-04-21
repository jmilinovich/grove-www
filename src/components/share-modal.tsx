"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

type Stage = "form" | "loading" | "success" | "error";

interface ShareResponse {
  id: string;
  url: string;
  expires_at: string;
}

const TTL_OPTIONS = [
  { value: 1, label: "24 hours" },
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
];

// `null` represents Unlimited, which is sent to the API as `max_views: null`.
const MAX_VIEWS_OPTIONS: Array<{ value: number | null; label: string }> = [
  { value: 10, label: "10" },
  { value: 100, label: "100" },
  { value: null, label: "Unlimited" },
];

function ttlLabel(days: number): string {
  if (days === 1) return "24 hours";
  return `${days} days`;
}

function viewsLabel(count: number, max: number | null): string {
  return max === null ? `${count} / ∞` : `${count}/${max}`;
}

function focusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

export default function ShareModal({
  notePath,
  atHandle,
  onClose,
}: {
  notePath: string;
  atHandle: string;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<Stage>("form");
  const [ttlDays, setTtlDays] = useState<number>(7);
  const [maxViews, setMaxViews] = useState<number | null>(100);
  const [share, setShare] = useState<ShareResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [clipboardFailed, setClipboardFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const headingId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstInputRef = useRef<HTMLSelectElement | null>(null);
  const doneButtonRef = useRef<HTMLButtonElement | null>(null);
  const urlInputRef = useRef<HTMLInputElement | null>(null);

  // Focus first input on mount.
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  // Move focus to Done on success; auto-select URL if clipboard failed.
  useEffect(() => {
    if (stage !== "success") return;
    if (clipboardFailed && urlInputRef.current) {
      urlInputRef.current.focus();
      urlInputRef.current.select();
      return;
    }
    doneButtonRef.current?.focus();
  }, [stage, clipboardFailed]);

  // Lock scroll on body while modal is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const items = focusableElements(dialog);
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  const handleBackdropClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const handleGenerate = useCallback(async () => {
    setStage("loading");
    setErrorMessage("");
    try {
      const res = await fetch("/api/admin/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note_path: notePath,
          ttl_days: ttlDays,
          max_views: maxViews,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorMessage(data?.error ?? "");
        setStage("error");
        return;
      }
      const data = (await res.json()) as ShareResponse;
      setShare(data);

      let copiedOk = false;
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(data.url);
          copiedOk = true;
        } catch {
          copiedOk = false;
        }
      }
      setCopied(copiedOk);
      setClipboardFailed(!copiedOk);
      setStage("success");
    } catch {
      setErrorMessage("");
      setStage("error");
    }
  }, [notePath, ttlDays, maxViews]);

  const handleCopyAgain = useCallback(async () => {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(share.url);
      setCopied(true);
      setClipboardFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setClipboardFailed(true);
      urlInputRef.current?.select();
    }
  }, [share]);

  const isLoading = stage === "loading";

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      data-testid="share-modal-backdrop"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="
          fixed z-50
          inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto
          rounded-t-2xl bg-cream
          sm:inset-auto sm:top-1/2 sm:left-1/2 sm:bottom-auto
          sm:-translate-x-1/2 sm:-translate-y-1/2
          sm:max-w-[420px] sm:w-[calc(100vw-2rem)] sm:rounded-lg
          sm:border sm:border-ink/15
          shadow-xl
        "
      >
        <div className="p-6">
          <h2
            id={headingId}
            className="font-serif text-lg font-medium text-ink mb-4"
          >
            {stage === "success" ? "Shared" : "Share this note"}
          </h2>

          {(stage === "form" || stage === "loading" || stage === "error") && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="share-ttl"
                  className="block text-xs uppercase tracking-[0.1em] text-ink/40 mb-1"
                >
                  Expires in
                </label>
                <select
                  ref={firstInputRef}
                  id="share-ttl"
                  value={ttlDays}
                  disabled={isLoading}
                  onChange={(e) => setTtlDays(Number(e.target.value))}
                  className="w-full bg-white border border-ink/15 rounded px-3 py-2 text-sm text-ink focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/15 transition-colors disabled:opacity-60"
                >
                  {TTL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="share-max-views"
                  className="block text-xs uppercase tracking-[0.1em] text-ink/40 mb-1"
                >
                  Max views
                </label>
                <select
                  id="share-max-views"
                  value={maxViews === null ? "unlimited" : String(maxViews)}
                  disabled={isLoading}
                  onChange={(e) => {
                    const v = e.target.value;
                    setMaxViews(v === "unlimited" ? null : Number(v));
                  }}
                  className="w-full bg-white border border-ink/15 rounded px-3 py-2 text-sm text-ink focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/15 transition-colors disabled:opacity-60"
                >
                  {MAX_VIEWS_OPTIONS.map((o) => (
                    <option
                      key={o.label}
                      value={o.value === null ? "unlimited" : String(o.value)}
                    >
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-ink/40 font-mono">
                Your URL: grove.md/@{atHandle}/s/…
              </p>

              {stage === "error" && (
                <p className="text-sm text-harvest" role="alert">
                  Couldn&apos;t create link. Try again.
                  {errorMessage ? ` (${errorMessage})` : ""}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="text-sm text-ink/60 hover:text-ink transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="bg-ink text-cream rounded px-4 py-2 text-sm font-medium hover:bg-earth transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Generating…" : "Generate"}
                </button>
              </div>
            </div>
          )}

          {stage === "success" && share && (
            <div className="space-y-4">
              <p
                role="status"
                aria-live="polite"
                className={`text-sm ${copied ? "text-moss" : "text-harvest"}`}
              >
                {copied
                  ? "✓ Link created · Copied to clipboard"
                  : "⚠ Couldn't copy — select and copy manually"}
              </p>

              <div className="flex items-center gap-2">
                <input
                  ref={urlInputRef}
                  type="text"
                  readOnly
                  value={share.url}
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 bg-surface font-mono text-xs text-ink/60 border border-ink/15 rounded px-3 py-2 focus:outline-none focus:border-moss"
                />
                <button
                  type="button"
                  onClick={handleCopyAgain}
                  className="shrink-0 text-sm text-moss hover:text-moss/60 transition-colors font-medium"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <p className="text-xs text-ink/40">
                Expires in {ttlLabel(ttlDays)} · {viewsLabel(0, maxViews)} views
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <a
                  href="/dashboard/shares"
                  className="text-sm text-moss hover:text-moss/60 transition-colors"
                >
                  Manage all shares →
                </a>
                <button
                  ref={doneButtonRef}
                  type="button"
                  onClick={onClose}
                  className="bg-ink text-cream rounded px-4 py-2 text-sm font-medium hover:bg-earth transition-colors active:scale-[0.98]"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
