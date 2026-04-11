import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(`${API_URL}/auth/magic-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Could not reach server" }, { status: 502 });
  }
}
