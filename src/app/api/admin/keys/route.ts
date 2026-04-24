import { NextRequest, NextResponse } from "next/server";
import { getApiKey } from "@/lib/auth";
import { cookies } from "next/headers";
import { checkSameOrigin } from "@/lib/csrf";
import { bodyLimitErrorResponse, readJsonBody } from "@/lib/body-limit";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

/**
 * GET /api/admin/keys[?vaultSlug=<slug>] — list API keys.
 * When `vaultSlug` is present we POST `{action: "list", vault_slug}` so
 * grove-server filters by that vault. Without it, grove-server returns
 * every key the caller owns (legacy single-vault behavior).
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const vaultSlug = request.nextUrl.searchParams.get("vaultSlug");
  const body: Record<string, unknown> = { action: "list" };
  if (vaultSlug) body.vault_slug = vaultSlug;

  const res = await fetch(`${API_URL}/keys`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return NextResponse.json({ error: res.status === 403 ? "forbidden" : "unauthorized" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

/**
 * POST /api/admin/keys — create or revoke a key. CSRF-protected.
 * When a `vaultSlug` query param is present the body gets
 * `vault_slug` appended so `action: create` mints the key against
 * that vault instead of the caller's primary vault.
 */
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
  const vaultSlug = request.nextUrl.searchParams.get("vaultSlug");
  const upstreamBody =
    vaultSlug && typeof body === "object" && body !== null
      ? { ...body, vault_slug: vaultSlug }
      : body;

  const res = await fetch(`${API_URL}/keys`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(upstreamBody),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "request failed" }));
    return NextResponse.json(data, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
