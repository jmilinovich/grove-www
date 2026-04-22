import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// End-to-end integration for the post-login flow.
// Simulates the full magic-link round-trip: the user requests a magic link
// with a callback URL, "clicks" the link (GET /api/auth/callback), and we
// assert they land at the correct destination in a single redirect.

const originalFetch = globalThis.fetch;

type FetchStub = (input: URL | RequestInfo, init?: RequestInit) => Promise<Response>;

interface Scenario {
  trail: { id: string; name: string } | null;
}

function installFetch(scenario: Scenario): void {
  const stub: FetchStub = async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    // Magic-link generation proxied through grove-www → grove-api.
    if (url.endsWith("/auth/magic-link")) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (url.includes("/auth/exchange")) {
      return new Response(
        JSON.stringify({
          session_token: "sess-xyz",
          user: { id: scenario.trail ? "user-trail-1" : "user-owner-1" },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
            "set-cookie": "grove_session=e2ee2ee2ee2e; Path=/; HttpOnly",
          },
        },
      );
    }

    if (url.endsWith("/keys")) {
      return new Response(
        JSON.stringify({ token: scenario.trail ? "grove_live_trail" : "grove_live_owner" }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }

    if (url.includes("/v1/whoami")) {
      return new Response(
        JSON.stringify({
          key_id: "k1",
          key_name: "grove-www-e2e",
          scopes: ["read"],
          vault_id: "v1",
          trail: scenario.trail,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }

    if (url.endsWith("/v1/me") || url.includes("/v1/me?")) {
      // Owners always have at least one vault membership after P8-B1.
      return new Response(
        JSON.stringify({
          id: "u-e2e",
          handle: "owner",
          username: "owner",
          vaults: scenario.trail
            ? []
            : [
                {
                  id: "v1",
                  slug: "personal",
                  name: "Personal",
                  role: "owner",
                  owner_handle: "owner",
                  joined_at: "2026-01-01T00:00:00Z",
                  last_active_at: "2026-04-20T00:00:00Z",
                },
              ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }

    throw new Error(`unexpected fetch: ${url}`);
  };

  globalThis.fetch = stub as unknown as typeof fetch;
}

async function requestMagicLink(email: string, callbackUrl: string): Promise<Response> {
  const { POST } = await import("@/app/api/auth/magic-link/route");
  const req = new NextRequest(new URL("http://localhost/api/auth/magic-link"), {
    method: "POST",
    body: JSON.stringify({ email, redirect: callbackUrl }),
    headers: { "content-type": "application/json" },
  });
  return POST(req);
}

async function clickMagicLink(callbackUrl: string): Promise<Response> {
  const { GET } = await import("@/app/api/auth/callback/route");
  const req = new NextRequest(new URL(callbackUrl));
  return GET(req);
}

function locationOf(res: Response): { path: string; search: string } {
  const loc = res.headers.get("location");
  if (!loc) throw new Error("no location header");
  const u = new URL(loc);
  return { path: u.pathname, search: u.search };
}

function buildCallback(query: Record<string, string>): string {
  const url = new URL("http://localhost/api/auth/callback");
  url.searchParams.set("code", "signed-magic-code");
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  return url.toString();
}

describe("post-login e2e: magic link round-trip", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "e2e-secret";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("owner full flow: request → click → scoped dashboard in one redirect", async () => {
    installFetch({ trail: null });

    const callback = buildCallback({});
    const magicRes = await requestMagicLink("owner@example.com", callback);
    expect(magicRes.status).toBe(200);

    const redirect = await clickMagicLink(callback);
    expect(redirect.status).toBe(307);
    const { path } = locationOf(redirect);
    expect(path).toBe("/@owner/personal/dashboard");

    // Session cookie set on the callback response — owner lands authenticated.
    const setCookie = (redirect as NextResponse).cookies.get("grove_token");
    expect(setCookie?.value).toBeTruthy();
  });

  it("trail invitee full flow: invite → click → /home with trail context", async () => {
    installFetch({ trail: { id: "t-research", name: "Research" } });

    const callback = buildCallback({ trail: "t-research" });
    const magicRes = await requestMagicLink("member@example.com", callback);
    expect(magicRes.status).toBe(200);

    const redirect = await clickMagicLink(callback);
    expect(redirect.status).toBe(307);
    const { path } = locationOf(redirect);
    expect(path).toBe("/home");

    const setCookie = (redirect as NextResponse).cookies.get("grove_token");
    expect(setCookie?.value).toBeTruthy();
  });

  it("respects ?redirect=/profile through the full flow", async () => {
    installFetch({ trail: null });

    const callback = buildCallback({ redirect: "/profile" });
    await requestMagicLink("owner@example.com", callback);

    const redirect = await clickMagicLink(callback);
    const { path } = locationOf(redirect);
    expect(path).toBe("/profile");
  });

  it("rejects external ?redirect= and lands at the scoped landing", async () => {
    installFetch({ trail: null });

    const callback = buildCallback({ redirect: "https://evil.com/steal" });
    await requestMagicLink("owner@example.com", callback);

    const redirect = await clickMagicLink(callback);
    const { path } = locationOf(redirect);
    expect(path).toBe("/@owner/personal/dashboard");
  });
});
