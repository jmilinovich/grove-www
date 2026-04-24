import { NextRequest, NextResponse } from "next/server";
import { getApiKey } from "@/lib/auth";
import { cookies } from "next/headers";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

function upstreamTrails(vaultSlug: string | null): string {
  return vaultSlug
    ? `${API_URL}/v/${encodeURIComponent(vaultSlug)}/v1/admin/trails`
    : `${API_URL}/v1/admin/trails`;
}

/** GET /api/admin/trails[?vaultSlug=<slug>] — list trails for a vault. */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const vaultSlug = request.nextUrl.searchParams.get("vaultSlug");
  const res = await fetch(upstreamTrails(vaultSlug), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "list" }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

/** POST /api/admin/trails[?vaultSlug=<slug>] — create/update/delete/enable/disable a trail. */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const vaultSlug = request.nextUrl.searchParams.get("vaultSlug");

  const res = await fetch(upstreamTrails(vaultSlug), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "request failed" }));
    return NextResponse.json(data, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
