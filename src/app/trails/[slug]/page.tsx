import Link from "next/link";
import { notFound } from "next/navigation";
import CopyButton from "./copy-button";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";
const GROVE_URL = process.env.NEXT_PUBLIC_GROVE_URL ?? "https://api.grove.md";

interface TrailInfo {
  name: string;
  description: string;
  note_count: number;
  created_at: string;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchTrailInfo(trailId: string): Promise<TrailInfo | null> {
  try {
    const res = await fetch(`${API_URL}/v1/trails/${encodeURIComponent(trailId)}/info`, {
      next: { revalidate: 60 },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const trail = await fetchTrailInfo(slug);
  if (!trail) return { title: "Trail not found — Grove" };
  return {
    title: `${trail.name} — Grove`,
    description: trail.description || `A shared knowledge trail with ${trail.note_count} notes.`,
  };
}

export default async function TrailPage({ params }: PageProps) {
  const { slug } = await params;
  const trail = await fetchTrailInfo(slug);
  if (!trail) notFound();

  const mcpConfig = JSON.stringify(
    {
      mcpServers: {
        grove: {
          url: `${GROVE_URL}/mcp`,
          headers: {
            Authorization: "Bearer <your-api-key>",
          },
        },
      },
    },
    null,
    2,
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-cream">
      <div className="w-full max-w-md">
        {/* Trail card */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.15em] text-ink/40 mb-3">
            Shared trail
          </p>
          <h1 className="text-2xl font-serif font-medium text-ink tracking-tight">
            {trail.name}
          </h1>
          {trail.description && (
            <p className="text-sm text-ink/60 mt-2 leading-relaxed">
              {trail.description}
            </p>
          )}
          <p className="text-xs text-ink/40 mt-3">
            {trail.note_count} {trail.note_count === 1 ? "note" : "notes"}
          </p>
        </div>

        {/* Sign in button */}
        <Link
          href={`/login?trail=${encodeURIComponent(slug)}`}
          className="block w-full bg-ink text-cream rounded px-4 py-3.5 text-sm font-medium text-center hover:bg-earth transition-colors active:scale-[0.98]"
        >
          Sign in to browse
        </Link>

        {/* MCP config */}
        <div className="mt-8">
          <p className="text-xs uppercase tracking-[0.15em] text-ink/40 mb-3">
            Connect via MCP
          </p>
          <div className="relative">
            <pre className="bg-code-bg text-code-fg rounded-lg p-4 text-xs font-mono overflow-x-auto leading-relaxed">
              {mcpConfig}
            </pre>
            <CopyButton text={mcpConfig} />
          </div>
          <p className="text-xs text-ink/40 mt-2">
            Replace <code className="bg-surface border border-surface-border rounded px-1 py-0.5 text-detail">&lt;your-api-key&gt;</code> with the key from your invite email.
          </p>
        </div>

        <p className="text-xs text-ink/40 mt-8 text-center">
          <Link href="/" className="text-moss hover:underline transition-colors">
            grove.md
          </Link>
        </p>
      </div>
    </div>
  );
}
