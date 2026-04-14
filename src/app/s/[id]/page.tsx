import { notFound } from "next/navigation";
import Link from "next/link";
import { renderMarkdown } from "@/lib/markdown";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

interface ShareData {
  id: string;
  note_path: string;
  title: string | null;
  content: string | null;
  expires_at: string;
  view_count: number;
  max_views: number;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

async function fetchShare(id: string): Promise<ShareData | null> {
  try {
    const res = await fetch(`${API_URL}/v1/share/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const share = await fetchShare(id);
  if (!share) return { title: "Link expired — Grove" };
  return {
    title: `${share.title ?? "Shared note"} — Grove`,
    description: `A shared note from Grove, available until ${new Date(share.expires_at).toLocaleDateString()}.`,
  };
}

export default async function SharePage({ params }: PageProps) {
  const { id } = await params;
  const share = await fetchShare(id);
  if (!share || !share.content) notFound();

  // Strip frontmatter from content before rendering
  const content = share.content.replace(/^---[\s\S]*?---\n*/, "");
  const html = await renderMarkdown(content, {});

  const title = share.title ?? share.note_path.replace(/\.md$/, "").split("/").pop() ?? "Shared note";
  const expiresDate = new Date(share.expires_at);
  const isExpiringSoon = expiresDate.getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto" style={{ maxWidth: 680, padding: "3rem 1.5rem" }}>
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.15em] text-ink/40 mb-3">
            Shared note
            {isExpiringSoon && (
              <span className="ml-2 text-amber-600">
                — expires {expiresDate.toLocaleDateString()}
              </span>
            )}
          </p>
          <h1 className="text-2xl font-serif font-medium text-ink tracking-tight">
            {title}
          </h1>
        </div>

        {/* Note content */}
        <article className="note-content">
          <div
            className="prose prose-lg"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-ink/10">
          <p className="text-xs text-ink/40 text-center">
            Shared via{" "}
            <Link href="/" className="text-moss hover:underline transition-colors">
              grove.md
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
