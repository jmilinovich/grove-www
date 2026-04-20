import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";
import KeyTable from "@/components/key-table";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

interface KeyMeta {
  id: string;
  name: string;
  scopes: string | string[];
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

async function fetchKeys(apiKey: string): Promise<KeyMeta[] | null> {
  const res = await fetch(`${API_URL}/keys`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "list" }),
    cache: "no-store",
  });
  if (res.status === 403 || res.status === 401) return null;
  if (!res.ok) return null;
  const data = await res.json();
  return data.keys ?? [];
}

export const metadata = {
  title: "API Keys — Grove",
};

export default async function KeysPage() {
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) redirect("/login?redirect=/dashboard/keys");

  const keys = await fetchKeys(apiKey);

  if (keys === null) {
    redirect("/");
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <KeyTable initialKeys={keys} />
    </div>
  );
}
