import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";
import { fetchNote, AuthError } from "@/lib/grove-api";

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }
  const vaultSlug = request.nextUrl.searchParams.get("vaultSlug") ?? undefined;

  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const note = await fetchNote(path, apiKey, vaultSlug);
    if (!note) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(note);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }
}
