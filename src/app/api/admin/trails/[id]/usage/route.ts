import { type NextRequest, NextResponse } from "next/server";
import { getApiKey } from "@/lib/auth";
import { cookies } from "next/headers";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

/** GET /api/admin/trails/[id]/usage — proxy to grove backend usage endpoint */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;

  const res = await fetch(`${API_URL}/v1/admin/trails/${encodeURIComponent(id)}/usage`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "request failed" }));
    return NextResponse.json(data, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
