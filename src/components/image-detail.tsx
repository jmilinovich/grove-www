"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ListEntry } from "@/lib/grove-api";

interface NoteDetail {
  path: string;
  frontmatter: Record<string, unknown>;
  content: string;
  backlinks: string[];
}

interface Props {
  image: ListEntry;
  onClose: () => void;
}

async function fetchNoteDetail(path: string): Promise<NoteDetail | null> {
  try {
    const res = await fetch(`/api/notes?path=${encodeURIComponent(path)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function str(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

export default function ImageDetail({ image, onClose }: Props) {
  const [detail, setDetail] = useState<NoteDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchNoteDetail(image.path).then((d) => {
      if (!cancelled) {
        setDetail(d);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [image.path]);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const fm = detail?.frontmatter ?? {};
  const ocr = str(fm.ocr_text);
  const uploaded = str(fm.uploaded_at);
  const description = detail?.content
    ? detail.content
        .split("\n")
        .map((l) => l.trim())
        .find((l) => l && !l.startsWith("#") && !l.startsWith("!["))
    : image.description;

  const notePath = "/" + image.path.replace(/\.md$/, "");

  return (
    <div
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-label={`Details for ${image.name}`}
    >
      {/* Backdrop */}
      <button
        aria-label="Close"
        onClick={onClose}
        className="flex-1 bg-ink/40 backdrop-blur-sm"
      />

      {/* Panel */}
      <aside className="w-full max-w-xl h-full bg-background border-l border-surface-border overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-surface-border px-6 py-3 flex items-center justify-between z-10">
          <p className="text-xs uppercase tracking-[0.15em] text-ink/40">Image</p>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-md text-ink/60 hover:text-ink hover:bg-surface transition-colors"
            aria-label="Close panel"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Full-size image */}
          {image.image_url && (
            <a
              href={image.image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-surface rounded-lg overflow-hidden border border-surface-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.image_url}
                alt={image.name}
                loading="eager"
                className="w-full h-auto"
              />
            </a>
          )}

          {/* Title + link to note */}
          <div>
            <h2 className="font-serif font-medium text-lg text-ink leading-tight">
              {image.name}
            </h2>
            <Link
              href={notePath}
              className="inline-block mt-2 text-xs text-moss hover:text-earth transition-colors"
            >
              Open note →
            </Link>
          </div>

          {/* Tags */}
          {image.tags && image.tags.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-ink/40 mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {image.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 rounded-full border border-surface-border text-xs text-ink/60"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {description && (
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-ink/40 mb-2">Description</p>
              <p className="text-sm text-ink/80 leading-relaxed">{description}</p>
            </div>
          )}

          {/* OCR */}
          {ocr && (
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-ink/40 mb-2">Text in image</p>
              <pre className="text-xs text-ink/60 leading-relaxed whitespace-pre-wrap font-mono bg-surface rounded-md p-3 border border-surface-border">
                {ocr}
              </pre>
            </div>
          )}

          {/* Metadata */}
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-ink/40 mb-2">Details</p>
            <dl className="text-xs space-y-1">
              {image.dimensions && (
                <div className="flex justify-between">
                  <dt className="text-ink/50">Dimensions</dt>
                  <dd className="text-ink/80">
                    {image.dimensions.width} × {image.dimensions.height}
                  </dd>
                </div>
              )}
              {uploaded && (
                <div className="flex justify-between">
                  <dt className="text-ink/50">Uploaded</dt>
                  <dd className="text-ink/80">{new Date(uploaded).toLocaleDateString()}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink/50">Path</dt>
                <dd className="text-ink/80 font-mono truncate ml-2">{image.path}</dd>
              </div>
            </dl>
          </div>

          {/* Backlinks */}
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-ink/40 mb-2">Referenced by</p>
            {loading ? (
              <p className="text-xs text-ink/40">Loading…</p>
            ) : detail && detail.backlinks.length > 0 ? (
              <ul className="space-y-1">
                {detail.backlinks.map((bl) => {
                  const href = "/" + bl.replace(/\.md$/, "");
                  const name = bl.replace(/\.md$/, "").split("/").pop() ?? bl;
                  return (
                    <li key={bl}>
                      <Link
                        href={href}
                        className="text-sm text-moss hover:text-earth transition-colors"
                      >
                        {name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs text-ink/40">No backlinks yet.</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
