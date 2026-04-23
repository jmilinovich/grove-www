import { permanentRedirect } from "next/navigation";
import { userScopedPath } from "@/lib/vault-context";

interface PageProps {
  params: Promise<{ atHandle: string }>;
}

// /@<handle>/settings has no landing of its own today — the only sub-page is
// /vaults. Redirect to it. In production this should be caught by the
// middleware redirect rule before it reaches here, but the page-level shim
// is a safety net (e.g. for tests that load the page module directly, or if
// the middleware matcher is ever narrowed).
export default async function UserSettingsIndexRedirect({ params }: PageProps) {
  const { atHandle } = await params;
  permanentRedirect(userScopedPath(atHandle, "/settings/vaults"));
}
