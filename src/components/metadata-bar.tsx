/**
 * Server component showing note type, tags, and dates.
 */

const TYPE_COLORS: Record<string, string> = {
  concept: "bg-moss/15 text-moss border-moss/15",
  person: "bg-ink/15 text-ink border-ink/15",
  recipe: "bg-harvest/15 text-harvest border-harvest/15",
  project: "bg-ink/15 text-earth border-ink/15",
  company: "bg-harvest/15 text-earth border-harvest/15",
  place: "bg-moss/15 text-earth border-moss/15",
  journal: "bg-ink/5 text-ink/60 border-ink/15",
};

const DEFAULT_TYPE_COLOR = "bg-ink/5 text-ink/60 border-ink/15";

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
    <div className="flex flex-wrap items-center gap-2 text-xs mb-6">
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
          className="inline-flex items-center rounded-full border border-ink/15 bg-ink/5 px-2 py-0.5 text-ink/60"
        >
          {tag}
        </span>
      ))}
      {overflowCount > 0 && (
        <span className="text-ink/40">+{overflowCount}</span>
      )}

      {(created || modified) && (
        <span className="ml-auto text-ink/40">
          {created && <span>created {relativeDate(created)}</span>}
          {created && modified && <span className="mx-1">·</span>}
          {modified && <span>edited {relativeDate(modified)}</span>}
        </span>
      )}
    </div>
  );
}
