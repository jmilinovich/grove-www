import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";
import { listNotes } from "@/lib/grove-api";

export async function GET(request: NextRequest) {
  const prefix = request.nextUrl.searchParams.get("prefix") ?? "";
  const type = request.nextUrl.searchParams.get("type") ?? undefined;

  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const entries = await listNotes(prefix, apiKey, type);
    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ error: "List failed" }, { status: 502 });
  }
}
