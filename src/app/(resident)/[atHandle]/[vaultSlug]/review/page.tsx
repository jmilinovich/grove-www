import * as groveApi from "@/lib/grove-api.v2";
import { ReviewAllClient } from "./review-all-client";

interface PageProps {
  params: Promise<{ atHandle: string; vaultSlug: string }>;
}

export const metadata = {
  title: "Needs review — Grove",
};

/**
 * W3-REVIEW-1 — "see all" review surface.
 *
 * The vault homepage's NeedsReviewList caps at 5 visible rows and
 * surfaces a "see all N ▸" link when there's more. This page is that
 * destination — every review-state task for the vault, with the same
 * four actions wired through `_actions/review.ts`. No pagination yet
 * (BacklogPayload returns the full list); a windowed fetch lands when
 * the queue regularly exceeds ~50 rows.
 */
export default async function ReviewAllPage({ params }: PageProps) {
  await groveApi.assertV2Authed();
  const { atHandle, vaultSlug } = await params;
  const data = await groveApi.fetchBacklog(vaultSlug);
  const backHref = `/${atHandle}/${vaultSlug}`;

  return (
    <main className="min-h-screen bg-cream text-ink">
      <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-8">
        <header className="flex items-baseline justify-between gap-4">
          <h1 className="font-serif font-medium text-heading text-ink leading-tight">
            needs review
          </h1>
          <a
            href={backHref}
            className="font-sans text-label text-ink/60 hover:text-ink transition-colors"
          >
            back to backlog ▸
          </a>
        </header>
        <ReviewAllClient
          reviewTasks={data.reviewTasks}
          skills={data.skills}
          vaultSlug={vaultSlug}
        />
      </div>
    </main>
  );
}
