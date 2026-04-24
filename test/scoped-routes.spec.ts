import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

const cookiesStore = {
  get: vi.fn<(name: string) => { value: string } | undefined>(() => undefined),
};

vi.mock("next/navigation", () => ({
  notFound: () => notFoundSpy(),
  redirect: (path: string) => redirectSpy(path),
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

function okJson<T>(body: T, init: Partial<Response> = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json" },
  });
}

function notFoundResponse(): Response {
  return new Response(JSON.stringify({ error: "not found" }), {
    status: 404,
    headers: { "content-type": "application/json" },
  });
}

const JM_PROFILE = {
  handle: "jm",
  display_name: "John M",
  bio: "Builds calm systems.",
  public_trail_slugs: [] as string[],
  note_count: 42,
};

beforeEach(() => {
  vi.resetModules();
  fetchMock.mockReset();
  notFoundSpy.mockClear();
  redirectSpy.mockClear();
  cookiesStore.get.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("resident layout (P16-2)", () => {
  async function loadLayout() {
    const mod = await import("@/app/(resident)/[atHandle]/layout");
    return mod.default;
  }

  it("renders children when the handle resolves", async () => {
    fetchMock.mockResolvedValueOnce(okJson(JM_PROFILE));
    const Layout = await loadLayout();
    const out = await Layout({
      children: "CHILD" as unknown as React.ReactNode,
      params: Promise.resolve({ atHandle: "@jm" }),
    });
    expect(notFoundSpy).not.toHaveBeenCalled();
    expect(out).toBeTruthy();
    const callUrl = fetchMock.mock.calls[0]?.[0] as string;
    expect(callUrl).toMatch(/\/v1\/residents\/jm$/);
  });

  it("404s when the segment is missing the @ prefix", async () => {
    const Layout = await loadLayout();
    await expect(
      Layout({
        children: null as unknown as React.ReactNode,
        params: Promise.resolve({ atHandle: "jm" }),
      }),
    ).rejects.toThrow(/NEXT_NOT_FOUND/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("404s when the handle has no user", async () => {
    fetchMock.mockResolvedValueOnce(notFoundResponse());
    const Layout = await loadLayout();
    await expect(
      Layout({
        children: null as unknown as React.ReactNode,
        params: Promise.resolve({ atHandle: "@nobody" }),
      }),
    ).rejects.toThrow(/NEXT_NOT_FOUND/);
  });

  it("decodes url-encoded @ prefix (%40)", async () => {
    fetchMock.mockResolvedValueOnce(okJson(JM_PROFILE));
    const Layout = await loadLayout();
    const out = await Layout({
      children: "CHILD" as unknown as React.ReactNode,
      params: Promise.resolve({ atHandle: "%40jm" }),
    });
    expect(out).toBeTruthy();
  });
});

describe("resident profile page (P16-2)", () => {
  async function loadPage() {
    const mod = await import("@/app/(resident)/[atHandle]/page");
    return mod.default;
  }

  it("renders the profile card for a known handle", async () => {
    fetchMock.mockResolvedValueOnce(okJson(JM_PROFILE));
    const Page = await loadPage();
    const out = await Page({ params: Promise.resolve({ atHandle: "@jm" }) });
    expect(out).toBeTruthy();
    expect(notFoundSpy).not.toHaveBeenCalled();
  });

  it("404s on unknown handle", async () => {
    fetchMock.mockResolvedValueOnce(notFoundResponse());
    const Page = await loadPage();
    await expect(
      Page({ params: Promise.resolve({ atHandle: "@nobody" }) }),
    ).rejects.toThrow(/NEXT_NOT_FOUND/);
  });
});

describe("scoped note viewer (P16-2)", () => {
  async function loadPage() {
    const mod = await import("@/app/(resident)/[atHandle]/[...path]/page");
    return mod.default;
  }

  it("prompts sign-in when no cookie is set", async () => {
    cookiesStore.get.mockReturnValue(undefined);
    const Page = await loadPage();
    const out = await Page({
      params: Promise.resolve({
        atHandle: "@jm",
        path: ["concepts", "taste-graph"],
      }),
    });
    expect(out).toBeTruthy();
    expect(notFoundSpy).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renders the note when the API returns it", async () => {
    cookiesStore.get.mockReturnValue({ value: "api-key-abc" });
    // Page now pre-fetches /v1/me to detect whether the first URL segment
    // names one of the viewer's vaults. "concepts" isn't a vault slug here,
    // so the page falls through to the legacy single-vault flow.
    fetchMock.mockResolvedValueOnce(okJson({ handle: "jm", vaults: [] }));
    fetchMock.mockResolvedValueOnce(
      okJson({
        path: "concepts/taste-graph.md",
        frontmatter: { type: "concept" },
        content: "# Taste graph\n\nBody text.",
        content_hash: "x",
        links: {},
        backlinks: [],
      }),
    );
    const Page = await loadPage();
    const out = await Page({
      params: Promise.resolve({
        atHandle: "@jm",
        path: ["concepts", "taste-graph"],
      }),
    });
    expect(out).toBeTruthy();
  });
});
