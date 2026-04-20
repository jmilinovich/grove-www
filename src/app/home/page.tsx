import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { getApiKey } from "@/lib/auth";
import { fetchWhoami, roleFromWhoami } from "@/lib/role";
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

  // Owners use the full dashboard
  if (roleFromWhoami(whoami) === "owner") redirect("/dashboard");

  const trail = whoami.trail!;
  const [trailInfo, recent] = await Promise.all([
    fetchTrailInfo(trail.id),
    fetchRecent(apiKey),
  ]);

  const mostRecent = recent[0];

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

      <section className="grid grid-cols-2 gap-4 mb-10">
        <div className="border border-surface-border bg-surface rounded-lg p-5">
          <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-3">Notes</p>
          <p className="font-serif font-medium text-2xl text-ink">
            {trailInfo?.note_count ?? recent.length}
          </p>
        </div>
        <div className="border border-surface-border bg-surface rounded-lg p-5">
          <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-3">Last activity</p>
          <p className="font-serif font-medium text-2xl text-ink">
            {relativeTime(mostRecent?.modified_at)}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-ink/60 uppercase tracking-wide">Recently updated</h2>
          <Link href="/profile" className="text-xs text-moss hover:underline">
            Profile →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="text-sm text-ink/50 border border-surface-border rounded px-4 py-6 text-center">
            No notes yet. Check back after your vault syncs.
          </div>
        ) : (
          <ul className="divide-y divide-surface-border border border-surface-border rounded">
            {recent.map((n) => {
              const displayPath = n.path.replace(/\.md$/, "");
              return (
                <li key={n.path}>
                  <Link
                    href={`/${displayPath}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-surface/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-ink truncate">{n.name.replace(/\.md$/, "")}</div>
                      <div className="text-xs text-ink/50 mt-0.5 truncate">{displayPath}</div>
                    </div>
                    <span className="text-xs text-ink/40 ml-4 shrink-0">
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
