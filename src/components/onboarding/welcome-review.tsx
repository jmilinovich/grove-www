"use client";

import { useState } from "react";

// WelcomeReview — first-run punchline banner (W3-FIRSTRUN-1).
//
// SPEC §12: at t=30s on the first authed visit, the dashboard surfaces
// a one-line punchline above <NeedsReviewList />: "your first AI
// artifact is ready". The body explains what surfaced; the Dismiss
// button retires the banner for this session.
//
// The component is purely visual + a single piece of local state. The
// page-level wiring (conditional render based on `isFirstRun(vaultSlug)`
// from `_first-run.ts`) is a v2.5 integration step and is not done here.
//
// Copy register (SPEC §13): lowercase, quiet, no exclamation marks, no
// first-person AI voice.

export interface WelcomeReviewProps {
  /** Optional callback fired when the user dismisses the banner. */
  onDismiss?: () => void;
}

const TITLE = "your first AI artifact is ready";

const BODY =
  "your first daily vault review just landed in needs review. it's surface-only — nothing in your vault changed. take a look when you have a minute.";

export function WelcomeReview({ onDismiss }: WelcomeReviewProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <section
      role="region"
      aria-label="first-run welcome"
      className="bg-surface border border-surface-border rounded-md p-6"
    >
      <h2 className="font-serif text-subhead text-ink">{TITLE}</h2>
      <p className="mt-2 font-sans text-body text-ink/60">{BODY}</p>
      <div className="mt-4">
        <button
          type="button"
          onClick={handleDismiss}
          className="inline-flex items-center justify-center bg-ink text-cream rounded-md px-6 py-2.5 font-sans text-label font-medium hover:bg-earth transition-colors"
        >
          dismiss
        </button>
      </div>
    </section>
  );
}
