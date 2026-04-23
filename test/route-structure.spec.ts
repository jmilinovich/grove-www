import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Route-structure tests (P8-B6). Covers the middleware legacy-URL redirects,
// the bare-route shims for user-scoped pages, and the bare `/@<handle>`
// signed-in redirect to MRU.
//
// We exercise the middleware directly as a function (same pattern the rest
// of the suite uses for server components — call the exported default with
// mocked request). For Next middleware this means constructing a
// `NextRequest` and asserting on the returned `NextResponse`.

import { NextRequest } from "next/server";

const notFoundSpy = vi.fn(() => {
  const err: Error & { digest?: string } = new Error("NEXT_NOT_FOUND");
  err.digest = "NEXT_NOT_FOUND";
  throw err;
});

const redirectSpy = vi.fn((path: string) => {
  const err: Error & { digest?: string } = new Error("NEXT_REDIRECT");
  err.digest = `NEXT_REDIRECT;replace;${path};307;`;
  throw err;
});

const permanentRedirectSpy = vi.fn((path: string) => {
  const err: Error & { digest?: string } = new Error("NEXT_REDIRECT");
  err.digest = `NEXT_REDIRECT;replace;${path};308;`;
  throw err;
});

const cookiesStore = {
  get: vi.fn<(name: string) => { value: string } | undefined>(() => undefined),
};

vi.mock("next/navigation", () => ({
  notFound: () => notFoundSpy(),
  redirect: (path: string) => redirectSpy(path),
  permanentRedirect: (path: string) => permanentRedirectSpy(path),
}));

