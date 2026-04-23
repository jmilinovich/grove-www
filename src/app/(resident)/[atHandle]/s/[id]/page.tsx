import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { renderMarkdown } from "@/lib/markdown";
import { bareHandle } from "@/lib/vault-context";

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

type FetchResult =
  | { kind: "ok"; share: ShareData }
  | { kind: "gone"; reason: "expired" | "revoked"; expires_at: string | null; revoked_at: string | null }
  | { kind: "not_found" };

interface PageProps {
  params: Promise<{ atHandle: string; id: string }>;
}

async function fetchShare(id: string): Promise<FetchResult> {
  try {
    const res = await fetch(`${API_URL}/v1/share/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    if (res.status === 410) {
      const body = await res.json().catch(() => ({}));
      const reason = body?.reason === "revoked" ? "revoked" : "expired";
      return {
        kind: "gone",
        reason,
        expires_at: typeof body?.expires_at === "string" ? body.expires_at : null,
        revoked_at: typeof body?.revoked_at === "string" ? body.revoked_at : null,
      };
    }
    if (!res.ok) return { kind: "not_found" };
    const share = (await res.json()) as ShareData;
    return { kind: "ok", share };
  } catch {
    return { kind: "not_found" };
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await fetchShare(id);
  if (result.kind === "gone") {
    return {
      title: "Expired link · Grove",
      robots: { index: false, follow: false },
    };
  }
  if (result.kind === "not_found") {
    return { title: "Link not found · Grove", robots: { index: false, follow: false } };
  }
  const share = result.share;
  return {
    title: `${share.title ?? "Shared note"} — Grove`,
    description: `A shared note from Grove, available until ${new Date(share.expires_at).toLocaleDateString()}.`,
  };
}

export default async function ScopedSharePage({ params }: PageProps) {
  const { atHandle, id } = await params;
  const result = await fetchShare(id);

  if (result.kind === "not_found") notFound();

  if (result.kind === "gone") {
    return <ExpiredPage atHandle={atHandle} reason={result.reason} expiresAt={result.expires_at} />;
  }

  const share = result.share;
  if (!share.content) notFound();

  const content = share.content.replace(/^---[\s\S]*?---\n*/, "");
  const html = await renderMarkdown(content, {});

  const title =
    share.title ??
    share.note_path.replace(/\.md$/, "").split("/").pop() ??
    "Shared note";
  const expiresDate = new Date(share.expires_at);
  const isExpiringSoon =
    expiresDate.getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-[680px] px-6 py-12">
        <div className="mb-8">
          <p className="text-detail uppercase tracking-[0.15em] text-ink/40 mb-3">
            Shared note
            {isExpiringSoon && (
              <span className="ml-2 text-harvest">
                — expires {expiresDate.toLocaleDateString()}
              </span>
            )}
          </p>
          <h1 className="text-heading font-serif font-medium text-ink tracking-tight">
            {title}
          </h1>
        </div>

        <article className="note-content">
          <div
            className="prose prose-lg"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>

        <div className="mt-12 pt-6 border-t border-ink/15">
          <p className="text-detail text-ink/40 text-center">
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

function ExpiredPage({
  atHandle,
  reason,
  expiresAt,
}: {
  atHandle: string;
  reason: "expired" | "revoked";
  expiresAt: string | null;
}) {
  const bare = bareHandle(atHandle);
  const handlePath = `/@${bare}`;
  const displayHandle = `@${bare}`;
  const subline =
    reason === "revoked"
      ? "This link was revoked."
      : expiresAt
        ? `This link expired on ${new Date(expiresAt).toLocaleDateString()}.`
        : "This link has expired.";

  return (
    <div className="min-h-screen bg-cream" data-share-status="gone" data-share-reason={reason}>
      <div className="mx-auto max-w-[560px] px-6 py-20">
        <p className="text-detail uppercase tracking-[0.15em] text-ink/40 mb-3">
          Shared note
        </p>
        <h1 className="text-heading font-serif font-medium text-ink tracking-tight mb-2">
          This link has expired
        </h1>
        <p className="text-ink/60 mb-8">{subline}</p>
        <p className="text-sm text-ink/60">
          Visit{" "}
          <Link href={handlePath} className="text-moss hover:underline transition-colors">
            {displayHandle}
          </Link>{" "}
          to see their public notes.
        </p>
      </div>
    </div>
  );
}
