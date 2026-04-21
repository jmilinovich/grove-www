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

// Stub the client login form — vitest should not try to render the client
// component's side-effectful hooks during a server-side unit test.
vi.mock("@/app/login/login-form", () => ({
  default: () => null,
}));

async function loadPage() {
  const mod = await import("@/app/login/page");
  return mod.default;
}

describe("/login short-circuit", () => {
  beforeEach(() => {
    vi.resetModules();
    redirectSpy.mockClear();
    cookiesStore.get.mockReset();
    whoamiSpy.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("signed-out user sees the form", async () => {
    cookiesStore.get.mockReturnValue(undefined);
    const LoginPage = await loadPage();
    const out = await LoginPage({ searchParams: Promise.resolve({}) });
    expect(redirectSpy).not.toHaveBeenCalled();
    expect(out).toBeTruthy();
  });

  it("signed-in owner redirects to /dashboard", async () => {
    cookiesStore.get.mockReturnValue({ value: "owner-key" });
    whoamiSpy.mockResolvedValue({
      key_id: "k",
      key_name: "n",
      scopes: ["read"],
      vault_id: "v",
      trail: null,
    });
    const LoginPage = await loadPage();
    await expect(
      LoginPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectSpy).toHaveBeenCalledWith("/dashboard");
  });

  it("signed-in trail user redirects to /home", async () => {
    cookiesStore.get.mockReturnValue({ value: "trail-key" });
    whoamiSpy.mockResolvedValue({
      key_id: "k",
      key_name: "n",
      scopes: ["read"],
      vault_id: "v",
      trail: { id: "t1", name: "R" },
    });
    const LoginPage = await loadPage();
    await expect(
      LoginPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectSpy).toHaveBeenCalledWith("/home");
  });

  it("signed-in user with ?redirect=/profile goes to /profile", async () => {
    cookiesStore.get.mockReturnValue({ value: "owner-key" });
    whoamiSpy.mockResolvedValue({
      key_id: "k",
      key_name: "n",
      scopes: ["read"],
      vault_id: "v",
      trail: null,
    });
    const LoginPage = await loadPage();
    await expect(
      LoginPage({ searchParams: Promise.resolve({ redirect: "/profile" }) }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectSpy).toHaveBeenCalledWith("/profile");
  });

  it("signed-in user with ?redirect=//evil.com falls back to role default", async () => {
    cookiesStore.get.mockReturnValue({ value: "owner-key" });
    whoamiSpy.mockResolvedValue({
      key_id: "k",
      key_name: "n",
      scopes: ["read"],
      vault_id: "v",
      trail: null,
    });
    const LoginPage = await loadPage();
    await expect(
      LoginPage({ searchParams: Promise.resolve({ redirect: "//evil.com" }) }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectSpy).toHaveBeenCalledWith("/dashboard");
  });

  it("invalid cookie is treated as signed-out (form renders)", async () => {
    cookiesStore.get.mockReturnValue({ value: "INVALID" });
    const LoginPage = await loadPage();
    const out = await LoginPage({ searchParams: Promise.resolve({}) });
    expect(redirectSpy).not.toHaveBeenCalled();
    expect(out).toBeTruthy();
  });
});
