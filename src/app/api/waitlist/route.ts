import { NextRequest, NextResponse } from "next/server";
import { checkSameOrigin } from "@/lib/csrf";
import { bodyLimitErrorResponse, readJsonBody } from "@/lib/body-limit";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

interface WaitlistBody {
  email?: unknown;
  source?: unknown;
}

export async function POST(request: NextRequest) {
  // Same-origin gate. Without this, any third-party page can POST
  // here and forge waitlist signups for arbitrary email addresses.
  // Upstream rate-limits per IP, but defense-in-depth + parity with
  // every other mutating route in this app: cross-origin POSTs get
  // 403'd before they reach the backend.
  const csrf = checkSameOrigin(request);
  if (csrf) {
    return NextResponse.json({ error: "forbidden", reason: csrf }, { status: 403 });
  }

  // Bound the body. Waitlist payloads are tiny (`{email, source}`); the
  // 4 KiB ceiling is well above any legitimate caller.
  let body: WaitlistBody;
  try {
    body = await readJsonBody<WaitlistBody>(request, 4 * 1024);
  } catch (err) {
    const limitResponse = bodyLimitErrorResponse(err);
    if (limitResponse) return limitResponse;
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const res = await fetch(`${API_URL}/waitlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Could not reach server" }, { status: 502 });
  }
}
