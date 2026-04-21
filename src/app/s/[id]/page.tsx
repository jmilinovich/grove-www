import { notFound, permanentRedirect } from "next/navigation";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

interface ShareMeta {
  id: string;
  owner_handle: string | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

async function fetchShareMeta(id: string): Promise<ShareMeta | null> {
  try {
    const res = await fetch(`${API_URL}/v1/share/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as ShareMeta;
  } catch {
    return null;
  }
}

// Legacy `/s/:id` shim. The canonical URL lives at
// `/@<owner_handle>/s/:id` (P16-2). This page resolves the share's owner
// and 308-permanent-redirects to the canonical location. When the share
// has expired or the owner can't be resolved, fall through to the
// existing 404 behavior rather than leaking a `/@unknown/...` URL.
export default async function LegacySharePage({ params }: PageProps) {
  const { id } = await params;
  const meta = await fetchShareMeta(id);
  if (!meta || !meta.owner_handle) notFound();
  permanentRedirect(`/@${meta.owner_handle}/s/${encodeURIComponent(id)}`);
}
