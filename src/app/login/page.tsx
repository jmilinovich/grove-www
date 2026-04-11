"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = useCallback(
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
            Enter your API key to view your vault.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label htmlFor="api-key" className="block text-xs uppercase tracking-[0.1em] text-ink/60">
            API key
          </label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="grove_live_..."
            autoFocus
            className="w-full bg-white border border-ink/15 rounded px-4 py-3.5 text-sm text-ink placeholder:text-ink/15 focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/15 transition-colors font-mono"
          />

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !apiKey}
            className="w-full bg-ink text-cream rounded px-4 py-3.5 text-sm font-medium hover:bg-earth transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Authenticating..." : "Connect"}
          </button>
        </form>

        <p className="text-xs text-ink/40 mt-6 text-center">
          Need a key?{" "}
          <a href="https://grove.md" className="text-moss hover:underline transition-colors">
            Get early access
          </a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
