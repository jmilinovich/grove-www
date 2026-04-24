/**
 * Deprecated in P20 — keys, scoped keys, shares, members, and health
 * are all vault-scoped now. The component is kept so routes that still
 * import it don't break; it renders nothing.
 *
 * Safe to remove once callers drop the import.
 */
export default function AdminScopeBanner(_props: { vaultSlug: string }) {
  return null;
}
