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

const originalKey = process.env.RESEND_API_KEY;
const originalNotify = process.env.WAITLIST_NOTIFY_EMAIL;

beforeEach(() => {
  vi.resetModules();
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.WAITLIST_NOTIFY_EMAIL = "ops@example.com";
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = originalKey;
  if (originalNotify === undefined) delete process.env.WAITLIST_NOTIFY_EMAIL;
  else process.env.WAITLIST_NOTIFY_EMAIL = originalNotify;
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

describe("/api/waitlist — POST", () => {
  it("rejects cross-origin POST with 403 and never calls Resend", async () => {
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

  it("rejects oversized body with 413 and never calls Resend", async () => {
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

  it("rejects malformed email with 400 and never calls Resend", async () => {
    const { calls } = installFetch(() => new Response("{}", { status: 200 }));
    const { POST } = await import("@/app/api/waitlist/route");
    const req = buildReq(
      { email: "not-an-email" },
      { host: "grove.md", origin: "http://grove.md" },
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it("rejects missing email with 400", async () => {
    const { calls } = installFetch(() => new Response("{}", { status: 200 }));
    const { POST } = await import("@/app/api/waitlist/route");
    const req = buildReq({}, { host: "grove.md", origin: "http://grove.md" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it("forwards a valid signup to Resend with the notify recipient", async () => {
    const { calls } = installFetch(
      () => new Response(JSON.stringify({ id: "msg_123" }), { status: 200 }),
    );
    const { POST } = await import("@/app/api/waitlist/route");
    const req = buildReq(
      { email: "Hello@Example.com  ", source: "hero" },
      { host: "grove.md", origin: "http://grove.md" },
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("https://api.resend.com/emails");

    const headers = (calls[0]!.init!.headers ?? {}) as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer re_test_key");

    const sent = JSON.parse(calls[0]!.init!.body as string) as Record<string, string>;
    expect(sent.to).toBe("ops@example.com");
    expect(sent.reply_to).toBe("hello@example.com");
    expect(sent.subject).toContain("hello@example.com");
    expect(sent.text).toContain("Source: hero");
  });

  it("returns 502 when Resend errors", async () => {
    const { calls } = installFetch(() => new Response("rate limited", { status: 429 }));
    const { POST } = await import("@/app/api/waitlist/route");
    const req = buildReq(
      { email: "user@example.com" },
      { host: "grove.md", origin: "http://grove.md" },
    );
    const res = await POST(req);
    expect(res.status).toBe(502);
    expect(calls).toHaveLength(1);
  });

  it("succeeds without RESEND_API_KEY (dev fallback)", async () => {
    delete process.env.RESEND_API_KEY;
    const { calls } = installFetch(() => new Response("{}", { status: 200 }));
    const { POST } = await import("@/app/api/waitlist/route");
    const req = buildReq(
      { email: "user@example.com" },
      { host: "grove.md", origin: "http://grove.md" },
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(0);
  });
});