vi.mock("next/headers", () => ({
  cookies: async () => cookiesStore,
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>(
    "@/lib/auth",
  );
  return {
    ...actual,
    getApiKey: (store: { get: (n: string) => { value: string } | undefined }) => {
      const c = store.get("grove_token");
      return c?.value ? c.value : null;
    },
  };
});

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

function okJson<T>(body: T): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  vi.resetModules();
  fetchMock.mockReset();
  notFoundSpy.mockClear();
  redirectSpy.mockClear();
  permanentRedirectSpy.mockClear();
  cookiesStore.get.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── middleware: legacy user-scoped URL → user-scoped canonical (P8-B6) ──

describe("middleware legacy user-scoped redirects (P8-B6)", () => {
  async function loadMiddleware() {
    const mod = await import("@/middleware");
    return mod.middleware;
  }

  function makeReq(url: string): NextRequest {
    // NextRequest wraps a standard Request and exposes nextUrl. Passing
    // the full URL populates pathname/search/hash correctly.
    return new NextRequest(new URL(url));
  }

  it("/@<h>/<v>/profile → 308 /@<h>/profile (strips vault)", async () => {
    const middleware = await loadMiddleware();
    const res = await middleware(makeReq("https://grove.md/@jm/personal/profile"));
    expect(res).toBeDefined();
    expect(res!.status).toBe(308);
    const loc = res!.headers.get("location")!;
    expect(new URL(loc).pathname).toBe("/@jm/profile");
  });

  it("preserves query and fragment across the 308", async () => {
    const middleware = await loadMiddleware();
    // URL() drops fragments from the server-side request pipeline in Node's
    // fetch runtime, so we construct via nextUrl manually via query only
    // here and check hash preservation below in a separate assertion.
    const res = await middleware(
      makeReq("https://grove.md/@jm/personal/profile?q=1&tab=me"),
    );
    const loc = new URL(res!.headers.get("location")!);
    expect(loc.pathname).toBe("/@jm/profile");
    expect(loc.searchParams.get("q")).toBe("1");
    expect(loc.searchParams.get("tab")).toBe("me");
  });

  it("preserves hash fragments across the 308", async () => {
    const middleware = await loadMiddleware();
    const req = makeReq("https://grove.md/@jm/personal/profile?q=1");
    // NextRequest constructor strips hashes from the URL string; inject
    // the hash directly on nextUrl to simulate a client-side navigation
    // that carried one.
    req.nextUrl.hash = "#section";
    const res = await middleware(req);
    const loc = res!.headers.get("location")!;
    expect(loc).toContain("#section");
    expect(loc).toContain("q=1");
  });

  it("/@<h>/<v>/settings/vaults → 308 /@<h>/settings/vaults", async () => {
    const middleware = await loadMiddleware();
    const res = await middleware(
      makeReq("https://grove.md/@jm/work/settings/vaults?q=1"),
    );
    expect(res!.status).toBe(308);
    const loc = new URL(res!.headers.get("location")!);
    expect(loc.pathname).toBe("/@jm/settings/vaults");
    expect(loc.searchParams.get("q")).toBe("1");
  });

  it("trailing slash on legacy URL still redirects", async () => {
    const middleware = await loadMiddleware();
    const res = await middleware(
      makeReq("https://grove.md/@jm/personal/settings/vaults/"),
    );
    expect(res!.status).toBe(308);
    const loc = new URL(res!.headers.get("location")!);
    expect(loc.pathname).toBe("/@jm/settings/vaults");
  });

  it("/@<h>/settings → 308 /@<h>/settings/vaults (bare settings index)", async () => {
    const middleware = await loadMiddleware();
    const res = await middleware(makeReq("https://grove.md/@jm/settings"));
    expect(res!.status).toBe(308);
    const loc = new URL(res!.headers.get("location")!);
    expect(loc.pathname).toBe("/@jm/settings/vaults");
  });

  it("does not redirect the canonical user-scoped paths (idempotent)", async () => {
    const middleware = await loadMiddleware();
    const res = await middleware(makeReq("https://grove.md/@jm/profile"));
    // NextResponse.next() is the pass-through — location header absent.
    expect(res?.headers.get("location")).toBeNull();
  });

  it("does not touch vault-scoped routes that are not legacy (dashboard)", async () => {
    const middleware = await loadMiddleware();
    const res = await middleware(
      makeReq("https://grove.md/@jm/personal/dashboard"),
    );
    expect(res?.headers.get("location")).toBeNull();
  });

  it("sets Cache-Control: max-age=3600 on redirects (relaxed rollout)", async () => {
    const middleware = await loadMiddleware();
    const res = await middleware(
      makeReq("https://grove.md/@jm/personal/profile"),
    );
    expect(res!.headers.get("cache-control")).toBe("max-age=3600");
  });

  it("redirect chain depth is exactly 1 hop — target is a terminal path", async () => {
    // If the middleware redirected to another legacy path, re-running it
    // would fire again. Assert the redirect location, when fed back into
    // the middleware, is a pass-through (NextResponse.next()).
    const middleware = await loadMiddleware();
    const first = await middleware(
      makeReq("https://grove.md/@jm/personal/profile"),
    );
    const firstLoc = new URL(first!.headers.get("location")!);
    const second = await middleware(makeReq(firstLoc.toString()));
    expect(second?.headers.get("location")).toBeNull();
  });
});

// ── bare /@<h> — signed-in handle owner 302s to MRU dashboard ──────────

describe("bare /@<handle> handle-root redirect (P8-B6)", () => {
  async function loadHandleRoot() {
    const mod = await import("@/app/(resident)/[atHandle]/page");
    return mod.default;
  }

  function residentPayload(handle: string) {
    return okJson({
      handle,
      display_name: null,
      bio: null,
      public_trail_slugs: [],
      note_count: 0,
    });
  }

  function mePayload(handle: string) {
    return okJson({
      id: "u",
      handle,
      username: handle,
      vaults: [
        {
          id: "v",
          slug: "personal",
          name: "Personal",
          role: "owner",
          owner_handle: handle,
          joined_at: "2026-01-01T00:00:00Z",
          last_active_at: "2026-04-20T00:00:00Z",
        },
      ],
    });
  }

  it("signed-in visitor → redirect to MRU dashboard (307, NOT 308)", async () => {
    cookiesStore.get.mockReturnValue({ value: "api-key" });
    // fetchResident first, then /v1/me for the scope resolution.
    fetchMock.mockResolvedValueOnce(residentPayload("jm"));
    fetchMock.mockResolvedValueOnce(mePayload("jm"));
    const Page = await loadHandleRoot();
    await expect(
      Page({ params: Promise.resolve({ atHandle: "@jm" }) }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    // Crucially uses `redirect()` (307), NOT `permanentRedirect()` (308).
    // MRU is a mutable target — a cached 308 would pin the first-visited
    // vault forever.
    expect(redirectSpy).toHaveBeenCalledWith("/@jm/personal/dashboard");
    expect(permanentRedirectSpy).not.toHaveBeenCalled();
  });

  it("signed-out visitor → falls through to the public resident view", async () => {
    cookiesStore.get.mockReturnValue(undefined);
    fetchMock.mockResolvedValueOnce(residentPayload("jm"));
    const Page = await loadHandleRoot();
    // Rendering the component returns JSX; no redirect thrown.
    const result = await Page({
      params: Promise.resolve({ atHandle: "@jm" }),
    });
    expect(result).toBeDefined();
    expect(redirectSpy).not.toHaveBeenCalled();
    expect(permanentRedirectSpy).not.toHaveBeenCalled();
  });

  it("signed-in but MRU resolution fails → still renders public view", async () => {
    cookiesStore.get.mockReturnValue({ value: "api-key" });
    fetchMock.mockResolvedValueOnce(residentPayload("jm"));
    // /v1/me 404s
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "nope" }), { status: 404 }),
    );
    const Page = await loadHandleRoot();
    const result = await Page({
      params: Promise.resolve({ atHandle: "@jm" }),
    });
    expect(result).toBeDefined();
    expect(redirectSpy).not.toHaveBeenCalled();
  });
});

