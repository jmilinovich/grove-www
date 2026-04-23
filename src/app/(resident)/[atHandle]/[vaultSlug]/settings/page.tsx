interface PageProps {
  params: Promise<{ atHandle: string; vaultSlug: string }>;
}

export const metadata = {
  title: "Vault settings — Grove",
};

// Vault-scoped settings (P8-B6). There are no per-vault settings pages yet
// — members, integrations, vault name, and retention policy are all future
// phases — but the URL is kept meaningful as an empty-state page rather
// than redirecting to the user-scoped list. The user who clicked "settings"
// while inside a vault shouldn't land on a page that has nothing to do with
// that vault; see SPEC.md P8-B6 design decision #6.
export default async function VaultSettingsEmptyState({ params }: PageProps) {
  const { vaultSlug } = await params;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <header className="mb-8">
        <p className="text-detail uppercase tracking-[0.15em] text-ink/40 mb-3">
          Vault · {vaultSlug}
        </p>
        <h1 className="font-serif font-medium text-title text-ink">
          Vault-level settings coming soon
        </h1>
        <p className="mt-3 text-label text-ink/60 leading-relaxed">
          Members, integrations, vault name, and retention policy will live
          here. For now, account-wide settings (profile, connected vaults)
          are under your handle.
        </p>
      </header>
    </div>
  );
}
