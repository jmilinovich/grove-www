import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";
import { ConnectedVaultsList } from "@/components/connected-vaults-list";
import { scopedPath, bareHandle, type VaultEntry } from "@/lib/vault-context";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";
const PUBLIC_GROVE_URL = process.env.NEXT_PUBLIC_GROVE_URL ?? "https://api.grove.md";

interface MeResponse {
  handle?: string | null;
  username?: string | null;
  vaults?: VaultEntry[];
}

async function fetchMe(apiKey: string): Promise<MeResponse | null> {
  try {
    const res = await fetch(`${API_URL}/v1/me`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as MeResponse;
  } catch {
    return null;
  }
}

export const metadata = {
  title: "Connected vaults — Grove",
};

interface PageProps {
  params: Promise<{ atHandle: string; vaultSlug: string }>;
}

export default async function SettingsVaultsPage({ params }: PageProps) {
  const { atHandle, vaultSlug } = await params;
  const scoped = scopedPath(atHandle, vaultSlug, "/settings/vaults");
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) redirect(`/login?redirect=${encodeURIComponent(scoped)}`);

  const me = await fetchMe(apiKey);
  if (!me) redirect(`/login?redirect=${encodeURIComponent(scoped)}`);

  const vaults = me.vaults ?? [];
  const viewerHandle = me.handle ?? me.username ?? bareHandle(atHandle);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <header className="mb-8">
        <h1 className="font-serif font-medium text-title text-ink">
          Connected vaults
        </h1>
        <p className="mt-1 text-label text-ink/60">
          Every vault you have access to. Add any of them to Claude.ai to
          search and write from there.
        </p>
      </header>

      <ConnectedVaultsList
        vaults={vaults}
        viewerHandle={viewerHandle}
        apiBaseUrl={PUBLIC_GROVE_URL}
      />
    </div>
  );
}
