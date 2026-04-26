import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";
import { checkSameOrigin } from "@/lib/csrf";
import { bodyLimitErrorResponse, readJsonBody } from "@/lib/body-limit";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

export async function GET() {
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const res = await fetch(`${API_URL}/v1/me`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({ error: "request failed" }));
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(request: NextRequest) {
  const csrf = checkSameOrigin(request);
  if (csrf) return NextResponse.json({ error: "forbidden", reason: csrf }, { status: 403 });

  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Bound the body. /v1/me PATCH payloads are tiny (handle, display_name,
  // bio, etc.); without a ceiling a same-origin caller can spam multi-MB
  // bodies and exhaust function memory before any handler logic runs.
  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch (err) {
    const limitResponse = bodyLimitErrorResponse(err);
    if (limitResponse) return limitResponse;
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const res = await fetch(`${API_URL}/v1/me`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ error: "request failed" }));
  return NextResponse.json(data, { status: res.status });
}
