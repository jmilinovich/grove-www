import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const originalFetch = globalThis.fetch;

type FetchFn = (input: URL | RequestInfo, init?: RequestInit) => Promise<Response>;

function installFetch(fn: FetchFn) {
  globalThis.fetch = fn as unknown as typeof fetch;
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("proxy — scoped share path 410 handling", () => {
  it("returns 410 with noindex headers when upstream reports revoked", async () => {
    installFetch(async (input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      expect(url).toContain("/v1/share/abc123");
      return new Response(
        JSON.stringify({ error: "gone", reason: "revoked", message: "This link has been revoked" }),
        { status: 410, headers: { "content-type": "application/json" } },
      );
    });

    const { default: proxy } = await import("@/proxy");
    const req = new NextRequest(new URL("http://grove.md/@jm/s/abc123"), {
      method: "GET",
    });
    const res = await proxy(req);
    expect(res.status).toBe(410);
    expect(res.headers.get("x-robots-tag")).toMatch(/noindex/i);
    expect(res.headers.get("content-type")).toMatch(/text\/html/);
    const html = await res.text();
    expect(html).toContain("This link has expired");
    expect(html).toContain("revoked");
    expect(html).toContain('name="robots"');
  });

  it("returns 410 with expired copy when reason is expired", async () => {
    installFetch(async () =>
      new Response(
        JSON.stringify({ error: "gone", reason: "expired", message: "This link has expired" }),
        { status: 410, headers: { "content-type": "application/json" } },
      ),
    );

    const { default: proxy } = await import("@/proxy");
    const req = new NextRequest(new URL("http://grove.md/@jm/s/xyz"), {
      method: "GET",
    });
    const res = await proxy(req);
    expect(res.status).toBe(410);
    const html = await res.text();
    expect(html).toContain("This link has expired");
    expect(html).toContain('data-share-reason="expired"');
  });

  it("passes through to Next when upstream share is active (200)", async () => {
    installFetch(async () =>
      new Response(
        JSON.stringify({ id: "ok1", note_path: "a.md", content: "# hi", expires_at: new Date().toISOString(), view_count: 0, max_views: 100 }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const { default: proxy } = await import("@/proxy");
    const req = new NextRequest(new URL("http://grove.md/@jm/s/ok1"), {
      method: "GET",
    });
    const res = await proxy(req);
    // NextResponse.next() returns 200 with a sentinel header; critical thing
    // is it's NOT the 410 short-circuit.
    expect(res.status).not.toBe(410);
    expect(res.headers.get("x-robots-tag")).toBeNull();
  });

  it("passes through to Next on upstream 404 (not_found)", async () => {
    installFetch(async () => new Response(JSON.stringify({ error: "not_found" }), { status: 404 }));
    const { default: proxy } = await import("@/proxy");
    const req = new NextRequest(new URL("http://grove.md/@jm/s/missing"), {
      method: "GET",
    });
    const res = await proxy(req);
    expect(res.status).not.toBe(410);
  });

  it("does not intercept non-GET methods", async () => {
    let fetched = false;
    installFetch(async () => {
      fetched = true;
      return new Response("{}", { status: 410 });
    });
    const { default: proxy } = await import("@/proxy");
    const req = new NextRequest(new URL("http://grove.md/@jm/s/abc"), {
      method: "POST",
    });
    const res = await proxy(req);
    expect(res.status).not.toBe(410);
    expect(fetched).toBe(false);
  });
});
