import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const redirectSpy = vi.fn((path: string) => {
  const err: Error & { digest?: string } = new Error("NEXT_REDIRECT");
  err.digest = `NEXT_REDIRECT;replace;${path};307;`;
  throw err;
});

const cookiesStore = {
  get: vi.fn<(name: string) => { value: string } | undefined>(() => undefined),
};

vi.mock("next/headers", () => ({
  cookies: async () => cookiesStore,
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectSpy(path),
}));

// `encryptKey` / `decryptKey` live in lib/auth. Neutralize the cookie decrypt
// path so we can assert getApiKey simply by whether the cookie is present.
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    getApiKey: (store: { get: (n: string) => { value: string } | undefined }) => {
      const c = store.get("grove_token");
      return c?.value === "INVALID" ? null : c?.value ?? null;
    },
  };
});

const whoamiSpy = vi.fn();
vi.mock("@/lib/role", async () => {
  const actual = await vi.importActual<typeof import("@/lib/role")>("@/lib/role");
  return {
    ...actual,
    fetchWhoami: (key: string) => whoamiSpy(key),
  };
});

async function loadPage() {
  const mod = await import("@/app/page");
  return mod.default;
}

describe("marketing root auth-aware redirect", () => {
  beforeEach(() => {
    vi.resetModules();
    redirectSpy.mockClear();
    cookiesStore.get.mockReset();
    whoamiSpy.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("signed-out user sees the marketing page", async () => {
    cookiesStore.get.mockReturnValue(undefined);
    const Home = await loadPage();
    const out = await Home();
    expect(redirectSpy).not.toHaveBeenCalled();
    expect(out).toBeTruthy();
  });

  it("signed-in owner redirects to /dashboard", async () => {
    cookiesStore.get.mockReturnValue({ value: "key-owner" });
    whoamiSpy.mockResolvedValue({
      key_id: "k",
      key_name: "n",
      scopes: ["read"],
      vault_id: "v",
      trail: null,
    });
    const Home = await loadPage();
    await expect(Home()).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectSpy).toHaveBeenCalledWith("/dashboard");
  });

  it("signed-in trail user redirects to /home", async () => {
    cookiesStore.get.mockReturnValue({ value: "key-trail" });
    whoamiSpy.mockResolvedValue({
      key_id: "k",
      key_name: "n",
      scopes: ["read"],
      vault_id: "v",
      trail: { id: "t1", name: "Research" },
    });
    const Home = await loadPage();
    await expect(Home()).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectSpy).toHaveBeenCalledWith("/home");
  });

  it("invalid cookie is treated as signed-out (marketing renders)", async () => {
    cookiesStore.get.mockReturnValue({ value: "INVALID" });
    const Home = await loadPage();
    const out = await Home();
    expect(redirectSpy).not.toHaveBeenCalled();
    expect(out).toBeTruthy();
    expect(whoamiSpy).not.toHaveBeenCalled();
  });

  it("expired session (whoami 401) renders marketing, does not redirect", async () => {
    cookiesStore.get.mockReturnValue({ value: "stale-key" });
    whoamiSpy.mockResolvedValue(null);
    const Home = await loadPage();
    const out = await Home();
    expect(redirectSpy).not.toHaveBeenCalled();
    expect(out).toBeTruthy();
  });
});
