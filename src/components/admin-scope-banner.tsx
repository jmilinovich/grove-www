/**
 * Banner shown on dashboard admin tabs (Keys / Trails / Shares / Members /
 * Users / Health) when viewing a non-personal vault.
 *
 * Why: `/v1/admin/*` endpoints are not yet vault-scoped (Part A of the
 * multi-vault rollout shipped data endpoints only — see HANDOFF.md).
 * When the URL says `/@jm/test-vault/dashboard/users`, the table shows
 * the PERSONAL vault's users regardless, because the backend handlers
 * still operate on the proxy's bound vault. This banner tells the user
 * that's expected so they don't file "broken vault switcher" bugs.
 *
 * Goes away automatically once Part B lands and per-vault admin
 * endpoints route like `/v/<slug>/v1/admin/*`.
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
      <p className="font-medium">Admin views are shared across vaults today.</p>
      <p className="mt-1 text-earth/60">
        Keys, scoped keys, shares, members, and health show data from your
        personal vault regardless of which vault you&rsquo;re viewing. Per-vault
        admin lands in the next phase.
      </p>
    </div>
  );
}
