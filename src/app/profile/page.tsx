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

// Bare /profile is a legacy shim that redirects straight to the user-scoped
// canonical `/@<handle>/profile`. No MRU lookup — /profile reads /v1/me,
// which is already user-scoped, so the vault slug was never needed. The
// only thing we need from the API is the viewer's handle so we can build
// the `/@<handle>` prefix.
export default async function LegacyProfileRedirect({ searchParams }: PageProps) {
  const sp = await searchParams;
  const search = searchToString(sp);
  const bare = `/profile${search}`;

  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) redirect(`/login?redirect=${encodeURIComponent(bare)}`);

  const handle = await fetchViewerHandle(apiKey);
  if (!handle) redirect(`/login?redirect=${encodeURIComponent(bare)}`);

  permanentRedirect(userScopedPath(handle, "/profile") + search);
}
