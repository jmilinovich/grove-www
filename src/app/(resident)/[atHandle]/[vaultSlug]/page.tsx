import ClientShell from "./_client-shell";

export const metadata = {
  title: "Backlog — Grove",
};

interface PageProps {
  params: Promise<{ atHandle: string; vaultSlug: string }>;
}

/**
 * v2 vault homepage — server component scaffold (W1-ROUTE-1).
 *
 * Lives at `/@<atHandle>/<vaultSlug>`. This route did not exist before
 * W1 — v1 currently lands on `/dashboard`. W3-SWAP-1 is the single PR
 * that promotes this route to the canonical landing surface.
 *
 * In W1 the body is intentionally a placeholder. W2-PAGE-1 replaces
 * the inner card with the real backlog composition
 * (`<CapacityStrip />`, `<NeedsReviewList />`, `<BacklogList />`).
 * Auth + slug validation are handled upstream by the parent layout
 * (`layout.tsx` in this directory), so this page just renders.
 *
 * Architecture note (Architect panel, D):
 * The placeholder is server-rendered; the client island
 * (`<ClientShell>`) wraps it to mount `useBacklogPolling()` and the
 * global keyboard shortcuts. Keeping the server/client seam at the
 * shell boundary preserves RSC streaming for everything else W2 adds
 * on top.
 */
export default async function VaultHomepage({ params }: PageProps) {
  const { vaultSlug } = await params;

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <ClientShell>
        <section
          aria-label="v2 dashboard placeholder"
          className="rounded-lg border border-ink/15 bg-paper px-6 py-10"
        >
          <p className="text-detail uppercase tracking-[0.15em] text-ink/40 mb-3">
            Vault · {vaultSlug}
          </p>
          <h1 className="font-serif font-medium text-title text-ink">
            v2 dashboard — under construction (W2 will fill this in)
          </h1>
          <p className="mt-3 text-label text-ink/60 leading-relaxed">
            The new backlog homepage scaffold is in place. The real
            composition — capacity strip, needs-review list, and backlog
            list — lands in W2.
          </p>
        </section>
      </ClientShell>
    </main>
  );
}
