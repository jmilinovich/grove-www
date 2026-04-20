import { NextRequest, NextResponse } from "next/server";
import { getApiKey } from "@/lib/auth";
import { cookies } from "next/headers";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

/** GET /api/admin/keys — list API keys */
export async function GET() {
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const res = await fetch(`${API_URL}/keys`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: res.status === 403 ? "forbidden" : "unauthorized" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

/** POST /api/admin/keys — create or revoke a key */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();

  const res = await fetch(`${API_URL}/keys`, {
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
