import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";
import {
  fetchResident,
  parseAtHandle,
  type ResidentProfile,
} from "@/lib/resident-context";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ atHandle: string }>;
}

/**
 * Resident layout — validates the `@handle` segment, resolves the resident
 * profile, and (for signed-out visitors) renders a small header chip so
 * nested pages have visible resident context. For signed-in viewers the
 * full AppShell chrome from the root layout is already showing the user's
 * identity + navigation, so ResidentBar would be redundant and is skipped.
 *
 * Handle-history redirect (old handle → current) is intentionally deferred
 * until the resident API exposes the mapping (see PLAN.md P16-5).
 */
export default async function ResidentLayout({ children, params }: LayoutProps) {
  const { atHandle } = await params;
  const handle = parseAtHandle(atHandle);
  if (!handle) notFound();

  const resident = await fetchResident(handle);
  if (!resident) notFound();

  const cookieStore = await cookies();
  const signedIn = Boolean(getApiKey(cookieStore));

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!signedIn && <ResidentBar resident={resident} />}
      {children}
    </div>
  );
}

function ResidentBar({ resident }: { resident: ResidentProfile }) {
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-2 border-b border-surface-border bg-background text-detail text-muted">
      <Link
        href={`/@${resident.handle}`}
        className="inline-flex items-center gap-2 font-mono text-foreground hover:text-accent transition-colors"
      >
        <span aria-hidden="true">@</span>
        <span>{resident.handle}</span>
      </Link>
      <Link href="/" className="text-muted hover:text-foreground transition-colors">
        grove.md
      </Link>
    </div>
  );
}
