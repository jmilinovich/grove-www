import { NextResponse } from "next/server";
import { getApiKey } from "@/lib/auth";
import { cookies } from "next/headers";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

/** GET /api/admin/lifecycle — proxy to grove backend digest endpoint */
export async function GET() {
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const res = await fetch(`${API_URL}/v1/status/digest`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: res.status === 403 ? "forbidden" : "unauthorized" },
      { status: res.status },
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
