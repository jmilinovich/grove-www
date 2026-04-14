import { NextRequest, NextResponse } from "next/server";
import { encryptKey } from "@/lib/auth";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const trailId = request.nextUrl.searchParams.get("trail");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  }

  try {
    // Exchange the auth code for a session
    const exchangeRes = await fetch(`${API_URL}/auth/exchange?code=${encodeURIComponent(code)}`);
    if (!exchangeRes.ok) {
      return NextResponse.redirect(new URL("/login?error=invalid_code", request.url));
    }

    const { session_token, user } = await exchangeRes.json();

    // Extract the session cookie from the exchange response to use for key creation
    const setCookieHeader = exchangeRes.headers.get("set-cookie") ?? "";
    const sessionCookie = setCookieHeader.match(/grove_session=([a-f0-9]+)/)?.[1] ?? session_token;

    // Check if this user already has a grove-www key (possibly trail-scoped)
    const keyName = trailId ? `grove-www-trail-${user.id}` : `grove-www-${user.id}`;

    const listRes = await fetch(`${API_URL}/keys`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `grove_session=${sessionCookie}`,
      },
      body: JSON.stringify({ action: "list" }),
    });

    let apiKeyToken: string | null = null;

    if (listRes.ok) {
      const { keys } = await listRes.json();
      const existingKey = keys?.find((k: { name: string }) => k.name === keyName);

      if (!existingKey) {
        // Create an API key for this user's web sessions
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

        if (createRes.ok) {
          const keyData = await createRes.json();
          apiKeyToken = keyData.token;
        }
      }
    }

    // If we couldn't create/find a key, try creating one anyway
    if (!apiKeyToken) {
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

      if (createRes.ok) {
        const keyData = await createRes.json();
        apiKeyToken = keyData.token;
      }
    }

    if (!apiKeyToken) {
      return NextResponse.redirect(new URL("/login?error=key_creation_failed", request.url));
    }

    // Encrypt the API key into the grove_token cookie
    const encrypted = encryptKey(apiKeyToken);
    const destination = trailId ? `/trails/${encodeURIComponent(trailId)}` : "/";
    const response = NextResponse.redirect(new URL(destination, request.url));
    response.cookies.set("grove_token", encrypted, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err) {
    console.error("[auth/callback] Error:", err);
    return NextResponse.redirect(new URL("/login?error=exchange_failed", request.url));
  }
}
