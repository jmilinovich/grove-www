"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/primitives/button";

type FormSize = "md" | "lg";

interface WaitlistFormProps {
  /** Where the form is shown — passed to the API for attribution. */
  source?: string;
  /** Visual scale. `lg` for the hero, `md` for the bottom CTA. */
  size?: FormSize;
  /** Copy shown after a successful submission. */
  successCopy?: string;
  /** Optional class on the wrapping form element. */
  className?: string;
}

const INPUT_BASE =
  "flex-1 bg-cream border border-ink/15 rounded-md text-ink placeholder:text-ink/40 focus:outline-none focus:border-moss transition-colors";

const INPUT_SIZE: Record<FormSize, string> = {
  md: "px-6 py-2.5 text-label",
  lg: "px-6 py-3.5 text-label",
};

export default function WaitlistForm({
  source = "landing",
  size = "md",
  successCopy = "Thanks. We'll be in touch when hosted Grove opens up.",
  className = "",
}: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);
      try {
        const res = await fetch("/api/waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), source }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          if (data.error === "invalid_email") {
            setError("That email doesn't look right.");
          } else {
            setError("Something went wrong. Try again in a moment.");
          }
          return;
        }
        setSent(true);
      } catch {
        setError("Network error. Try again in a moment.");
      } finally {
        setLoading(false);
      }
    },
    [email, source],
  );

  if (sent) {
    return (
      <div
        role="status"
        className={`bg-moss/15 border border-moss/15 rounded-md px-6 py-3.5 text-label text-ink max-w-md ${className}`}
      >
        {successCopy}
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`flex flex-col sm:flex-row gap-3 max-w-md ${className}`}
      noValidate
    >
      <label htmlFor={`waitlist-email-${source}`} className="sr-only">
        Email address
      </label>
      <input
        id={`waitlist-email-${source}`}
        type="email"
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `waitlist-error-${source}` : undefined}
        className={`${INPUT_BASE} ${INPUT_SIZE[size]}`}
      />
      <Button
        type="submit"
        disabled={!email}
        loading={loading}
        loadingLabel="Sending…"
        size={size}
      >
        Get early access
      </Button>
      {error ? (
        <p
          id={`waitlist-error-${source}`}
          className="text-label text-harvest sm:basis-full"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
