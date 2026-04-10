/**
 * Server component that renders a vault note as HTML.
 */

import type { NoteResponse } from "@/lib/grove-api";
import { renderMarkdown } from "@/lib/markdown";

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
    </article>
  );
}
