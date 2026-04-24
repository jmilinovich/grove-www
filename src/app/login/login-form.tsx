"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/primitives/button";
import { isSafeRelativePath } from "@/lib/role";

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

        // Validate redirect to prevent open-redirect phishing. A
        // crafted `?redirect=//evil.com/phish` would otherwise
        // navigate the post-login user away from grove.md to a
        // credential-harvesting page with grove.md as referrer.
        const rawRedirect = searchParams.get("redirect");
        const redirect = isSafeRelativePath(rawRedirect) ? rawRedirect : "/";
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
          <h1 className="text-heading font-serif font-medium text-ink tracking-tight">
            Grove
          </h1>
          <p className="text-label text-ink/60 mt-1">
            Sign in to view your vault.
          </p>
        </div>

        {/* Magic Link Form */}
        {magicLinkSent ? (
          <div className="mb-8">
            <div className="bg-moss/15 border border-moss/15 rounded-md px-6 py-3.5 text-label text-ink">
              Check your email for a sign-in link.
            </div>
            <button
              onClick={() => setMagicLinkSent(false)}
              className="text-detail text-ink/40 mt-3 hover:text-ink/60 transition-colors"
            >
              Didn&apos;t receive it? Try again
            </button>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="mb-8">
            <label htmlFor="email" className="block text-detail uppercase tracking-[0.1em] text-ink/60 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              className="w-full bg-cream border border-ink/15 rounded-md px-6 py-3.5 text-label text-ink placeholder:text-ink/40 focus:outline-none focus:border-moss transition-colors"
            />
            <Button
              type="submit"
              disabled={!email}
              loading={loading}
              loadingLabel="Sending…"
              size="lg"
              fullWidth
              className="mt-3"
            >
              Send magic link
            </Button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-ink/15" />
          <span className="text-detail text-ink/40 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-ink/15" />
        </div>

        {/* API Key Form */}
        <form onSubmit={handleApiKey} className="space-y-4">
          <label htmlFor="api-key" className="block text-detail uppercase tracking-[0.1em] text-ink/60">
            API key
          </label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="grove_live_..."
            className="w-full bg-cream border border-ink/15 rounded-md px-6 py-3.5 text-label text-ink placeholder:text-ink/40 focus:outline-none focus:border-moss transition-colors font-mono"
          />

          {error && (
            <p className="text-label text-harvest">{error}</p>
          )}

          <Button
            type="submit"
            disabled={!apiKey}
            loading={loading}
            loadingLabel="Authenticating…"
            size="lg"
            fullWidth
          >
            Connect with API key
          </Button>
        </form>

        <p className="text-detail text-ink/40 mt-6 text-center">
          Need access?{" "}
          <a href="https://grove.md" className="text-moss hover:underline transition-colors">
            Learn more
          </a>
        </p>
      </div>
    </div>
  );
}
