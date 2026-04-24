import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";
import MembersView from "@/components/members-view";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

interface UserMeta {
  id: string;
  username: string | null;
  email: string | null;
  role: string;
  created_at: string;
  last_login_at: string | null;
  key_count: number;
  trails: string[];
}

interface Trail {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

async function fetchUsers(apiKey: string): Promise<UserMeta[] | null> {
  const res = await fetch(`${API_URL}/v1/admin/users`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });
  if (res.status === 403 || res.status === 401) return null;
  if (!res.ok) return null;
  const data = await res.json();
  return data.users;
}

async function fetchTrails(apiKey: string): Promise<Trail[]> {
  const res = await fetch(`${API_URL}/v1/admin/trails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "list" }),
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.trails ?? [];
}

export const metadata = {
  title: "Members — Grove",
};

export default async function MembersPage() {
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) redirect("/login?redirect=/dashboard/access/members");

  const [users, trails] = await Promise.all([
    fetchUsers(apiKey),
    fetchTrails(apiKey),
  ]);

  if (users === null) {
    redirect("/");
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <MembersView initialUsers={users} trails={trails} />
    </div>
  );
}
