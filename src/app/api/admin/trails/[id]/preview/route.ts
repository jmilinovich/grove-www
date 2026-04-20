import { type NextRequest, NextResponse } from "next/server";
import { getApiKey } from "@/lib/auth";
import { cookies } from "next/headers";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

/**
 * GET /api/admin/trails/[id]/preview
 * Proxies query params to the grove backend preview endpoint.
 * `id` is "new" for create-mode previews, or a real trail id when editing.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const qs = req.nextUrl.searchParams.toString();
  const url = `${API_URL}/v1/admin/trails/${encodeURIComponent(id)}/preview${qs ? "?" + qs : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "request failed" }));
    return NextResponse.json(data, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
