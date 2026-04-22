import { permanentRedirect, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";
import { resolveScopedRedirect } from "@/lib/bare-redirect";

interface PageProps {
  params: Promise<{ rest?: string[] }>;
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

/**
 * Legacy /dashboard[/...] shim. Resolves the viewer's MRU vault via
 * /v1/me and permanent-redirects into the scoped tree. Preserves the
 * trailing path and query string so deep-links keep working.
 */
export default async function LegacyDashboardRedirect({ params, searchParams }: PageProps) {
  const { rest = [] } = await params;
  const sp = await searchParams;
  const subPath = rest.length > 0 ? "/" + rest.map(encodeURIComponent).join("/") : "";
  const search = searchToString(sp);
  const bare = `/dashboard${subPath}`;

  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) redirect(`/login?redirect=${encodeURIComponent(bare + search)}`);

  const target = await resolveScopedRedirect(apiKey, "/dashboard", subPath, search);
  if (!target) redirect(`/login?redirect=${encodeURIComponent(bare + search)}`);

  permanentRedirect(target);
}
