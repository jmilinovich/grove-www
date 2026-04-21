"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      className="absolute top-2 right-2 text-cream/40 hover:text-cream/60 transition-colors p-1.5 rounded-md"
      onClick={handleCopy}
      aria-label="Copy MCP config"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}
