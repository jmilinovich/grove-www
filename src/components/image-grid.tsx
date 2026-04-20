"use client";

import { useEffect, useMemo, useState } from "react";
import type { ListEntry } from "@/lib/grove-api";
import ImageDetail from "./image-detail";

type SortMode = "newest" | "oldest" | "name";

interface Props {
  images: ListEntry[];
}

function useTags(images: ListEntry[]): string[] {
  return useMemo(() => {
    const counts = new Map<string, number>();
    for (const img of images) {
      for (const t of img.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([t]) => t);
  }, [images]);
}

function sortImages(images: ListEntry[], mode: SortMode): ListEntry[] {
  const copy = [...images];
  switch (mode) {
    case "newest":
      return copy.sort((a, b) => (a.modified_at < b.modified_at ? 1 : -1));
    case "oldest":
      return copy.sort((a, b) => (a.modified_at < b.modified_at ? -1 : 1));
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
  }
}

export default function ImageGrid({ images }: Props) {
  const [selected, setSelected] = useState<ListEntry | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>("newest");
  const tags = useTags(images);

  const visible = useMemo(() => {
    const filtered = activeTag
      ? images.filter((img) => img.tags?.includes(activeTag))
      : images;
    return sortImages(filtered, sort);
  }, [images, activeTag, sort]);

  useEffect(() => {
    if (!selected) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected]);

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0">
          <button
            onClick={() => setActiveTag(null)}
            className={[
              "shrink-0 px-3 py-1.5 text-xs rounded-full border transition-colors",
              activeTag === null
                ? "bg-ink text-cream border-ink"
                : "border-surface-border text-ink/60 hover:text-ink hover:border-ink/30",
            ].join(" ")}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={[
                "shrink-0 px-3 py-1.5 text-xs rounded-full border transition-colors",
                tag === activeTag
                  ? "bg-ink text-cream border-ink"
                  : "border-surface-border text-ink/60 hover:text-ink hover:border-ink/30",
              ].join(" ")}
            >
              #{tag}
            </button>
          ))}
        </div>

        <label className="shrink-0 flex items-center gap-2 text-xs text-ink/60">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="bg-surface border border-surface-border rounded px-2 py-1 text-ink"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>

      {/* Masonry via CSS columns. Images keep aspect ratio; items break inside avoided. */}
      {visible.length === 0 ? (
        <p className="text-sm text-ink/40 py-12 text-center">
          No images match the current filter.
        </p>
      ) : (
        <div className="[column-fill:_balance] gap-3 columns-2 sm:columns-3 lg:columns-4">
          {visible.map((img) => (
            <ImageTile
              key={img.path}
              image={img}
              onClick={() => setSelected(img)}
            />
          ))}
        </div>
      )}

      {selected && (
        <ImageDetail
          image={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function ImageTile({ image, onClick }: { image: ListEntry; onClick: () => void }) {
  const { width, height } = image.dimensions ?? { width: 4, height: 3 };
  const ratio = width && height ? width / height : 4 / 3;

  return (
    <button
      onClick={onClick}
      className="group mb-3 block w-full break-inside-avoid overflow-hidden rounded-lg bg-surface border border-surface-border hover:border-ink/30 transition-colors text-left"
      aria-label={`Open ${image.name}`}
    >
      <div
        className="relative w-full bg-surface"
        style={{ aspectRatio: ratio }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.thumbnail_url}
          alt={image.name}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
        />
      </div>
      <div className="px-3 py-2">
        <p className="text-sm text-ink font-medium truncate">{image.name}</p>
        {image.tags && image.tags.length > 0 && (
          <p className="text-xs text-ink/40 truncate mt-0.5">
            {image.tags.slice(0, 3).map((t) => `#${t}`).join(" ")}
          </p>
        )}
      </div>
    </button>
  );
}
