import { permanentRedirect } from "next/navigation";
import { scopedPath } from "@/lib/vault-context";

interface PageProps {
  params: Promise<{ atHandle: string; vaultSlug: string }>;
}

// /@<handle>/<vault>/settings has no landing of its own today — the only
// sub-page is /vaults. Redirect to it so bare `/settings` (which 308s here
// from the legacy shim) doesn't dead-end in a 404.
export default async function SettingsIndexRedirect({ params }: PageProps) {
  const { atHandle, vaultSlug } = await params;
  permanentRedirect(scopedPath(atHandle, vaultSlug, "/settings/vaults"));
}
