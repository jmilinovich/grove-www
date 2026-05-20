import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// `notFound` is a server-only Next.js helper that throws an opaque
// internal error in real prod; we stub it to throw a recognizable error
// the test can match on. Same pattern as page.test.tsx in the resident
// folder.
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

describe("assertV2Available — v2 prod guard", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not throw when VERCEL_ENV is unset (local dev / CI)", async () => {
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("GROVE_API_MODE", "mock");
    const { assertV2Available } = await import("./grove-api.v2");
    expect(() => assertV2Available()).not.toThrow();
  });

  it("does not throw when VERCEL_ENV=preview (dogfood path)", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("GROVE_API_MODE", "mock");
    const { assertV2Available } = await import("./grove-api.v2");
    expect(() => assertV2Available()).not.toThrow();
  });

  it("does not throw when VERCEL_ENV=production and GROVE_API_MODE=live", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("GROVE_API_MODE", "live");
    const { assertV2Available } = await import("./grove-api.v2");
    expect(() => assertV2Available()).not.toThrow();
  });

  it("calls notFound() when VERCEL_ENV=production and GROVE_API_MODE=mock", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("GROVE_API_MODE", "mock");
    const { assertV2Available } = await import("./grove-api.v2");
    expect(() => assertV2Available()).toThrow("NEXT_NOT_FOUND");
  });

  it("calls notFound() when VERCEL_ENV=production and GROVE_API_MODE is unset", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("GROVE_API_MODE", "");
    const { assertV2Available } = await import("./grove-api.v2");
    expect(() => assertV2Available()).toThrow("NEXT_NOT_FOUND");
  });
});

describe("Inbox v2 review actions (live impl) — wire body shape", () => {
  // The `/v1/tasks/<id>/review` endpoint dispatches on the `kind` field
  // of the request body. These tests pin the live impl's translation —
  // a regression would silently 400 every V2 review.

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("GROVE_API_MODE", "live");
    vi.stubEnv("GROVE_API_URL", "https://api.example.test");
    vi.doMock("next/headers", () => ({
      cookies: async () => ({ get: () => undefined }),
    }));
    vi.doMock("@/lib/auth", () => ({
      getApiKey: () => "test-api-key",
    }));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("next/headers");
    vi.doUnmock("@/lib/auth");
    vi.restoreAllMocks();
  });

  async function captureBodyForApply(
    optionId: string,
  ): Promise<{ url: string; body: unknown }> {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 200 }));
    const { applyTask } = await import("./grove-api.v2.live");
    await applyTask("personal", "task-004", optionId);
    const call = fetchSpy.mock.calls[0];
    const init = call?.[1] as RequestInit | undefined;
    const raw = (init?.body ?? "") as string;
    return { url: String(call?.[0] ?? ""), body: raw ? JSON.parse(raw) : null };
  }

  async function captureBodyForRefine(
    refinement: string,
  ): Promise<{ url: string; body: unknown }> {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 200 }));
    const { refineTask } = await import("./grove-api.v2.live");
    await refineTask("personal", "task-004", refinement);
    const call = fetchSpy.mock.calls[0];
    const init = call?.[1] as RequestInit | undefined;
    const raw = (init?.body ?? "") as string;
    return { url: String(call?.[0] ?? ""), body: raw ? JSON.parse(raw) : null };
  }

  async function captureBodyForDismiss(): Promise<{ url: string; body: unknown }> {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 200 }));
    const { dismissReviewTask } = await import("./grove-api.v2.live");
    await dismissReviewTask("personal", "task-004");
    const call = fetchSpy.mock.calls[0];
    const init = call?.[1] as RequestInit | undefined;
    const raw = (init?.body ?? "") as string;
    return { url: String(call?.[0] ?? ""), body: raw ? JSON.parse(raw) : null };
  }

  it("applyTask POSTs {kind:'apply', option_id} to /v1/tasks/<id>/review", async () => {
    const { url, body } = await captureBodyForApply("opt-1");
    expect(url).toBe("https://api.example.test/v/personal/v1/tasks/task-004/review");
    expect(body).toEqual({ kind: "apply", option_id: "opt-1" });
  });

  it("refineTask POSTs {kind:'refine', refinement} to /v1/tasks/<id>/review", async () => {
    const { url, body } = await captureBodyForRefine("merge into Anna Kim");
    expect(url).toBe("https://api.example.test/v/personal/v1/tasks/task-004/review");
    expect(body).toEqual({ kind: "refine", refinement: "merge into Anna Kim" });
  });

  it("dismissReviewTask POSTs {kind:'dismiss'} to /v1/tasks/<id>/review", async () => {
    const { url, body } = await captureBodyForDismiss();
    expect(url).toBe("https://api.example.test/v/personal/v1/tasks/task-004/review");
    expect(body).toEqual({ kind: "dismiss" });
  });
});
