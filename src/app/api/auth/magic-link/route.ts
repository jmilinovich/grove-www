import { NextRequest, NextResponse } from "next/server";
import { checkSameOrigin } from "@/lib/csrf";
import { bodyLimitErrorResponse, readJsonBody } from "@/lib/body-limit";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

export async function POST(request: NextRequest) {
  // Same-origin gate. Without this, any third-party page can POST
  // to this route and trigger a magic-link email to an arbitrary
  // address with an attacker-chosen `redirect`. Upstream rate-limits
  // by email, but defense-in-depth + parity with every other mutating
  // route in this app: cross-origin POSTs get 403'd before they
  // reach the backend.
  const csrf = checkSameOrigin(request);
  if (csrf) {
    return NextResponse.json({ error: "forbidden", reason: csrf }, { status: 403 });
  }

  // Bound the body so a same-origin caller can't OOM the function with a
  // multi-megabyte payload before our handler runs. Magic-link payloads are
  // tiny (`{email, redirect}`); the default 64 KiB ceiling is well above any
  // legitimate caller and well below "this hurts memory."
  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch (err) {
    const limitResponse = bodyLimitErrorResponse(err);
    if (limitResponse) return limitResponse;
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
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
