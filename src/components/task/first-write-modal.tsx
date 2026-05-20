"use client";

import {
  useEffect,
  useId,
  useRef,
  type JSX,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Button } from "@/components/primitives/button";

interface FirstWriteModalProps {
  skillName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function FirstWriteModal({
  skillName,
  onConfirm,
  onCancel,
}: FirstWriteModalProps): JSX.Element {
  const headingId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const confirmButton = dialogRef.current?.querySelector<HTMLButtonElement>(
      '[data-testid="first-write-confirm"]',
    );
    confirmButton?.focus();
  }, []);

  const onDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 p-4"
      onKeyDown={onDialogKeyDown}
      data-testid="first-write-modal"
    >
      <div className="w-full max-w-md bg-surface border border-surface-border rounded-md p-6">
        <h3
          id={headingId}
          className="font-serif font-medium text-subhead text-ink"
        >
          first write for {skillName}
        </h3>
        <p className="mt-3 font-sans text-base text-ink">
          this skill will write to your vault. continue?
        </p>
        <p className="mt-2 font-sans text-detail text-ink/60">
          you won&apos;t see this prompt again for this skill.
        </p>
        <div className="mt-4 flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
            data-testid="first-write-cancel"
          >
            cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onConfirm}
            data-testid="first-write-confirm"
          >
            continue
          </Button>
        </div>
      </div>
    </div>
  );
}
