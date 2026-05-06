import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const originalFetch = globalThis.fetch;

type FetchCall = { url: string; init?: RequestInit };

function installFetch(handler: (call: FetchCall) => Response): { calls: FetchCall[] } {
  const calls: FetchCall[] = [];
  globalThis.fetch = (async (input: URL | RequestInfo, init?: RequestInit) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
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

function buildReq(body: unknown, headers: Record<string, string>): NextRequest {
  return new NextRequest(new URL("http://grove.md/api/waitlist"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("/api/waitlist — POST (proxy)", () => {
  it("rejects cross-origin POST with 403 and never forwards upstream", async () => {
    const { calls } = installFetch(() => new Response("{}", { status: 200 }));
    const { POST } = await import("@/app/api/waitlist/route");
    const req = buildReq(
      { email: "user@example.com" },
      { host: "grove.md", origin: "https://evil.example" },
    );
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(calls).toHaveLength(0);
  });

  it("rejects POST with missing Origin header", async () => {
    const { calls } = installFetch(() => new Response("{}", { status: 200 }));
    const { POST } = await import("@/app/api/waitlist/route");
    const req = buildReq({ email: "user@example.com" }, { host: "grove.md" });
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(calls).toHaveLength(0);
  });

  it("rejects oversized body with 413 and never forwards upstream", async () => {
    const { calls } = installFetch(() => new Response("{}", { status: 200 }));
    const { POST } = await import("@/app/api/waitlist/route");
    const giant = JSON.stringify({
      email: "user@example.com",
      junk: "A".repeat(8 * 1024),
    });
    const req = buildReq(giant, { host: "grove.md", origin: "http://grove.md" });
    const res = await POST(req);
    expect(res.status).toBe(413);
    expect(calls).toHaveLength(0);
  });

  it("forwards a valid signup body to the upstream /waitlist endpoint", async () => {
    const { calls } = installFetch(
      () => new Response(JSON.stringify({ ok: true, added: true }), { status: 200 }),
    );
    const { POST } = await import("@/app/api/waitlist/route");
    const req = buildReq(
      { email: "user@example.com", source: "hero" },
      { host: "grove.md", origin: "http://grove.md" },
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toContain("/waitlist");
    expect(JSON.parse(calls[0]!.init!.body as string)).toEqual({
      email: "user@example.com",
      source: "hero",
    });
  });

  it("propagates upstream 400 (invalid email) verbatim", async () => {
    installFetch(
      () => new Response(JSON.stringify({ error: "invalid email" }), { status: 400 }),
    );
    const { POST } = await import("@/app/api/waitlist/route");
    const req = buildReq(
      { email: "nope" },
      { host: "grove.md", origin: "http://grove.md" },
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 502 when upstream is unreachable", async () => {
    globalThis.fetch = (async () => {
      throw new Error("connection refused");
    }) as unknown as typeof fetch;
    const { POST } = await import("@/app/api/waitlist/route");
    const req = buildReq(
      { email: "user@example.com" },
      { host: "grove.md", origin: "http://grove.md" },
    );
    const res = await POST(req);
    expect(res.status).toBe(502);
  });
});
