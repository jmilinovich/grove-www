"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MermaidBlock = dynamic(() => import("./mermaid-block"), { ssr: false });

/**
 * Finds all <div data-mermaid-source="..."> in the rendered HTML
 * and replaces them with interactive MermaidBlock components.
 */
export default function MermaidHydrator() {
  const [sources, setSources] = useState<{ id: string; source: string }[]>([]);

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-mermaid-source]");
    if (elements.length === 0) return;

    const found: { id: string; source: string }[] = [];
    elements.forEach((el, i) => {
      const encoded = el.getAttribute("data-mermaid-source") ?? "";
      try {
        const source = atob(encoded);
        const id = `mermaid-slot-${i}`;
        el.id = id;
        found.push({ id, source });
      } catch {
        // Invalid base64
      }
    });
    setSources(found);
  }, []);

  if (sources.length === 0) return null;

  return (
    <>
      {sources.map(({ id, source }) => (
        <MermaidPortal key={id} targetId={id} source={source} />
      ))}
    </>
  );
}

function MermaidPortal({ targetId, source }: { targetId: string; source: string }) {
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    // Clear the placeholder content
    el.innerHTML = "";
    el.setAttribute("data-hydrated", "true");
  }, [targetId]);

  // Render inline — the MermaidBlock will handle its own container
  return <MermaidBlock source={source} />;
}
