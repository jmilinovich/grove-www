import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Next.js navigation mocks ──────────────────────────────────────────
// Keep the same shape the rest of the suite uses: notFound and redirect
// throw synthetic errors with a `digest` so we can assert the redirect
// target without actually navigating.

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

function notFoundResponse(): Response {
  return new Response(JSON.stringify({ error: "not found" }), {
    status: 404,
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

// ── /s/[id] — permanent redirect to /@<owner>/s/<id> ─────────────────

describe("legacy /s/[id] redirect (P16-3)", () => {
  async function loadPage() {
    const mod = await import("@/app/s/[id]/page");
    return mod.default;
  }

  it("permanent-redirects to /@<owner_handle>/s/<id> when share resolves", async () => {
    fetchMock.mockResolvedValueOnce(
      okJson({ id: "sh_abc123", owner_handle: "jm" }),
    );
    const Page = await loadPage();
    await expect(
      Page({ params: Promise.resolve({ id: "sh_abc123" }) }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(permanentRedirectSpy).toHaveBeenCalledWith("/@jm/s/sh_abc123");
    expect(notFoundSpy).not.toHaveBeenCalled();
  });

  it("url-encodes share IDs with special characters", async () => {
    fetchMock.mockResolvedValueOnce(
      okJson({ id: "weird id", owner_handle: "jm" }),
    );
    const Page = await loadPage();
    await expect(
      Page({ params: Promise.resolve({ id: "weird id" }) }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(permanentRedirectSpy).toHaveBeenCalledWith("/@jm/s/weird%20id");
  });

  it("404s when the share has expired or is missing", async () => {
    fetchMock.mockResolvedValueOnce(notFoundResponse());
    const Page = await loadPage();
    await expect(
      Page({ params: Promise.resolve({ id: "sh_missing" }) }),
    ).rejects.toThrow(/NEXT_NOT_FOUND/);
    expect(permanentRedirectSpy).not.toHaveBeenCalled();
  });

  it("404s when owner_handle is null rather than leaking /@unknown", async () => {
    fetchMock.mockResolvedValueOnce(
      okJson({ id: "sh_orphan", owner_handle: null }),
    );
    const Page = await loadPage();
    await expect(
      Page({ params: Promise.resolve({ id: "sh_orphan" }) }),
    ).rejects.toThrow(/NEXT_NOT_FOUND/);
    expect(permanentRedirectSpy).not.toHaveBeenCalled();
  });
});

// ── /trails/[slug] — permanent redirect to /@<owner>/trails/<slug> ───

describe("legacy /trails/[slug] redirect (P16-3)", () => {
  async function loadPage() {
    const mod = await import("@/app/trails/[slug]/page");
    return mod.default;
  }

  it("permanent-redirects to /@<owner_handle>/trails/<slug>", async () => {
    fetchMock.mockResolvedValueOnce(
      okJson({ name: "Weekly Reads", owner_handle: "jm" }),
    );
    const Page = await loadPage();
    await expect(
      Page({ params: Promise.resolve({ slug: "weekly-reads" }) }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(permanentRedirectSpy).toHaveBeenCalledWith(
      "/@jm/trails/weekly-reads",
    );
  });

  it("404s when trail is disabled or missing", async () => {
    fetchMock.mockResolvedValueOnce(notFoundResponse());
    const Page = await loadPage();
    await expect(
      Page({ params: Promise.resolve({ slug: "nope" }) }),
    ).rejects.toThrow(/NEXT_NOT_FOUND/);
  });

  it("404s when owner_handle is null rather than redirect to /@unknown", async () => {
    fetchMock.mockResolvedValueOnce(
      okJson({ name: "Ghost trail", owner_handle: null }),
    );
    const Page = await loadPage();
    await expect(
      Page({ params: Promise.resolve({ slug: "ghost" }) }),
    ).rejects.toThrow(/NEXT_NOT_FOUND/);
  });
});

// ── /[...path] — signed-in redirect to /@<handle>/<path>, else 404 ──

describe("legacy /[...path] redirect (P16-3)", () => {
  async function loadPage() {
    const mod = await import("@/app/[...path]/page");
    return mod.default;
  }

  it("404s for signed-out visitors without calling /v1/me", async () => {
    cookiesStore.get.mockReturnValue(undefined);
    const Page = await loadPage();
    await expect(
      Page({
        params: Promise.resolve({ path: ["concepts", "taste-graph"] }),
      }),
    ).rejects.toThrow(/NEXT_NOT_FOUND/);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(redirectSpy).not.toHaveBeenCalled();
  });

  it("redirects signed-in visitors to /@<own-handle>/<path>", async () => {
    cookiesStore.get.mockReturnValue({ value: "api-key-abc" });
    fetchMock.mockResolvedValueOnce(okJson({ handle: "jm", username: "jm" }));
    const Page = await loadPage();
    await expect(
      Page({
        params: Promise.resolve({ path: ["concepts", "taste-graph"] }),
      }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectSpy).toHaveBeenCalledWith("/@jm/concepts/taste-graph");
    const callUrl = fetchMock.mock.calls[0]?.[0] as string;
    expect(callUrl).toMatch(/\/v1\/me$/);
  });

  it("falls back to username when /v1/me omits handle", async () => {
    cookiesStore.get.mockReturnValue({ value: "api-key-abc" });
    fetchMock.mockResolvedValueOnce(okJson({ username: "legacy-user" }));
    const Page = await loadPage();
    await expect(
      Page({ params: Promise.resolve({ path: ["Inbox"] }) }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectSpy).toHaveBeenCalledWith("/@legacy-user/Inbox");
  });

  it("re-encodes path segments with spaces", async () => {
    cookiesStore.get.mockReturnValue({ value: "api-key-abc" });
    fetchMock.mockResolvedValueOnce(okJson({ handle: "jm" }));
    const Page = await loadPage();
    await expect(
      Page({
        params: Promise.resolve({ path: ["Resources", "Concepts", "Taste graph"] }),
      }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectSpy).toHaveBeenCalledWith(
      "/@jm/Resources/Concepts/Taste%20graph",
    );
  });

  it("404s when /v1/me fails rather than redirect to /@null", async () => {
    cookiesStore.get.mockReturnValue({ value: "api-key-abc" });
    fetchMock.mockResolvedValueOnce(notFoundResponse());
    const Page = await loadPage();
    await expect(
      Page({ params: Promise.resolve({ path: ["any"] }) }),
    ).rejects.toThrow(/NEXT_NOT_FOUND/);
    expect(redirectSpy).not.toHaveBeenCalled();
  });
});

// ── /dashboard[/...], /profile, /images, /settings — bare → MRU vault ──
//
// P8-B3 moves every authenticated route under `/@<handle>/<slug>/...`. The
// bare routes still work via permanent-redirect shims that call /v1/me,
// resolve the most-recently-used vault, and preserve any query string on
// the way through.

describe("legacy bare-route → MRU vault shims (P8-B3)", () => {
  function meResponse(vaults: Array<{
    id: string;
    slug: string;
    name: string;
    role: "owner" | "member" | "viewer";
    owner_handle: string;
    joined_at?: string;
    last_active_at?: string | null;
  }>, handle = "jm") {
    return okJson({ id: "u", handle, username: handle, vaults });
  }

  async function loadDashboard() {
    const mod = await import("@/app/dashboard/[[...rest]]/page");
    return mod.default;
  }
  async function loadProfile() {
    const mod = await import("@/app/profile/page");
    return mod.default;
  }
  async function loadImages() {
    const mod = await import("@/app/images/page");
    return mod.default;
  }
  async function loadSettings() {
    const mod = await import("@/app/settings/[[...rest]]/page");
    return mod.default;
  }

  it("permanent-redirects /dashboard → /@handle/<mru>/dashboard", async () => {
    cookiesStore.get.mockReturnValue({ value: "api-key" });
    fetchMock.mockResolvedValueOnce(
      meResponse([
        {
          id: "v",
          slug: "personal",
          name: "Personal",
          role: "owner",
          owner_handle: "jm",
          joined_at: "2026-01-01T00:00:00Z",
          last_active_at: "2026-04-20T00:00:00Z",
        },
      ]),
    );
    const Page = await loadDashboard();
    await expect(
      Page({
        params: Promise.resolve({}),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(permanentRedirectSpy).toHaveBeenCalledWith(
      "/@jm/personal/dashboard",
    );
  });

  it("preserves query string across the 308 redirect", async () => {
    cookiesStore.get.mockReturnValue({ value: "api-key" });
    fetchMock.mockResolvedValueOnce(
      meResponse([
        {
          id: "v",
          slug: "personal",
          name: "Personal",
          role: "owner",
          owner_handle: "jm",
          joined_at: "2026-01-01T00:00:00Z",
          last_active_at: "2026-04-20T00:00:00Z",
        },
      ]),
    );
    const Page = await loadDashboard();
    await expect(
      Page({
        params: Promise.resolve({ rest: ["shares"] }),
        searchParams: Promise.resolve({ tab: "active", page: "2" }),
      }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    const target = permanentRedirectSpy.mock.calls.at(-1)?.[0] as string;
    expect(target.startsWith("/@jm/personal/dashboard/shares?")).toBe(true);
    expect(target).toContain("tab=active");
    expect(target).toContain("page=2");
  });

  it("picks the vault with the most recent last_active_at", async () => {
    cookiesStore.get.mockReturnValue({ value: "api-key" });
    fetchMock.mockResolvedValueOnce(
      meResponse([
        {
          id: "v1",
          slug: "older",
          name: "Older",
          role: "owner",
          owner_handle: "jm",
          joined_at: "2026-01-01T00:00:00Z",
          last_active_at: "2026-02-01T00:00:00Z",
        },
        {
          id: "v2",
          slug: "mru",
          name: "Recent",
          role: "member",
          owner_handle: "alice",
          joined_at: "2026-03-01T00:00:00Z",
          last_active_at: "2026-04-15T00:00:00Z",
        },
      ]),
    );
    const Page = await loadDashboard();
    await expect(
      Page({
        params: Promise.resolve({}),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(permanentRedirectSpy).toHaveBeenCalledWith("/@jm/mru/dashboard");
  });

  it("falls back to earliest-joined when no vault has last_active_at", async () => {
    cookiesStore.get.mockReturnValue({ value: "api-key" });
    fetchMock.mockResolvedValueOnce(
      meResponse([
        {
          id: "v-later",
          slug: "later",
          name: "Later",
          role: "member",
          owner_handle: "jm",
          joined_at: "2026-03-01T00:00:00Z",
          last_active_at: null,
        },
        {
          id: "v-first",
          slug: "first",
          name: "First",
          role: "owner",
          owner_handle: "jm",
          joined_at: "2026-01-01T00:00:00Z",
          last_active_at: null,
        },
      ]),
    );
    const Page = await loadDashboard();
    await expect(
      Page({
        params: Promise.resolve({}),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(permanentRedirectSpy).toHaveBeenCalledWith("/@jm/first/dashboard");
  });

  it("redirects signed-out users to /login?redirect=/dashboard", async () => {
    cookiesStore.get.mockReturnValue(undefined);
    const Page = await loadDashboard();
    await expect(
      Page({
        params: Promise.resolve({}),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectSpy).toHaveBeenCalledWith(
      "/login?redirect=" + encodeURIComponent("/dashboard"),
    );
    // No API round-trip for signed-out visitors.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("bare /profile → user-scoped profile (no MRU lookup, P8-B6)", async () => {
    cookiesStore.get.mockReturnValue({ value: "api-key" });
    // /profile no longer resolves the MRU vault — profile is user-scoped, so
    // we only need the viewer's handle from /v1/me.
    fetchMock.mockResolvedValueOnce(meResponse([]));
    const Page = await loadProfile();
    await expect(
      Page({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(permanentRedirectSpy).toHaveBeenCalledWith("/@jm/profile");
  });

  it("bare /images → scoped images", async () => {
    cookiesStore.get.mockReturnValue({ value: "api-key" });
    fetchMock.mockResolvedValueOnce(
      meResponse([
        {
          id: "v",
          slug: "personal",
          name: "Personal",
          role: "owner",
          owner_handle: "jm",
          joined_at: "2026-01-01T00:00:00Z",
          last_active_at: "2026-04-20T00:00:00Z",
        },
      ]),
    );
    const Page = await loadImages();
    await expect(
      Page({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(permanentRedirectSpy).toHaveBeenCalledWith("/@jm/personal/images");
  });

  it("bare /settings → user-scoped /settings/vaults in one hop (P8-B6)", async () => {
    cookiesStore.get.mockReturnValue({ value: "api-key" });
    fetchMock.mockResolvedValueOnce(meResponse([]));
    const Legacy = await loadSettings();
    await expect(
      Legacy({
        params: Promise.resolve({}),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    // Single hop — directly to user-scoped settings/vaults, no MRU lookup,
    // no intermediate /@jm/personal/settings stop.
    expect(permanentRedirectSpy).toHaveBeenCalledWith("/@jm/settings/vaults");
    expect(permanentRedirectSpy).toHaveBeenCalledTimes(1);
  });

  it("bare /settings/vaults → user-scoped settings/vaults (P8-B6)", async () => {
    cookiesStore.get.mockReturnValue({ value: "api-key" });
    fetchMock.mockResolvedValueOnce(meResponse([]));
    const Page = await loadSettings();
    await expect(
      Page({
        params: Promise.resolve({ rest: ["vaults"] }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(permanentRedirectSpy).toHaveBeenCalledWith("/@jm/settings/vaults");
  });

  it("sends users with no vaults back to /login rather than /@null", async () => {
    cookiesStore.get.mockReturnValue({ value: "api-key" });
    fetchMock.mockResolvedValueOnce(meResponse([]));
    const Page = await loadDashboard();
    await expect(
      Page({
        params: Promise.resolve({}),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectSpy).toHaveBeenCalledWith(
      "/login?redirect=" + encodeURIComponent("/dashboard"),
    );
  });
});

// ── next.config.ts redirects() — Phase 20A ───────────────────────────
//
// Six permanent edge redirects compiled into Next.js config. Tested by
// importing the config directly (no HTTP spin-up) so they assert the
// source/destination/permanent contract statically.

describe("next.config.ts redirects (P20-A2)", () => {
  async function loadRedirects() {
    const mod = await import("../next.config");
    const redirects = mod.default.redirects;
    if (!redirects) throw new Error("next.config.ts has no redirects()");
    return redirects();
  }

  const expected = [
    {
      source: "/@:atHandle/:vaultSlug/dashboard/keys",
      destination: "/@:atHandle/:vaultSlug/dashboard/access/keys",
    },
    {
      source: "/@:atHandle/:vaultSlug/dashboard/trails",
      destination: "/@:atHandle/:vaultSlug/dashboard/access/trails",
    },
    {
      source: "/@:atHandle/:vaultSlug/dashboard/shares",
      destination: "/@:atHandle/:vaultSlug/dashboard/access/shares",
    },
    {
      source: "/@:atHandle/:vaultSlug/dashboard/users",
      destination: "/@:atHandle/:vaultSlug/dashboard/access/members",
    },
    {
      source: "/@:atHandle/:vaultSlug/dashboard/graph",
      destination: "/@:atHandle/:vaultSlug/dashboard",
    },
    {
      source: "/@:atHandle/:vaultSlug/dashboard/lifecycle",
      destination: "/@:atHandle/:vaultSlug/dashboard",
    },
  ];

  for (const { source, destination } of expected) {
    it(`${source} → ${destination} (permanent: true)`, async () => {
      const all = await loadRedirects();
      const match = all.find((r: { source: string }) => r.source === source);
      expect(match, `missing redirect for ${source}`).toBeDefined();
      expect(match!.destination).toBe(destination);
      expect(match!.permanent).toBe(true);
    });
  }

  it("has no chained redirects — no source appears as another destination", async () => {
    const all = await loadRedirects();
    const sources = new Set(
      all.map((r: { source: string }) => r.source),
    );
    for (const r of all) {
      expect(
        sources.has(r.destination),
        `redirect chain detected: ${r.source} → ${r.destination} → ...`,
      ).toBe(false);
    }
  });
});
