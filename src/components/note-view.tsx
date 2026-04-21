/**
 * Server component that renders a vault note as HTML.
 */

import type { NoteResponse } from "@/lib/grove-api";
import { renderMarkdown } from "@/lib/markdown";
import MermaidHydrator from "./mermaid-hydrator";
import ShareButton from "./share-button";
import Link from "next/link";
import { Link2 } from "lucide-react";

function formatJournalDate(path: string): string {
  // Journal paths: Journal/YYYY/YYYY-MM-DD.md
  const match = path.match(/(\d{4}-\d{2}-\d{2})/);
  if (!match) return path.split("/").pop()?.replace(/\.md$/, "") || path;

  const date = new Date(match[1] + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Strip [[wikilink]] syntax: [[Target|Display]] → Display, [[Target]] → Target */
function stripWikilinks(s: string): string {
  return s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, target, display) => display ?? target);
}

function getTitle(note: NoteResponse): string {
  const fm = note.frontmatter;
  if (typeof fm.title === "string" && fm.title) return stripWikilinks(fm.title);
  // Derive from path: last segment, strip .md
  return note.path.split("/").pop()?.replace(/\.md$/, "") || note.path;
}

function getAliases(note: NoteResponse): string[] {
  const fm = note.frontmatter;
  if (Array.isArray(fm.aliases)) return fm.aliases.filter((a): a is string => typeof a === "string");
  return [];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default async function NoteView({
  note,
  atHandle,
  role,
}: {
  note: NoteResponse;
  atHandle?: string;
  role?: "owner" | "non-owner";
}) {
  let html: string;
  let renderFailed = false;
  try {
    html = await renderMarkdown(note.content, note.links, atHandle);
  } catch (err) {
    console.error("renderMarkdown failed for", note.path, err);
    renderFailed = true;
    html = `<pre class="raw-fallback">${escapeHtml(note.content)}</pre>`;
  }
  const type = typeof note.frontmatter.type === "string" ? note.frontmatter.type : "default";
  const isJournal = type === "journal";
  const isPerson = type === "person";

  const title = isJournal ? formatJournalDate(note.path) : getTitle(note);
  const aliases = isPerson ? getAliases(note) : [];

  return (
    <article className="note-content mx-auto max-w-[680px] w-full">
      <header className="mb-10 pb-8 border-b border-ink/15">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-heading font-serif font-medium text-ink leading-[1.2] tracking-[-0.015em]">
              {title}
            </h1>
            {aliases.length > 0 && (
              <p className="mt-2 text-label text-ink/40">
                {aliases.join(" · ")}
              </p>
            )}
          </div>
          {role === "owner" && atHandle && (
            <ShareButton notePath={note.path} atHandle={atHandle} />
          )}
        </div>
      </header>

      {renderFailed && (
        <div className="mb-6 rounded-md border border-ink/15 bg-ink/15 px-6 py-3 text-label text-ink/60">
          Couldn&apos;t render this note — showing raw content.
        </div>
      )}
      <div
        className="prose prose-lg"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <MermaidHydrator />

      {note.backlinks.length > 0 && (
        <footer className="mt-16 pt-8 border-t border-ink/15">
          <h2 className="text-label uppercase tracking-[0.15em] text-ink/40 mb-4">
            Referenced by
          </h2>
          <ul className="space-y-1">
            {note.backlinks.map((bl) => {
              const name = bl.replace(/\.md$/, "").split("/").pop() ?? bl;
              const prefix = atHandle ? `/@${atHandle}` : "";
              const href = prefix + "/" + bl.replace(/\.md$/, "");
              return (
                <li key={bl}>
                  <Link
                    href={href}
                    className="group flex items-center gap-2 rounded-lg px-3 py-2.5 -mx-3 hover:bg-ink/15 transition-colors"
                  >
                    <Link2 size={14} className="shrink-0 text-ink/15" />
                    <span className="text-label text-ink/60 group-hover:text-ink transition-colors">
                      {name}
                    </span>
                    <span className="text-detail text-ink/15 ml-auto hidden sm:inline">
                      {bl.split("/").slice(0, -1).join("/")}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </footer>
      )}
    </article>
  );
}
