import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";
import TrailList from "@/components/trail-list";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

export interface Trail {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  allow_tags: string[];
  deny_tags: string[];
  allow_types: string[];
  deny_types: string[];
  allow_paths: string[];
  deny_paths: string[];
  rate_limit_reads: number | null;
  rate_limit_writes: number | null;
  created_at: string;
}

async function fetchTrails(apiKey: string): Promise<Trail[] | null> {
  const res = await fetch(`${API_URL}/v1/admin/trails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "list" }),
    cache: "no-store",
  });
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) return [];
  const data = await res.json();
  return data.trails ?? [];
}

export const metadata = {
  title: "Scoped Keys — Grove",
};

export default async function TrailsPage() {
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) redirect("/login?redirect=/dashboard/access/trails");

  const trails = await fetchTrails(apiKey);

  if (trails === null) {
    redirect("/");
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <TrailList initialTrails={trails} />
    </div>
  );
}
