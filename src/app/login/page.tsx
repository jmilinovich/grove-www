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
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-lg font-bold tracking-tight">
            grove<span className="text-accent">.</span>md
          </h1>
          <p className="text-sm text-muted mt-1">
            Enter your API key to view your vault.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="grove_live_..."
            autoFocus
            className="w-full bg-surface border border-surface-border px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors font-mono"
          />

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !apiKey}
            className="w-full bg-accent text-background px-4 py-3 text-sm font-bold hover:bg-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Authenticating..." : "Connect"}
          </button>
        </form>

        <p className="text-xs text-muted mt-6">
          Need a key?{" "}
          <a href="https://grove.md" className="text-accent hover:text-green-300 transition-colors">
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
