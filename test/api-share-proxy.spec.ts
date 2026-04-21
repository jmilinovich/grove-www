import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const originalFetch = globalThis.fetch;

const cookiesStore = {
  get: vi.fn<(name: string) => { value: string } | undefined>(() => undefined),
};

vi.mock("next/headers", () => ({
  cookies: async () => cookiesStore,
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    getApiKey: (store: { get: (n: string) => { value: string } | undefined }) => {
      const c = store.get("grove_token");
      return c?.value ? c.value : null;
    },
  };
});

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

function signedIn(token = "grove_live_tok_abc") {
  cookiesStore.get.mockReturnValue({ value: token });
}

function signedOut() {
  cookiesStore.get.mockReturnValue(undefined);
}

beforeEach(() => {
  vi.resetModules();
  cookiesStore.get.mockReset();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("/api/admin/share — GET list", () => {
  it("returns 401 without a session cookie", async () => {
    signedOut();
    installFetch(() => new Response("{}", { status: 200 }));
    const { GET } = await import("@/app/api/admin/share/route");
    const req = new NextRequest(new URL("http://localhost/api/admin/share"));
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("forwards note_path / include_expired / limit and passes status through", async () => {
    signedIn("grove_live_tok_1");
    const { calls } = installFetch(() =>
      new Response(JSON.stringify({ shares: [], next_cursor: null }), { status: 200 }),
    );
    const { GET } = await import("@/app/api/admin/share/route");
    const url = new URL(
      "http://localhost/api/admin/share?note_path=foo.md&include_expired=true&limit=25&ignored=x",
    );
    const res = await GET(new NextRequest(url));
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(1);
    const forwarded = new URL(calls[0]!.url);
    expect(forwarded.pathname).toBe("/v1/admin/share");
    expect(forwarded.searchParams.get("note_path")).toBe("foo.md");
    expect(forwarded.searchParams.get("include_expired")).toBe("true");
    expect(forwarded.searchParams.get("limit")).toBe("25");
    expect(forwarded.searchParams.get("ignored")).toBeNull();
    const authz = (calls[0]!.init?.headers as Record<string, string>)?.["Authorization"];
    expect(authz).toBe("Bearer grove_live_tok_1");
  });

  it("propagates upstream error status and body", async () => {
    signedIn();
    installFetch(() =>
      new Response(JSON.stringify({ error: "forbidden" }), { status: 403 }),
    );
    const { GET } = await import("@/app/api/admin/share/route");
    const res = await GET(new NextRequest(new URL("http://localhost/api/admin/share")));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toEqual({ error: "forbidden" });
  });
});

describe("/api/admin/share — POST create (CSRF)", () => {
  it("rejects cross-origin POST with 403", async () => {
    signedIn();
    const calls = installFetch(() => new Response("{}", { status: 200 }));
    const { POST } = await import("@/app/api/admin/share/route");
    const req = new NextRequest(new URL("http://grove.md/api/admin/share"), {
      method: "POST",
      headers: {
        host: "grove.md",
        origin: "https://evil.example",
        "content-type": "application/json",
      },
      body: JSON.stringify({ note_path: "a.md" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(calls.calls).toHaveLength(0);
  });

  it("rejects POST with missing Origin header", async () => {
    signedIn();
    const calls = installFetch(() => new Response("{}", { status: 200 }));
    const { POST } = await import("@/app/api/admin/share/route");
    const req = new NextRequest(new URL("http://grove.md/api/admin/share"), {
      method: "POST",
      headers: { host: "grove.md", "content-type": "application/json" },
      body: JSON.stringify({ note_path: "a.md" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(calls.calls).toHaveLength(0);
  });

  it("accepts same-origin POST and forwards Bearer + body", async () => {
    signedIn("grove_live_tok_2");
    const { calls } = installFetch(
      () =>
        new Response(JSON.stringify({ id: "abc", url: "https://grove.md/@jm/s/abc" }), {
          status: 200,
        }),
    );
    const { POST } = await import("@/app/api/admin/share/route");
    const req = new NextRequest(new URL("http://grove.md/api/admin/share"), {
      method: "POST",
      headers: {
        host: "grove.md",
        origin: "http://grove.md",
        "content-type": "application/json",
      },
      body: JSON.stringify({ note_path: "a.md", ttl_days: 7, max_views: null }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(1);
    const init = calls[0]!.init!;
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer grove_live_tok_2");
    const forwardedBody = JSON.parse(init.body as string);
    expect(forwardedBody).toEqual({ note_path: "a.md", ttl_days: 7, max_views: null });
  });

  it("returns 401 when signed out, even with valid Origin", async () => {
    signedOut();
    const { calls } = installFetch(() => new Response("{}", { status: 200 }));
    const { POST } = await import("@/app/api/admin/share/route");
    const req = new NextRequest(new URL("http://grove.md/api/admin/share"), {
      method: "POST",
      headers: {
        host: "grove.md",
        origin: "http://grove.md",
        "content-type": "application/json",
      },
      body: JSON.stringify({ note_path: "a.md" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(calls).toHaveLength(0);
  });
});

describe("/api/admin/share/[id] — DELETE revoke (CSRF)", () => {
  it("rejects cross-origin DELETE with 403", async () => {
    signedIn();
    const calls = installFetch(() => new Response("{}", { status: 200 }));
    const { DELETE } = await import("@/app/api/admin/share/[id]/route");
    const req = new NextRequest(new URL("http://grove.md/api/admin/share/abc"), {
      method: "DELETE",
      headers: { host: "grove.md", origin: "https://evil.example" },
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: "abc" }) });
    expect(res.status).toBe(403);
    expect(calls.calls).toHaveLength(0);
  });

  it("accepts same-origin DELETE and forwards Bearer + id", async () => {
    signedIn("grove_live_tok_3");
    const { calls } = installFetch(
      () =>
        new Response(JSON.stringify({ id: "abc123", revoked_at: "2026-04-21T00:00:00Z" }), {
          status: 200,
        }),
    );
    const { DELETE } = await import("@/app/api/admin/share/[id]/route");
    const req = new NextRequest(new URL("http://grove.md/api/admin/share/abc123"), {
      method: "DELETE",
      headers: { host: "grove.md", origin: "http://grove.md" },
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: "abc123" }) });
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toContain("/v1/admin/share/abc123");
    expect(calls[0]!.init?.method).toBe("DELETE");
    const authz = (calls[0]!.init?.headers as Record<string, string>)?.["Authorization"];
    expect(authz).toBe("Bearer grove_live_tok_3");
  });

  it("preserves upstream error body + status (e.g. 409 already_revoked)", async () => {
    signedIn();
    installFetch(
      () => new Response(JSON.stringify({ error: "already_revoked" }), { status: 409 }),
    );
    const { DELETE } = await import("@/app/api/admin/share/[id]/route");
    const req = new NextRequest(new URL("http://grove.md/api/admin/share/abc"), {
      method: "DELETE",
      headers: { host: "grove.md", origin: "http://grove.md" },
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: "abc" }) });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body).toEqual({ error: "already_revoked" });
  });

  it("URL-encodes the id before forwarding", async () => {
    signedIn();
    const { calls } = installFetch(() => new Response("{}", { status: 200 }));
    const { DELETE } = await import("@/app/api/admin/share/[id]/route");
    const req = new NextRequest(new URL("http://grove.md/api/admin/share/a%2Fb"), {
      method: "DELETE",
      headers: { host: "grove.md", origin: "http://grove.md" },
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: "a/b" }) });
    expect(res.status).toBe(200);
    expect(calls[0]!.url).toContain("/v1/admin/share/a%2Fb");
  });
});
