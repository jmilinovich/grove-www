import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const originalFetch = globalThis.fetch;

type FetchCall = { url: string; init?: RequestInit };

function installFetch(handler: (call: FetchCall) => Response): { calls: FetchCall[] } {
  const calls: FetchCall[] = [];
  globalThis.fetch = (async (input: URL | RequestInfo, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const call: FetchCall = { url, init };
    calls.push(call);
    return handler(call);
  }) as unknown as typeof fetch;
  return { calls };
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("/api/auth/magic-link — POST (CSRF)", () => {
  it("rejects cross-origin POST with 403 and never forwards upstream", async () => {
    const { calls } = installFetch(() => new Response("{}", { status: 200 }));
    const { POST } = await import("@/app/api/auth/magic-link/route");
    const req = new NextRequest(new URL("http://grove.md/api/auth/magic-link"), {
      method: "POST",
      headers: {
        host: "grove.md",
        origin: "https://evil.example",
        "content-type": "application/json",
      },
      body: JSON.stringify({ email: "victim@example.com", redirect: "/" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(calls).toHaveLength(0);
  });

  it("rejects POST with missing Origin header", async () => {
    const { calls } = installFetch(() => new Response("{}", { status: 200 }));
    const { POST } = await import("@/app/api/auth/magic-link/route");
    const req = new NextRequest(new URL("http://grove.md/api/auth/magic-link"), {
      method: "POST",
      headers: { host: "grove.md", "content-type": "application/json" },
      body: JSON.stringify({ email: "victim@example.com" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(calls).toHaveLength(0);
  });

  it("accepts same-origin POST and forwards body to upstream", async () => {
    const { calls } = installFetch(
      () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const { POST } = await import("@/app/api/auth/magic-link/route");
    const req = new NextRequest(new URL("http://grove.md/api/auth/magic-link"), {
      method: "POST",
      headers: {
        host: "grove.md",
        origin: "http://grove.md",
        "content-type": "application/json",
      },
      body: JSON.stringify({ email: "user@example.com", redirect: "/dashboard" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toContain("/auth/magic-link");
    const forwardedBody = JSON.parse(calls[0]!.init!.body as string);
    expect(forwardedBody).toEqual({ email: "user@example.com", redirect: "/dashboard" });
  });
});
