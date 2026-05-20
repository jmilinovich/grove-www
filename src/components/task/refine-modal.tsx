"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type JSX,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Button } from "@/components/primitives/button";

interface RefineModalProps {
  onSubmit: (refinement: string) => void;
  onCancel: () => void;
}

export function RefineModal({ onSubmit, onCancel }: RefineModalProps): JSX.Element {
  const [text, setText] = useState("");
  const headingId = useId();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const onDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  };

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      textareaRef.current?.focus();
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 p-4"
      onKeyDown={onDialogKeyDown}
      data-testid="refine-modal"
    >
      <div className="w-full max-w-md bg-surface border border-surface-border rounded-md p-6">
        <h3
          id={headingId}
          className="font-serif font-medium text-subhead text-ink"
        >
          refine this artifact
        </h3>
        <p className="mt-2 font-sans text-detail text-ink/60">
          what should the skill do differently next time?
        </p>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mt-4 w-full min-h-32 bg-cream border border-surface-border rounded-md p-3 font-sans text-base text-ink resize-y focus:outline-none focus:border-ink"
          placeholder="e.g. rephrase as durable; drop the hedge"
          data-testid="refine-textarea"
        />
        <div className="mt-4 flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
            data-testid="refine-cancel"
          >
            cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            data-testid="refine-submit"
          >
            submit
          </Button>
        </div>
      </div>
    </div>
  );
}
