/**
 * Server component rendering a path as breadcrumb links.
 */

import Link from "next/link";

export default function Breadcrumbs({
  path,
  atHandle,
  vaultSlug,
}: {
  path: string;
  atHandle?: string;
  vaultSlug?: string;
}) {
  // Strip .md extension
  const clean = path.replace(/\.md$/, "");
  const segments = clean.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  // Breadcrumbs inside a resident-scoped page stay scoped. When a vault slug
  // is provided we drop the breadcrumb root one segment deeper so links stay
  // inside the vault (`/@handle/slug/...`) rather than escaping to the
  // resident landing (`/@handle/...`).
  const prefix = atHandle
    ? vaultSlug
      ? `/@${atHandle}/${vaultSlug}`
      : `/@${atHandle}`
    : "";

  return (
    <nav aria-label="Breadcrumb" className="text-label text-ink/40 mb-4">
      <ol className="flex flex-wrap items-center gap-1">
        {segments.map((segment, i) => {
          const isLast = i === segments.length - 1;
          const href = prefix + "/" + segments.slice(0, i + 1).join("/");

          return (
            <li key={href} className="flex items-center gap-1">
              {i > 0 && (
                <span className="text-ink/15 select-none" aria-hidden>/</span>
              )}
              {isLast ? (
                <span className="text-ink/60 truncate max-w-[200px]">
                  {segment}
                </span>
              ) : (
                <Link
                  href={href}
                  className="hover:text-ink transition-colors truncate max-w-[120px] md:max-w-none"
                >
                  {/* On mobile, hide middle segments when there are 3+ */}
                  <span
                    className={
                      segments.length > 3 && i > 0 && i < segments.length - 1
                        ? "hidden md:inline"
                        : undefined
                    }
                  >
                    {segment}
                  </span>
                  {segments.length > 3 && i > 0 && i < segments.length - 1 && (
                    <span className="md:hidden">...</span>
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
