import { NextRequest, NextResponse } from "next/server";
import { getApiKey } from "@/lib/auth";
import { cookies } from "next/headers";
import { checkSameOrigin } from "@/lib/csrf";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrf = checkSameOrigin(req);
  if (csrf) return NextResponse.json({ error: "forbidden", reason: csrf }, { status: 403 });

  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const res = await fetch(
    `${API_URL}/v1/admin/health/flags/${encodeURIComponent(id)}/resolve`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "request failed" }));
    return NextResponse.json(data, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
