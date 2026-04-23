import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";
import { searchNotes } from "@/lib/grove-api";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ results: [] });
  }
  const vaultSlug = request.nextUrl.searchParams.get("vaultSlug") ?? undefined;

  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const results = await searchNotes(q, apiKey, 10, vaultSlug);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 502 });
  }
}
