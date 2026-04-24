import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";
import SharesTable, { type ShareRow } from "@/components/shares-table";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

async function fetchShares(apiKey: string, vaultSlug: string): Promise<ShareRow[] | null> {
  try {
    // Route via `/v/<slug>/v1/admin/share` so grove-server filters the
    // share list by that vault. The legacy unscoped path would return
    // every share the user created across every vault — showing
    // Personal's shares on test-vault's dashboard.
    const res = await fetch(
      `${API_URL}/v/${encodeURIComponent(vaultSlug)}/v1/admin/share?include_expired=true&limit=100`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
      },
    );
    if (res.status === 401 || res.status === 403) return null;
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.shares) ? (data.shares as ShareRow[]) : [];
  } catch {
    return [];
  }
}

export const metadata = {
  title: "Shares — Grove",
};

interface SharesPageProps {
  params: Promise<{ atHandle: string; vaultSlug: string }>;
}

export default async function SharesPage({ params }: SharesPageProps) {
  const { vaultSlug } = await params;
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) redirect("/login?redirect=/dashboard/access/shares");

  const shares = await fetchShares(apiKey, vaultSlug);
  if (shares === null) redirect("/");

  return <SharesTable initialShares={shares} />;
}
