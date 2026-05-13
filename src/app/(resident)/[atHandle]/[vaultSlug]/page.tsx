import { fetchBacklog } from "@/lib/grove-api.v2";
import { CapacityStrip } from "@/components/primitives/capacity-strip";
import ClientShell, { BacklogIsland } from "./_client-shell";

export const metadata = {
  title: "Backlog — Grove",
};

interface PageProps {
  params: Promise<{ atHandle: string; vaultSlug: string }>;
}

/**
 * v2 vault homepage (W2-PAGE-1).
 *
 * Server-renders the cached backlog payload, then composes:
 *
 *   <ClientShell>        ← global keymap + 15s polling
 *     <CapacityStrip />  ← throughput strip (top-of-page)
 *     <BacklogIsland>    ← client-side action handlers + the two lists
 *       <NeedsReviewList />
 *       <BacklogList />
 *     </BacklogIsland>
 *   </ClientShell>
 *
 * Cache wiring (D-13): `fetchBacklog` is a `'use cache'` function tagged
 * `vault:<slug>/backlog`. Server Actions (`runTask`, `deferTask`,
 * `dismissTask`) call `updateTag(...)` on the same tag so the next RSC
 * render serves fresh data — this is what makes the optimistic-UI loop
 * in W2-ACTIONS reconcile correctly against canonical state.
 *
 * Auth + slug shape are handled upstream by the parent layout (`layout.tsx`
 * in this directory) which runs `notFound()` for malformed slugs and
 * lets the page assume a valid `vaultSlug` string.
 *
 * Per-vault membership authorization is intentionally NOT enforced here
 * (parent layout's note already covers this). The mock implementation
 * accepts any slug; the live implementation will surface 401/403 on the
 * fetch itself.
 */
export default async function VaultHomepage({ params }: PageProps) {
  const { vaultSlug } = await params;
  const data = await fetchBacklog(vaultSlug);

  return (
    <ClientShell>
      <main className="min-h-screen bg-cream text-ink">
        <CapacityStrip throughput={data.throughput} planTier={data.planTier} />
        <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-12">
          <BacklogIsland data={data} vaultSlug={vaultSlug} />
        </div>
      </main>
    </ClientShell>
  );
}
