import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";
import LifecycleView, { type GardenDigest } from "@/components/lifecycle-view";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

async function fetchDigest(apiKey: string): Promise<GardenDigest | null> {
  try {
    const res = await fetch(`${API_URL}/v1/status/digest`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export const metadata = {
  title: "Lifecycle — Grove",
};

export default async function LifecyclePage() {
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) redirect("/login?redirect=/dashboard/lifecycle");

  const digest = await fetchDigest(apiKey);

  if (!digest) {
    return (
      <div>
        <h1 className="font-serif font-medium text-xl text-ink mb-8">Garden lifecycle</h1>
        <p className="font-sans text-ink/60">
          Lifecycle data unavailable — the server may still be computing it. Try again in a moment.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif font-medium text-xl text-ink mb-8">Garden lifecycle</h1>
      <LifecycleView digest={digest} />
    </div>
  );
}
