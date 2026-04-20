"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[...path] route error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-6xl font-medium text-ink/15 mb-4">500</p>
        <h1 className="text-xl font-medium mb-2">Something went wrong</h1>
        <p className="text-sm text-ink/40 mb-8">
          We couldn&apos;t load this note. This is usually transient — try refreshing.
        </p>
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={reset}
            className="text-sm text-moss hover:text-earth transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="text-sm text-moss hover:text-earth transition-colors"
          >
            &larr; Back to home
          </Link>
        </div>
        {error.digest && (
          <p className="text-xs text-ink/30 mt-8 font-mono">ref: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
