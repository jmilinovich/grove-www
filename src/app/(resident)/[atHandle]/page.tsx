import { notFound } from "next/navigation";
import Link from "next/link";
import {
  fetchResident,
  parseAtHandle,
} from "@/lib/resident-context";

interface PageProps {
  params: Promise<{ atHandle: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { atHandle } = await params;
  const handle = parseAtHandle(atHandle);
  if (!handle) return { title: "Not found — Grove" };
  const resident = await fetchResident(handle);
  if (!resident) return { title: "Not found — Grove" };
  const name = resident.display_name ?? `@${resident.handle}`;
  return {
    title: `${name} — Grove`,
    description:
      resident.bio ??
      `Public profile for @${resident.handle} on Grove.`,
  };
}

export default async function ResidentProfilePage({ params }: PageProps) {
  const { atHandle } = await params;
  const handle = parseAtHandle(atHandle);
  if (!handle) notFound();
  const resident = await fetchResident(handle);
  if (!resident) notFound();

  const displayName = resident.display_name ?? `@${resident.handle}`;

  return (
    <div className="flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.15em] text-ink/40 mb-3">
            Resident
          </p>
          <h1 className="text-2xl font-serif font-medium text-ink tracking-tight">
            {displayName}
          </h1>
          <p className="text-sm text-ink/60 mt-1 font-mono">
            @{resident.handle}
          </p>
          {resident.bio && (
            <p className="text-sm text-ink/70 mt-4 leading-relaxed whitespace-pre-wrap">
              {resident.bio}
            </p>
          )}
          <p className="text-xs text-ink/40 mt-4">
            {resident.note_count}{" "}
            {resident.note_count === 1 ? "note" : "notes"}
            {resident.public_trail_slugs.length > 0 && (
              <>
                {" · "}
                {resident.public_trail_slugs.length}{" "}
                {resident.public_trail_slugs.length === 1
                  ? "public trail"
                  : "public trails"}
              </>
            )}
          </p>
        </div>

        {resident.public_trail_slugs.length > 0 && (
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.15em] text-ink/40 mb-3">
              Public trails
            </p>
            <ul className="space-y-1">
              {resident.public_trail_slugs.map((slug) => (
                <li key={slug}>
                  <Link
                    href={`/@${resident.handle}/trails/${encodeURIComponent(slug)}`}
                    className="text-sm text-moss hover:underline transition-colors"
                  >
                    {slug}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Link
          href={`/login?redirect=${encodeURIComponent(`/@${resident.handle}`)}`}
          className="block w-full bg-ink text-cream rounded px-4 py-3.5 text-sm font-medium text-center hover:bg-earth transition-colors active:scale-[0.98]"
        >
          Sign in to Grove
        </Link>

        <p className="text-xs text-ink/40 mt-8 text-center">
          <Link href="/" className="text-moss hover:underline transition-colors">
            grove.md
          </Link>
        </p>
      </div>
    </div>
  );
}
