import { NextRequest, NextResponse } from "next/server";
import { getApiKey } from "@/lib/auth";
import { cookies } from "next/headers";
import { checkSameOrigin } from "@/lib/csrf";
import { bodyLimitErrorResponse, readJsonBody } from "@/lib/body-limit";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

/** GET /api/admin/users — proxy to grove backend */
export async function GET() {
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const res = await fetch(`${API_URL}/v1/admin/users`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: res.status === 403 ? "forbidden" : "unauthorized" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

/** DELETE /api/admin/users?id=<userId> — remove a user. CSRF-protected. */
export async function DELETE(request: NextRequest) {
  const csrf = checkSameOrigin(request);
  if (csrf) return NextResponse.json({ error: "forbidden", reason: csrf }, { status: 403 });

  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const userId = request.nextUrl.searchParams.get("id");
  if (!userId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const res = await fetch(`${API_URL}/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "request failed" }));
    return NextResponse.json(data, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

/** POST /api/admin/users — invite a user. CSRF-protected. */
export async function POST(request: NextRequest) {
  const csrf = checkSameOrigin(request);
  if (csrf) return NextResponse.json({ error: "forbidden", reason: csrf }, { status: 403 });

  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch (err) {
    const limitResponse = bodyLimitErrorResponse(err);
    if (limitResponse) return limitResponse;
    throw err;
  }

  const res = await fetch(`${API_URL}/v1/admin/invite`, {
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
