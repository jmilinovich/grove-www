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
