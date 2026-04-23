"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";

const MermaidBlock = dynamic(() => import("./mermaid-block"), { ssr: false });

/**
 * Replaces every SSR'd `<div data-mermaid-source="…">` with a client-rendered
 * MermaidBlock via React portal — so the diagram renders in place of the
 * skeleton, not at the hydrator's position in the tree. Previously the
 * skeleton box stayed visible *and* the diagram rendered at the bottom of
 * the note, double-stacking the content.
 */
export default function MermaidHydrator() {
  const [targets, setTargets] = useState<{ el: HTMLElement; source: string }[]>([]);

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-mermaid-source]");
    const found: { el: HTMLElement; source: string }[] = [];
    elements.forEach((el) => {
      const encoded = el.getAttribute("data-mermaid-source") ?? "";
      try {
        const source = atob(encoded);
        // Drop skeleton styling so the portal renders into a clean host
        el.classList.remove("mermaid-placeholder");
        el.innerHTML = "";
        found.push({ el, source });
      } catch {
        // Invalid base64 — leave placeholder alone
      }
    });
    setTargets(found);
  }, []);

  return (
    <>
      {targets.map(({ el, source }, i) =>
        createPortal(<MermaidBlock source={source} />, el, `mermaid-${i}`),
      )}
    </>
  );
}
