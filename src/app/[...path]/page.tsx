import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

interface MeResponse {
  handle?: string | null;
  username?: string | null;
}

async function fetchMyHandle(apiKey: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/v1/me`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const me = (await res.json()) as MeResponse;
    return me.handle ?? me.username ?? null;
  } catch {
    return null;
  }
}

interface PageProps {
  params: Promise<{ path: string[] }>;
}

// Legacy unscoped note path shim (P16-3). Canonical URLs now live under
// `/@<handle>/...`. Signed-in users are 307-redirected to their own scoped
// URL so existing bookmarks keep working. Signed-out visitors keep the
// prior 404 behavior — note content is auth-gated, there's no handle to
// scope the redirect to, and leaking handles publicly isn't the goal of
// this catch-all.
export default async function LegacyNotePage({ params }: PageProps) {
  const { path } = await params;

  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) notFound();

  const handle = await fetchMyHandle(apiKey);
  if (!handle) notFound();

  // Preserve path encoding: decode each segment (Next pre-decodes once),
  // then re-encode so special characters survive the redirect.
  const joined = path
    .map((seg) => encodeURIComponent(decodeURIComponent(seg)))
    .join("/");
  redirect(`/@${handle}/${joined}`);
}
