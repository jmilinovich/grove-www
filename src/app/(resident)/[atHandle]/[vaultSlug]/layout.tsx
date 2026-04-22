import { notFound } from "next/navigation";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ atHandle: string; vaultSlug: string }>;
}

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

/**
 * Vault-scope layout for `/@<handle>/<slug>/...`.
 *
 * Keeps the shell thin: the root layout already wraps everything in
 * `AppShell` (Header + Sidebar), and the parent `[atHandle]` layout
 * resolves the resident. This layer just validates the shape of
 * `vaultSlug` — per-vault authorization lives in the pages that fetch
 * vault-scoped data, which surface 401/403 naturally through the grove
 * server. Doing the real membership check here would need an extra
 * /v1/vaults round-trip on every render for no user-visible benefit.
 */
export default async function VaultScopedLayout({ children, params }: LayoutProps) {
  const { vaultSlug } = await params;
  if (!SLUG_RE.test(vaultSlug)) notFound();
  return <>{children}</>;
}
