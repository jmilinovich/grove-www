import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";
import ProfileView, { type Profile } from "@/components/profile-view";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

async function fetchProfile(apiKey: string): Promise<Profile | null> {
  const res = await fetch(`${API_URL}/v1/me`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as Profile;
}

export const metadata = {
  title: "Profile — Grove",
};

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) redirect("/login?redirect=/profile");

  const profile = await fetchProfile(apiKey);
  if (!profile) redirect("/login?redirect=/profile");

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <ProfileView initialProfile={profile} />
    </div>
  );
}
