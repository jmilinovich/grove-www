import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type FetchStub = (input: URL | RequestInfo, init?: RequestInit) => Promise<Response>;

const originalFetch = globalThis.fetch;

interface FetchBehavior {
  whoami: { ok: boolean; trail?: { id: string; name: string } | null };
}

function installFetch(behavior: FetchBehavior): FetchStub {
  const stub: FetchStub = async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (url.includes("/auth/exchange")) {
      return new Response(
        JSON.stringify({
          session_token: "sess-abc",
          user: { id: "user-1" },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
            "set-cookie": "grove_session=abcdef1234567890; Path=/; HttpOnly",
          },
        },
      );
    }

    if (url.endsWith("/keys") || url.includes("/keys?")) {
      return new Response(
        JSON.stringify({ token: "grove_live_tok123" }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }

    if (url.includes("/v1/whoami")) {
      if (!behavior.whoami.ok) {
        return new Response("unauthorized", { status: 401 });
      }
      return new Response(
        JSON.stringify({
          key_id: "k1",
          key_name: "grove-www-1",
          scopes: ["read"],
          vault_id: "v1",
          trail: behavior.whoami.trail ?? null,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }

    throw new Error(`unexpected fetch: ${url}`);
  };

  globalThis.fetch = stub as unknown as typeof fetch;
  return stub;
}

async function callCallback(url: string): Promise<Response> {
  const { GET } = await import("@/app/api/auth/callback/route");
  const request = new NextRequest(new URL(url));
  return GET(request);
}

function locationPath(res: Response): string {
  const loc = res.headers.get("location");
  if (!loc) throw new Error("no location header");
  return new URL(loc).pathname + new URL(loc).search;
}

describe("auth callback redirect by role", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.AUTH_SECRET = "test-secret";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("routes owners to /dashboard", async () => {
    installFetch({ whoami: { ok: true, trail: null } });
    const res = await callCallback("http://localhost/api/auth/callback?code=xyz");
    expect(res.status).toBe(307);
    expect(locationPath(res)).toBe("/dashboard");
  });

  it("routes trail users to /home", async () => {
    installFetch({ whoami: { ok: true, trail: { id: "t1", name: "Research" } } });
    const res = await callCallback("http://localhost/api/auth/callback?code=xyz&trail=t1");
    expect(locationPath(res)).toBe("/home");
  });

  it("honors explicit ?redirect=/profile when same-origin", async () => {
    installFetch({ whoami: { ok: true, trail: null } });
    const res = await callCallback(
      "http://localhost/api/auth/callback?code=xyz&redirect=/profile",
    );
    expect(locationPath(res)).toBe("/profile");
  });

  it("preserves query on ?redirect=/foo?q=bar", async () => {
    installFetch({ whoami: { ok: true, trail: null } });
    const res = await callCallback(
      "http://localhost/api/auth/callback?code=xyz&redirect=" +
        encodeURIComponent("/foo?q=bar"),
    );
    expect(locationPath(res)).toBe("/foo?q=bar");
  });

  it("rejects ?redirect=//evil.com and falls back to role default", async () => {
    installFetch({ whoami: { ok: true, trail: null } });
    const res = await callCallback(
      "http://localhost/api/auth/callback?code=xyz&redirect=" +
        encodeURIComponent("//evil.com"),
    );
    expect(locationPath(res)).toBe("/dashboard");
  });

  it("rejects ?redirect=https://evil.com and falls back to role default", async () => {
    installFetch({ whoami: { ok: true, trail: null } });
    const res = await callCallback(
      "http://localhost/api/auth/callback?code=xyz&redirect=" +
        encodeURIComponent("https://evil.com"),
    );
    expect(locationPath(res)).toBe("/dashboard");
  });

  it("rejects ?redirect=/\\evil.com and falls back to role default", async () => {
    installFetch({ whoami: { ok: true, trail: null } });
    const res = await callCallback(
      "http://localhost/api/auth/callback?code=xyz&redirect=" +
        encodeURIComponent("/\\evil.com"),
    );
    expect(locationPath(res)).toBe("/dashboard");
  });

  it("falls back to role default when whoami fails", async () => {
    // Simulate trail sign-in whose whoami comes back 401; still route safely.
    installFetch({ whoami: { ok: false } });
    const res = await callCallback(
      "http://localhost/api/auth/callback?code=xyz&trail=t1",
    );
    // No role data → treat as owner (no trail) default.
    expect(locationPath(res)).toBe("/dashboard");
  });

  it("redirects missing ?code to /login with error", async () => {
    installFetch({ whoami: { ok: true, trail: null } });
    const res = await callCallback("http://localhost/api/auth/callback");
    expect(locationPath(res)).toBe("/login?error=missing_code");
  });
});
