import { NextRequest, NextResponse } from "next/server";
import { encryptKey } from "@/lib/auth";
import { checkSameOrigin } from "@/lib/csrf";
import { clearSessionCookies, setSessionCookie } from "@/lib/session-cookie";
import { bodyLimitErrorResponse, readJsonBody } from "@/lib/body-limit";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

export async function POST(request: NextRequest) {
  // CSRF / login-CSRF protection. Without this, any page on the
  // internet could force the victim's browser to submit an
  // attacker-controlled api_key and take over the session
  // (attacker's vault, attacker's identity).
  const csrf = checkSameOrigin(request);
  if (csrf) {
    return NextResponse.json({ error: "forbidden", reason: csrf }, { status: 403 });
  }

  let body: { api_key?: unknown };
  try {
    body = await readJsonBody<{ api_key?: unknown }>(request);
  } catch (err) {
    const limitResponse = bodyLimitErrorResponse(err);
    if (limitResponse) return limitResponse;
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }

  try {
    const apiKey = body.api_key;
    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json({ error: "API key is required" }, { status: 400 });
    }

    // Validate the key by hitting an authenticated endpoint
    const cleanKey = apiKey.trim().replace(/\s+/g, "");
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
    setSessionCookie(response, encrypted);

    return response;
  } catch {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // Defense-in-depth on logout: SameSite=strict covers most of this,
  // but explicit same-origin check keeps parity with the rest of the
  // mutating routes.
  const csrf = checkSameOrigin(request);
  if (csrf) {
    return NextResponse.json({ error: "forbidden", reason: csrf }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  // Clear both the prefixed cookie (current rollout) and the legacy
  // unprefixed cookie so a stale legacy session doesn't survive logout
  // during the migration window.
  clearSessionCookies(response);
  return response;
}
