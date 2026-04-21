import { NextRequest, NextResponse } from "next/server";
import { encryptKey } from "@/lib/auth";
import { fetchWhoami, resolveLandingPath, roleFromWhoami } from "@/lib/role";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const trailId = request.nextUrl.searchParams.get("trail");
  const requestedRedirect = request.nextUrl.searchParams.get("redirect");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  }

  try {
    const exchangeRes = await fetch(`${API_URL}/auth/exchange?code=${encodeURIComponent(code)}`);
    if (!exchangeRes.ok) {
      console.error("[auth/callback] exchange failed:", exchangeRes.status);
      return NextResponse.redirect(new URL("/login?error=invalid_code", request.url));
    }

    const { session_token, user } = await exchangeRes.json();

    const setCookieHeader = exchangeRes.headers.get("set-cookie") ?? "";
    const sessionCookie = setCookieHeader.match(/grove_session=([a-f0-9]+)/)?.[1] ?? session_token;

    const keyName = trailId
      ? `grove-www-trail-${user.id}-${Date.now()}`
      : `grove-www-${user.id}-${Date.now()}`;

    const createRes = await fetch(`${API_URL}/keys`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `grove_session=${sessionCookie}`,
      },
      body: JSON.stringify({
        action: "create",
        name: keyName,
        scopes: ["read"],
        trail_id: trailId ?? undefined,
      }),
    });

    if (!createRes.ok) {
      console.error("[auth/callback] key create failed:", createRes.status, await createRes.text());
      return NextResponse.redirect(new URL("/login?error=key_creation_failed", request.url));
    }

    const keyData = await createRes.json();
    const apiKeyToken = keyData.token;

    if (!apiKeyToken) {
      console.error("[auth/callback] key create returned no token");
      return NextResponse.redirect(new URL("/login?error=key_creation_failed", request.url));
    }

    const whoami = await fetchWhoami(apiKeyToken);
    const role = roleFromWhoami(whoami);
    const destination = resolveLandingPath(role, requestedRedirect);

    const encrypted = encryptKey(apiKeyToken);
    const response = NextResponse.redirect(new URL(destination, request.url));
    response.cookies.set("grove_token", encrypted, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err) {
    console.error("[auth/callback] Error:", err);
    return NextResponse.redirect(new URL("/login?error=exchange_failed", request.url));
  }
}
