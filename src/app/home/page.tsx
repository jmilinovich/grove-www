import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { getApiKey } from "@/lib/auth";
import { fetchMe, fetchWhoami, roleFromWhoami } from "@/lib/role";
import { resolveScopedRedirect } from "@/lib/bare-redirect";
import { listNotes, type ListEntry } from "@/lib/grove-api";
import HomeSearch from "@/components/home-search";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

interface TrailInfo {
  name: string;
  description: string;
  note_count: number;
  created_at: string;
}

async function fetchTrailInfo(trailId: string): Promise<TrailInfo | null> {
  try {
    const res = await fetch(`${API_URL}/v1/trails/${encodeURIComponent(trailId)}/info`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as TrailInfo;
  } catch {
    return null;
  }
}

async function fetchRecent(apiKey: string): Promise<ListEntry[]> {
  try {
    const entries = await listNotes("", apiKey);
    return entries
      .filter((e) => e.modified_at)
      .sort((a, b) => b.modified_at.localeCompare(a.modified_at))
      .slice(0, 8);
  } catch {
    return [];
  }
}

function relativeTime(iso: string | undefined | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const metadata = {
  title: "Home — Grove",
};

export default async function HomePage() {
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) redirect("/login?redirect=/home");

  const whoami = await fetchWhoami(apiKey);
  if (!whoami) redirect("/login?redirect=/home");

  // Owners go to the scoped dashboard of their MRU vault directly — skip the
  // /dashboard shim hop. Fall through to the shim if MRU resolution fails.
  if (roleFromWhoami(whoami) === "owner") {
    const target = await resolveScopedRedirect(apiKey, "/dashboard", "", "");
    redirect(target ?? "/dashboard");
  }

  const trail = whoami.trail!;
  const [trailInfo, recent, me] = await Promise.all([
    fetchTrailInfo(trail.id),
    fetchRecent(apiKey),
    fetchMe(apiKey),
  ]);

  const mostRecent = recent[0];
  // Scope note links to the trail owner's resident so they don't round-trip
  // through the legacy `[...path]` shim (which races with cookie/context and
  // 404s). Prefer the viewer's own handle, fall back to the vault owner's.
  const handle =
    me?.handle ??
    me?.username ??
    me?.vaults?.[0]?.owner_handle ??
    null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <header className="mb-10">
        <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-3">Your trail</p>
        <h1 className="font-serif font-medium text-3xl text-ink leading-tight">
          {trailInfo?.name ?? trail.name}
        </h1>
        {trailInfo?.description && (
          <p className="mt-3 text-base text-ink/60 leading-relaxed max-w-2xl">
            {trailInfo.description}
          </p>
        )}
      </header>

      <section className="mb-10">
        <HomeSearch trailName={trailInfo?.name ?? trail.name} />
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <div className="border border-surface-border bg-surface rounded-lg p-6">
          <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-3">Notes</p>
          <p className="font-serif font-medium text-heading text-ink">
            {trailInfo?.note_count ?? recent.length}
          </p>
        </div>
        <div className="border border-surface-border bg-surface rounded-lg p-6">
          <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-3">Last activity</p>
          <p className="font-serif font-medium text-heading text-ink">
            {relativeTime(mostRecent?.modified_at)}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-label font-medium text-ink/60 uppercase tracking-wide">Recently updated</h2>
          <Link href="/profile" className="text-detail text-moss hover:underline">
            Profile →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="text-label text-ink/60 border border-surface-border rounded-md px-6 py-6 text-center">
            No notes yet. Check back after your vault syncs.
          </div>
        ) : (
          <ul className="divide-y divide-surface-border border border-surface-border rounded-md">
            {recent.map((n) => {
              const displayPath = n.path.replace(/\.md$/, "");
              const href = handle ? `/@${handle}/${displayPath}` : `/${displayPath}`;
              return (
                <li key={n.path}>
                  <Link
                    href={href}
                    className="flex items-center justify-between px-4 py-3 hover:bg-surface/60 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-label text-ink truncate">{n.name.replace(/\.md$/, "")}</div>
                      <div className="text-detail text-ink/60 mt-0.5 truncate">{displayPath}</div>
                    </div>
                    <span className="text-detail text-ink/40 ml-4 shrink-0">
                      {relativeTime(n.modified_at)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
