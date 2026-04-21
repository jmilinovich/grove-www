import { NextRequest, NextResponse } from "next/server";
import { encryptKey } from "@/lib/auth";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

export async function POST(request: NextRequest) {
  try {
    const { api_key } = await request.json();
    if (!api_key || typeof api_key !== "string") {
      return NextResponse.json({ error: "API key is required" }, { status: 400 });
    }

    // Validate the key by hitting an authenticated endpoint
    const cleanKey = api_key.trim().replace(/\s+/g, "");
    const res = await fetch(`${API_URL}/v1/list?prefix=Resources&limit=1`, {
      headers: { Authorization: `Bearer ${cleanKey}` },
    });

    if (res.status === 401) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
    if (!res.ok) {
      return NextResponse.json({ error: "Could not validate key" }, { status: 502 });
    }

    const encrypted = encryptKey(cleanKey);
    const response = NextResponse.json({ ok: true });
    response.cookies.set("grove_token", encrypted, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("grove_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
