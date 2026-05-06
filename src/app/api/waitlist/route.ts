import { NextRequest, NextResponse } from "next/server";
import { checkSameOrigin } from "@/lib/csrf";
import { bodyLimitErrorResponse, readJsonBody } from "@/lib/body-limit";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const NOTIFY_EMAIL = process.env.WAITLIST_NOTIFY_EMAIL ?? "jrmilinovich@gmail.com";
const FROM_EMAIL = process.env.GROVE_FROM_EMAIL ?? "Grove <noreply@grove.md>";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SOURCE_MAX = 64;

interface WaitlistBody {
  email?: unknown;
  source?: unknown;
}

export async function POST(request: NextRequest) {
  // Same-origin gate. Stops third-party pages from forging waitlist
  // submissions from arbitrary email addresses.
  const csrf = checkSameOrigin(request);
  if (csrf) {
    return NextResponse.json({ error: "forbidden", reason: csrf }, { status: 403 });
  }

  // Bound the body. Waitlist payloads are tiny (`{email, source}`); the 4 KiB
  // ceiling is well above any legitimate caller.
  let body: WaitlistBody;
  try {
    body = await readJsonBody<WaitlistBody>(request, 4 * 1024);
  } catch (err) {
    const limitResponse = bodyLimitErrorResponse(err);
    if (limitResponse) return limitResponse;
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const source = typeof body.source === "string" ? body.source.slice(0, SOURCE_MAX) : "landing";

  if (!RESEND_API_KEY) {
    // Dev fallback: log instead of sending. Still returns success so the UI
    // path is identical to prod.
    console.log(`[waitlist] (no RESEND_API_KEY) ${email} via ${source}`);
    return NextResponse.json({ ok: true });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const at = new Date().toISOString();

  const subject = `Grove waitlist: ${email}`;
  const text = [
    `Email:  ${email}`,
    `Source: ${source}`,
    `When:   ${at}`,
    `IP:     ${ip}`,
    `UA:     ${userAgent}`,
  ].join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: NOTIFY_EMAIL,
        reply_to: email,
        subject,
        text,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[waitlist] resend ${res.status}: ${detail}`);
      return NextResponse.json({ error: "delivery_failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[waitlist] fetch failed", err);
    return NextResponse.json({ error: "delivery_failed" }, { status: 502 });
  }
}
