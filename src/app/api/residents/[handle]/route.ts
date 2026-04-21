import { NextResponse } from "next/server";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

/**
 * Handle availability probe used by the profile handle editor.
 * 200 = handle taken by this user or another resident; 404 = free.
 * Proxy is unauthenticated because `GET /v1/residents/:handle` is public.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ handle: string }> },
) {
  const { handle } = await ctx.params;
  const res = await fetch(
    `${API_URL}/v1/residents/${encodeURIComponent(handle)}`,
    { cache: "no-store" },
  );
  if (res.status === 404) {
    return NextResponse.json({ available: true }, { status: 404 });
  }
  if (!res.ok) {
    return NextResponse.json({ error: "upstream error" }, { status: 502 });
  }
  return NextResponse.json({ available: false }, { status: 200 });
}
