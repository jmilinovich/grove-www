/**
 * Server component that renders a vault note as HTML.
 */

import type { NoteResponse } from "@/lib/grove-api";
import { renderMarkdown } from "@/lib/markdown";
import MermaidHydrator from "./mermaid-hydrator";
import Link from "next/link";

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

function getTitle(note: NoteResponse): string {
  const fm = note.frontmatter;
  if (typeof fm.title === "string" && fm.title) return fm.title;
  // Derive from path: last segment, strip .md
  return note.path.split("/").pop()?.replace(/\.md$/, "") || note.path;
}

function getAliases(note: NoteResponse): string[] {
  const fm = note.frontmatter;
  if (Array.isArray(fm.aliases)) return fm.aliases.filter((a): a is string => typeof a === "string");
  return [];
}

export default async function NoteView({ note }: { note: NoteResponse }) {
  const html = await renderMarkdown(note.content, note.links);
  const type = typeof note.frontmatter.type === "string" ? note.frontmatter.type : "default";
  const isJournal = type === "journal";
  const isPerson = type === "person";

  const title = isJournal ? formatJournalDate(note.path) : getTitle(note);
  const aliases = isPerson ? getAliases(note) : [];

  return (
    <article className="note-content mx-auto" style={{ maxWidth: 700 }}>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground leading-tight">
          {title}
        </h1>
        {aliases.length > 0 && (
          <p className="mt-1 text-sm text-muted-light">
            {aliases.join(" · ")}
          </p>
        )}
      </header>

      <div
        className="prose prose-invert"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <MermaidHydrator />

      {note.backlinks.length > 0 && (
        <footer className="mt-12 pt-8 border-t border-surface-border">
          <h2 className="text-xs uppercase tracking-widest text-muted mb-4">
            Referenced by
          </h2>
          <ul className="space-y-1">
            {note.backlinks.map((bl) => {
              const name = bl.replace(/\.md$/, "").split("/").pop() ?? bl;
              const href = "/" + bl.replace(/\.md$/, "");
              return (
                <li key={bl}>
                  <Link
                    href={href}
                    className="group flex items-center gap-2 rounded-lg px-3 py-2 -mx-3 hover:bg-surface transition-colors"
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
                      className="shrink-0 text-muted"
                    >
                      <path d="M9 17H7A5 5 0 0 1 7 7h2" />
                      <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                    <span className="text-sm text-muted-light group-hover:text-foreground transition-colors">
                      {name}
                    </span>
                    <span className="text-xs text-muted ml-auto hidden sm:inline">
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
