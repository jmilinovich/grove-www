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
