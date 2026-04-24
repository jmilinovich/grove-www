/**
 * Banner shown on dashboard admin tabs when viewing a non-personal
 * vault, listing the surfaces that are *still* cross-vault.
 *
 * As of P20 keys, scoped keys, and shares route via `/v/<slug>/...` and
 * filter by vault_id. Members + health still read from the proxy's
 * default context — the banner now only names those two so users aren't
 * warned about surfaces that already work.
 */
export default function AdminScopeBanner({ vaultSlug }: { vaultSlug: string }) {
  // The personal vault IS the canonical admin surface today, so no
  // banner needed there — it would be a false positive.
  if (vaultSlug === "personal") return null;

  return (
    <div
      role="status"
      className="mb-6 rounded-md border border-harvest/40 bg-harvest/15 px-4 py-3 text-label text-earth"
    >
      <p className="font-medium">Some admin views still show personal-vault data.</p>
      <p className="mt-1 text-earth/60">
        Members and health read from your personal vault regardless of which
        vault you&rsquo;re viewing. Per-vault scoping for those lands next;
        keys, scoped keys, and shares are already vault-scoped.
      </p>
    </div>
  );
}
