import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";

const BETTERSTACK_API = "https://uptime.betterstack.com/api/v2";
const BETTERSTACK_KEY = process.env.BETTERSTACK_API_KEY ?? "";

/** GET /api/admin/betterstack — fetch monitor status from BetterStack */
export async function GET() {
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!BETTERSTACK_KEY) {
    return NextResponse.json({ error: "BETTERSTACK_API_KEY not configured" }, { status: 503 });
  }

  try {
    const res = await fetch(`${BETTERSTACK_API}/monitors`, {
      headers: { Authorization: `Bearer ${BETTERSTACK_KEY}` },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "BetterStack API error" }, { status: res.status });
    }

    const data = await res.json();
    const monitors = (data.data ?? []).map((m: { id: string; attributes: Record<string, unknown> }) => ({
      id: m.id,
      name: m.attributes.pronounceable_name,
      url: m.attributes.url,
      status: m.attributes.status,
      last_checked_at: m.attributes.last_checked_at,
      check_frequency: m.attributes.check_frequency,
      paused: m.attributes.paused,
    }));

    return NextResponse.json({ monitors });
  } catch {
    return NextResponse.json({ error: "Failed to reach BetterStack" }, { status: 502 });
  }
}
