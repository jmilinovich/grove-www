import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";
import { userScopedPath } from "@/lib/vault-context";
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

interface PageProps {
  params: Promise<{ atHandle: string }>;
}

// User-scoped profile page (P8-B6). Lives at /@<handle>/profile — hoisted out
// of the vault-scoped subtree because /v1/me has no vault dimension.
export default async function ProfilePage({ params }: PageProps) {
  const { atHandle } = await params;
  const loginRedirect = `/login?redirect=${encodeURIComponent(
    userScopedPath(atHandle, "/profile"),
  )}`;
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) redirect(loginRedirect);

  const profile = await fetchProfile(apiKey);
  if (!profile) redirect(loginRedirect);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <ProfileView initialProfile={profile} />
    </div>
  );
}
