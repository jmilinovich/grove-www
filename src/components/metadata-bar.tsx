/**
 * Server component showing note type, tags, and dates.
 */

const TYPE_COLORS: Record<string, string> = {
  concept: "bg-green-50 text-green-800 border-green-200",
  person: "bg-blue-50 text-blue-800 border-blue-200",
  recipe: "bg-amber-50 text-amber-800 border-amber-200",
  project: "bg-purple-50 text-purple-800 border-purple-200",
  company: "bg-rose-50 text-rose-800 border-rose-200",
  place: "bg-cyan-50 text-cyan-800 border-cyan-200",
  journal: "bg-stone-100 text-stone-600 border-stone-200",
};

const DEFAULT_TYPE_COLOR = "bg-stone-100 text-stone-600 border-stone-200";

function relativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

const MAX_VISIBLE_TAGS = 5;

export default function MetadataBar({
  frontmatter,
}: {
  frontmatter: Record<string, unknown>;
  path: string;
}) {
  const type = typeof frontmatter.type === "string" ? frontmatter.type : null;
  const tags: string[] = Array.isArray(frontmatter.tags)
    ? frontmatter.tags.filter((t): t is string => typeof t === "string")
    : [];
  const created = typeof frontmatter.created_at === "string" ? frontmatter.created_at : null;
  const modified = typeof frontmatter.modified === "string" ? frontmatter.modified : null;

  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = tags.length - MAX_VISIBLE_TAGS;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {type && (
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-medium ${TYPE_COLORS[type] || DEFAULT_TYPE_COLOR}`}
        >
          {type}
        </span>
      )}

      {visibleTags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center rounded-full border border-surface-border bg-surface px-2 py-0.5 text-muted-light"
        >
          {tag}
        </span>
      ))}
      {overflowCount > 0 && (
        <span className="text-muted">+{overflowCount}</span>
      )}

      {(created || modified) && (
        <span className="ml-auto text-muted">
          {created && <span>created {relativeDate(created)}</span>}
          {created && modified && <span className="mx-1">·</span>}
          {modified && <span>edited {relativeDate(modified)}</span>}
        </span>
      )}
    </div>
  );
}
