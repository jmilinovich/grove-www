"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";

const ShareModal = dynamic(() => import("./share-modal"), {
  ssr: false,
  loading: () => null,
});

export default function ShareButton({
  notePath,
  atHandle,
}: {
  notePath: string;
  atHandle: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        aria-label="Share this note"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-ink/15 bg-cream px-2.5 py-1.5 text-sm text-ink/60 hover:text-ink hover:border-ink/40 transition-colors active:scale-[0.98]"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M7 17L17 7" />
          <path d="M8 7h9v9" />
        </svg>
        <span className="hidden sm:inline">Share</span>
      </button>
      {open && (
        <ShareModal
          notePath={notePath}
          atHandle={atHandle}
          onClose={handleClose}
        />
      )}
    </>
  );
}
