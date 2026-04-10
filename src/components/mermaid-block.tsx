"use client";

import { useEffect, useRef, useState } from "react";

export default function MermaidBlock({ source }: { source: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          fontFamily: "var(--font-geist-mono)",
        });

        if (cancelled || !containerRef.current) return;

        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg } = await mermaid.render(id, source);

        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = svg;
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Mermaid render failed");
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [source]);

  if (error) {
    return (
      <pre className="text-sm text-red-400 bg-surface border border-surface-border rounded p-4 overflow-x-auto">
        <code>{source}</code>
        <p className="mt-2 text-xs text-muted">Mermaid error: {error}</p>
      </pre>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-4 flex justify-center [&_svg]:max-w-full"
    />
  );
}