// ── user-scoped pages — login return-path builds user-scoped URL ───────

describe("user-scoped page login return-path (P8-B6)", () => {
  async function loadProfilePage() {
    const mod = await import("@/app/(resident)/[atHandle]/profile/page");
    return mod.default;
  }
  async function loadVaultsSettingsPage() {
    const mod = await import(
      "@/app/(resident)/[atHandle]/settings/vaults/page"
    );
    return mod.default;
  }

  it("/@<h>/profile — unauthed redirects to /login?redirect=%2F%40<h>%2Fprofile", async () => {
    cookiesStore.get.mockReturnValue(undefined);
    const Page = await loadProfilePage();
    await expect(
      Page({ params: Promise.resolve({ atHandle: "@jm" }) }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectSpy).toHaveBeenCalledWith(
      "/login?redirect=" + encodeURIComponent("/@jm/profile"),
    );
  });

  it("/@<h>/settings/vaults — unauthed redirects to /login?redirect=%2F%40<h>%2Fsettings%2Fvaults", async () => {
    cookiesStore.get.mockReturnValue(undefined);
    const Page = await loadVaultsSettingsPage();
    await expect(
      Page({ params: Promise.resolve({ atHandle: "@jm" }) }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectSpy).toHaveBeenCalledWith(
      "/login?redirect=" + encodeURIComponent("/@jm/settings/vaults"),
    );
  });

  it("/@<h>/settings index permanent-redirects to /@<h>/settings/vaults", async () => {
    const { default: Page } = await import(
      "@/app/(resident)/[atHandle]/settings/page"
    );
    await expect(
      Page({ params: Promise.resolve({ atHandle: "@jm" }) }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(permanentRedirectSpy).toHaveBeenCalledWith("/@jm/settings/vaults");
  });
});

// ── vault-scoped /@<h>/<v>/settings renders an empty-state page ────────

describe("vault-scoped /@<h>/<v>/settings empty-state (P8-B6)", () => {
  it("renders without redirecting — vault contextual URL", async () => {
    const { default: Page } = await import(
      "@/app/(resident)/[atHandle]/[vaultSlug]/settings/page"
    );
    const result = await Page({
      params: Promise.resolve({ atHandle: "@jm", vaultSlug: "personal" }),
    });
    // Should return JSX, not throw a redirect.
    expect(result).toBeDefined();
    expect(permanentRedirectSpy).not.toHaveBeenCalled();
    expect(redirectSpy).not.toHaveBeenCalled();
  });
});
