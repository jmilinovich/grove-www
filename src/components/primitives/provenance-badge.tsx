"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

export type ProvenanceVoice = "durable" | "perishable" | "legacy-unknown";

export interface ProvenanceBadgeProps {
  voice: ProvenanceVoice;
  basis?: string[];
  source?: string;
  reason?: string;
  by?: string;
  writtenAt?: string;
}

const CHIP_BASE =
  "inline-flex items-center justify-center bg-surface border border-surface-border rounded-sm font-mono text-detail px-1.5 py-0.5";

const CHIP_VOICE: Record<Exclude<ProvenanceVoice, "legacy-unknown">, string> = {
  durable: "text-moss",
  perishable: "text-harvest border-[var(--harvest-15)]",
};

export function ProvenanceBadge(props: ProvenanceBadgeProps) {
  const { voice, basis, source, reason, by, writtenAt } = props;
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popoverId = useId();

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (voice === "legacy-unknown") return null;

  const label = voice === "durable" ? "durable" : "perishable";
  const chipClass = [CHIP_BASE, CHIP_VOICE[voice]].join(" ");

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((prev) => !prev);
    }
  }

  const hasMetadata =
    Boolean(by) ||
    Boolean(writtenAt) ||
    Boolean(source) ||
    Boolean(reason) ||
    Boolean(basis && basis.length > 0);

  return (
    <span className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        className={chipClass}
        aria-expanded={open}
        aria-controls={popoverId}
        aria-haspopup="dialog"
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={onKeyDown}
      >
        {label}
      </button>
      {open ? (
        <div
          id={popoverId}
          role="dialog"
          aria-label={`Provenance: ${label}`}
          className="absolute left-0 top-full z-10 mt-1 max-h-64 w-64 overflow-auto bg-surface border border-surface-border rounded-md p-3 text-detail text-ink"
        >
          {hasMetadata ? (
            <dl className="flex flex-col gap-2">
              {by ? (
                <div>
                  <dt className="text-ink/60 font-mono">by</dt>
                  <dd className="font-mono">{by}</dd>
                </div>
              ) : null}
              {writtenAt ? (
                <div>
                  <dt className="text-ink/60 font-mono">written</dt>
                  <dd className="font-mono">{writtenAt}</dd>
                </div>
              ) : null}
              {source ? (
                <div>
                  <dt className="text-ink/60 font-mono">source</dt>
                  <dd className="font-mono break-all">{source}</dd>
                </div>
              ) : null}
              {reason ? (
                <div>
                  <dt className="text-ink/60 font-mono">reason</dt>
                  <dd>{reason}</dd>
                </div>
              ) : null}
              {basis && basis.length > 0 ? (
                <div>
                  <dt className="text-ink/60 font-mono">basis</dt>
                  <dd>
                    <ul className="flex flex-col gap-1 font-mono break-all">
                      {basis.map((item, idx) => (
                        <li key={`${item}-${idx}`}>{item}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="text-ink/60">no metadata</p>
          )}
        </div>
      ) : null}
    </span>
  );
}
