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
  vi.doMock("next/headers", () => ({
    cookies: async () => ({
      get: (_name: string) => undefined,
    }),
  }));
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.doUnmock("next/headers");
});

describe("/api/me — PATCH (body limit)", () => {
  it("rejects cross-origin PATCH with 403 (CSRF) before any body work", async () => {
    const { calls } = installFetch(() => new Response("{}", { status: 200 }));
    const { PATCH } = await import("@/app/api/me/route");
    const req = new NextRequest(new URL("http://grove.md/api/me"), {
      method: "PATCH",
      headers: {
        host: "grove.md",
        origin: "https://evil.example",
        "content-type": "application/json",
      },
      body: JSON.stringify({ display_name: "x" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(403);
    expect(calls).toHaveLength(0);
  });

  it("rejects oversized body with 413 and never forwards upstream", async () => {
    const { calls } = installFetch(() => new Response("{}", { status: 200 }));
    // Cookie present so we get past the unauthorized gate. Body-size check
    // runs after CSRF, after auth — that's the path we're exercising.
    vi.doMock("next/headers", () => ({
      cookies: async () => ({
        get: (name: string) =>
          name === "__Host-grove_token" ? { value: "stub" } : undefined,
      }),
    }));
    vi.doMock("@/lib/auth", () => ({
      getApiKey: () => "stub-key",
    }));
    const { PATCH } = await import("@/app/api/me/route");
    const giantPayload = JSON.stringify({
      display_name: "ok",
      bio: "A".repeat(128 * 1024),
    });
    const req = new NextRequest(new URL("http://grove.md/api/me"), {
      method: "PATCH",
      headers: {
        host: "grove.md",
        origin: "http://grove.md",
        "content-type": "application/json",
      },
      body: giantPayload,
    });
    const res = await PATCH(req);
    expect(res.status).toBe(413);
    expect(calls).toHaveLength(0);
    vi.doUnmock("@/lib/auth");
  });
});
