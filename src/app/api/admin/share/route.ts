import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";
import { checkSameOrigin } from "@/lib/csrf";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

/** GET /api/admin/share — list share links for the authenticated owner. */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const upstream = new URL(`${API_URL}/v1/admin/share`);
  for (const key of ["note_path", "include_expired", "limit"] as const) {
    const v = request.nextUrl.searchParams.get(key);
    if (v !== null) upstream.searchParams.set(key, v);
  }

  const res = await fetch(upstream, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const data = await res.json().catch(() => ({ error: "request failed" }));
  return NextResponse.json(data, { status: res.status });
}

/** POST /api/admin/share — mint a share link. CSRF-protected. */
export async function POST(request: NextRequest) {
  const csrf = checkSameOrigin(request);
  if (csrf) return NextResponse.json({ error: "forbidden", reason: csrf }, { status: 403 });

  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Forward through the vault-scoped path when the caller was inside a
  // vault. Without this the mint lands on grove-server's default
  // context (the token's bound vault) and the share DB row ends up
  // anchored to the wrong vault.
  const vaultSlug = request.nextUrl.searchParams.get("vaultSlug");
  const upstream = vaultSlug
    ? `${API_URL}/v/${encodeURIComponent(vaultSlug)}/v1/admin/share`
    : `${API_URL}/v1/admin/share`;

  const res = await fetch(upstream, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({ error: "request failed" }));
  return NextResponse.json(data, { status: res.status });
}
