import { permanentRedirect, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";
import { userScopedPath } from "@/lib/vault-context";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

interface MeLite {
  handle?: string | null;
  username?: string | null;
}

async function fetchViewerHandle(apiKey: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/v1/me`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const me = (await res.json()) as MeLite;
    return me.handle ?? me.username ?? null;
  } catch {
    return null;
  }
}

interface PageProps {
  params: Promise<{ rest?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function searchToString(
  sp: Record<string, string | string[] | undefined>,
): string {
  const entries: Array<[string, string]> = [];
  for (const [k, v] of Object.entries(sp)) {
    if (Array.isArray(v)) for (const item of v) entries.push([k, item]);
    else if (v != null) entries.push([k, v]);
  }
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries).toString();
}

// Bare /settings[/...] is a legacy shim that redirects straight to the
// user-scoped canonical `/@<handle>/settings/<rest>`. No MRU lookup —
// settings pages read /v1/me, which is user-scoped, so there was never a
// vault slug to resolve. The only /settings page today is `/vaults`, so
// bare `/settings` with no sub-path lands on `/@<handle>/settings/vaults`.
export default async function LegacySettingsRedirect({
  params,
  searchParams,
}: PageProps) {
  const { rest = [] } = await params;
  const sp = await searchParams;
  const subPath =
    rest.length > 0 ? "/" + rest.map(encodeURIComponent).join("/") : "";
  const search = searchToString(sp);
  const bare = `/settings${subPath}`;

  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) redirect(`/login?redirect=${encodeURIComponent(bare + search)}`);

  const handle = await fetchViewerHandle(apiKey);
  if (!handle) redirect(`/login?redirect=${encodeURIComponent(bare + search)}`);

  // Bare /settings with no sub-path → user-scoped settings/vaults (the only
  // settings page today). Anything else is passed through as-is so future
  // settings sub-pages work without editing this shim.
  const target =
    subPath === ""
      ? userScopedPath(handle, "/settings/vaults")
      : userScopedPath(handle, `/settings${subPath}`);
  permanentRedirect(target + search);
}
