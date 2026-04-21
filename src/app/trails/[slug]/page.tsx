import { notFound, permanentRedirect } from "next/navigation";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

interface TrailMeta {
  name: string;
  owner_handle: string | null;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchTrailMeta(trailId: string): Promise<TrailMeta | null> {
  try {
    const res = await fetch(
      `${API_URL}/v1/trails/${encodeURIComponent(trailId)}/info`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    return (await res.json()) as TrailMeta;
  } catch {
    return null;
  }
}

// Legacy `/trails/:slug` shim. Canonical URL is
// `/@<owner_handle>/trails/:slug` (P16-2). Resolve the vault owner and
// 308-redirect. Unknown trail → 404; owner unresolvable → 404 rather than
// a broken `/@unknown/...`.
export default async function LegacyTrailPage({ params }: PageProps) {
  const { slug } = await params;
  const meta = await fetchTrailMeta(slug);
  if (!meta || !meta.owner_handle) notFound();
  permanentRedirect(`/@${meta.owner_handle}/trails/${encodeURIComponent(slug)}`);
}
