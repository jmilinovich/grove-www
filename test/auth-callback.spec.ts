import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type FetchStub = (input: URL | RequestInfo, init?: RequestInit) => Promise<Response>;

const originalFetch = globalThis.fetch;

interface FetchBehavior {
  whoami: { ok: boolean; trail?: { id: string; name: string } | null };
  // When omitted the stub returns a single-vault MRU scope under /@test/personal.
  me?: {
    handle?: string;
    username?: string;
    vaults?: Array<{
      id: string;
      slug: string;
      name: string;
      role: "owner" | "member" | "viewer";
      owner_handle: string;
      joined_at?: string;
      last_active_at?: string | null;
    }>;
  } | null;
}

function defaultMe() {
  return {
    id: "u-1",
    handle: "test",
    username: "test",
    vaults: [
      {
        id: "v1",
        slug: "personal",
        name: "Personal",
        role: "owner",
        owner_handle: "test",
        joined_at: "2026-01-01T00:00:00Z",
        last_active_at: "2026-04-20T00:00:00Z",
      },
    ],
  };
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

    if (url.endsWith("/v1/me") || url.includes("/v1/me?")) {
      // Explicit `me: null` signals a 404 — exercises the no-vault fallback.
      if (behavior.me === null) {
        return new Response("not found", { status: 404 });
      }
      const body = behavior.me ?? defaultMe();
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
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

  it("routes owners directly to their MRU vault dashboard", async () => {
    installFetch({ whoami: { ok: true, trail: null } });
    const res = await callCallback("http://localhost/api/auth/callback?code=xyz");
    expect(res.status).toBe(307);
    expect(locationPath(res)).toBe("/@test/personal/dashboard");
  });

  it("picks the vault with the most recent last_active_at", async () => {
    installFetch({
      whoami: { ok: true, trail: null },
      me: {
        handle: "alice",
        vaults: [
          {
            id: "v1",
            slug: "old",
            name: "Old",
            role: "owner",
            owner_handle: "alice",
            joined_at: "2026-01-01T00:00:00Z",
            last_active_at: "2026-02-01T00:00:00Z",
          },
          {
            id: "v2",
            slug: "new",
            name: "New",
            role: "member",
            owner_handle: "bob",
            joined_at: "2026-03-01T00:00:00Z",
            last_active_at: "2026-04-10T00:00:00Z",
          },
        ],
      },
    });
    const res = await callCallback("http://localhost/api/auth/callback?code=xyz");
    expect(locationPath(res)).toBe("/@alice/new/dashboard");
  });

  it("falls back to earliest-joined when no vault has last_active_at", async () => {
    installFetch({
      whoami: { ok: true, trail: null },
      me: {
        handle: "alice",
        vaults: [
          {
            id: "v2",
            slug: "later",
            name: "Later",
            role: "member",
            owner_handle: "bob",
            joined_at: "2026-03-01T00:00:00Z",
            last_active_at: null,
          },
          {
            id: "v1",
            slug: "earlier",
            name: "Earlier",
            role: "owner",
            owner_handle: "alice",
            joined_at: "2026-01-01T00:00:00Z",
            last_active_at: null,
          },
        ],
      },
    });
    const res = await callCallback("http://localhost/api/auth/callback?code=xyz");
    expect(locationPath(res)).toBe("/@alice/earlier/dashboard");
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

  it("rejects ?redirect=//evil.com and falls back to scoped landing", async () => {
    installFetch({ whoami: { ok: true, trail: null } });
    const res = await callCallback(
      "http://localhost/api/auth/callback?code=xyz&redirect=" +
        encodeURIComponent("//evil.com"),
    );
    expect(locationPath(res)).toBe("/@test/personal/dashboard");
  });

  it("rejects ?redirect=https://evil.com and falls back to scoped landing", async () => {
    installFetch({ whoami: { ok: true, trail: null } });
    const res = await callCallback(
      "http://localhost/api/auth/callback?code=xyz&redirect=" +
        encodeURIComponent("https://evil.com"),
    );
    expect(locationPath(res)).toBe("/@test/personal/dashboard");
  });

  it("rejects ?redirect=/\\evil.com and falls back to scoped landing", async () => {
    installFetch({ whoami: { ok: true, trail: null } });
    const res = await callCallback(
      "http://localhost/api/auth/callback?code=xyz&redirect=" +
        encodeURIComponent("/\\evil.com"),
    );
    expect(locationPath(res)).toBe("/@test/personal/dashboard");
  });

  it("falls back to bare /dashboard when whoami and /v1/me both fail", async () => {
    installFetch({ whoami: { ok: false }, me: null });
    const res = await callCallback(
      "http://localhost/api/auth/callback?code=xyz&trail=t1",
    );
    // No role data + no vaults → bare owner default (safe landing).
    expect(locationPath(res)).toBe("/dashboard");
  });

  it("redirects missing ?code to /login with error", async () => {
    installFetch({ whoami: { ok: true, trail: null } });
    const res = await callCallback("http://localhost/api/auth/callback");
    expect(locationPath(res)).toBe("/login?error=missing_code");
  });
});
