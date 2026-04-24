import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";
import SharesTable, { type ShareRow } from "@/components/shares-table";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

async function fetchShares(apiKey: string): Promise<ShareRow[] | null> {
  try {
    const res = await fetch(
      `${API_URL}/v1/admin/share?include_expired=true&limit=100`,
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

export default async function SharesPage() {
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) redirect("/login?redirect=/dashboard/access/shares");

  const shares = await fetchShares(apiKey);
  if (shares === null) redirect("/");

  return <SharesTable initialShares={shares} />;
}
