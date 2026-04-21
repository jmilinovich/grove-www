"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const [apiKey, setApiKey] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const trailId = searchParams.get("trail");

  const handleMagicLink = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      try {
        const callbackUrl = new URL("/api/auth/callback", window.location.origin);
        if (trailId) callbackUrl.searchParams.set("trail", trailId);
        const redirect = searchParams.get("redirect");
        if (redirect) callbackUrl.searchParams.set("redirect", redirect);

        const res = await fetch("/api/auth/magic-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            redirect: callbackUrl.toString(),
          }),
        });

        if (!res.ok) {
          setError("Could not send magic link");
          return;
        }

        setMagicLinkSent(true);
      } catch {
        setError("Network error — could not reach server");
      } finally {
        setLoading(false);
      }
    },
    [email, trailId, searchParams],
  );

  const handleApiKey = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: apiKey.trim().replace(/\s+/g, "") }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Authentication failed");
          return;
        }

        const redirect = searchParams.get("redirect") ?? "/";
        router.push(redirect);
      } catch {
        setError("Network error — could not reach server");
      } finally {
        setLoading(false);
      }
    },
    [apiKey, router, searchParams],
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-cream">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-serif font-medium text-ink tracking-tight">
            Grove
          </h1>
          <p className="text-sm text-ink/60 mt-1">
            Sign in to view your vault.
          </p>
        </div>

        {/* Magic Link Form */}
        {magicLinkSent ? (
          <div className="mb-8">
            <div className="bg-moss/10 border border-moss/20 rounded px-4 py-3.5 text-sm text-ink">
              Check your email for a sign-in link.
            </div>
            <button
              onClick={() => setMagicLinkSent(false)}
              className="text-xs text-ink/40 mt-3 hover:text-ink/60 transition-colors"
            >
              Didn&apos;t receive it? Try again
            </button>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="mb-8">
            <label htmlFor="email" className="block text-xs uppercase tracking-[0.1em] text-ink/60 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              className="w-full bg-white border border-ink/15 rounded px-4 py-3.5 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/15 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full mt-3 bg-ink text-cream rounded px-4 py-3.5 text-sm font-medium hover:bg-earth transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send magic link"}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-ink/10" />
          <span className="text-xs text-ink/30 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-ink/10" />
        </div>

        {/* API Key Form */}
        <form onSubmit={handleApiKey} className="space-y-4">
          <label htmlFor="api-key" className="block text-xs uppercase tracking-[0.1em] text-ink/60">
            API key
          </label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="grove_live_..."
            className="w-full bg-white border border-ink/15 rounded px-4 py-3.5 text-sm text-ink placeholder:text-ink/15 focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/15 transition-colors font-mono"
          />

          {error && (
            <p className="text-sm text-harvest">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !apiKey}
            className="w-full bg-ink text-cream rounded px-4 py-3.5 text-sm font-medium hover:bg-earth transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Authenticating..." : "Connect with API key"}
          </button>
        </form>

        <p className="text-xs text-ink/40 mt-6 text-center">
          Need access?{" "}
          <a href="https://grove.md" className="text-moss hover:underline transition-colors">
            Learn more
          </a>
        </p>
      </div>
    </div>
  );
}
