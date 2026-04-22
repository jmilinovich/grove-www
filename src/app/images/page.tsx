import { permanentRedirect, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";
import { resolveScopedRedirect } from "@/lib/bare-redirect";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function searchToString(sp: Record<string, string | string[] | undefined>): string {
  const entries: Array<[string, string]> = [];
  for (const [k, v] of Object.entries(sp)) {
    if (Array.isArray(v)) for (const item of v) entries.push([k, item]);
    else if (v != null) entries.push([k, v]);
  }
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries).toString();
}

export default async function LegacyImagesRedirect({ searchParams }: PageProps) {
  const sp = await searchParams;
  const search = searchToString(sp);
  const bare = `/images${search}`;

  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) redirect(`/login?redirect=${encodeURIComponent(bare)}`);

  const target = await resolveScopedRedirect(apiKey, "/images", "", search);
  if (!target) redirect(`/login?redirect=${encodeURIComponent(bare)}`);

  permanentRedirect(target);
}
