import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Proxy middleware: auth-gated paths without a grove_token cookie redirect to
// /login?redirect=<path>. Query string on the original URL must survive the
// round-trip — dashboard/profile filters break otherwise.

const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("proxy — login redirect preserves query string", () => {
  async function runProxy(url: string): Promise<{ status: number; location: string | null }> {
    const { default: proxy } = await import("@/proxy");
    // No grove_token cookie → unauth'd branch.
    const req = new NextRequest(new URL(url), { method: "GET" });
    const res = await proxy(req);
    return { status: res.status, location: res.headers.get("location") };
  }

  it("bare /dashboard with no query redirects to /login?redirect=%2Fdashboard", async () => {
    const { status, location } = await runProxy("http://grove.md/dashboard");
    expect(status).toBe(307);
    expect(location).toBe("http://grove.md/login?redirect=%2Fdashboard");
  });

  it("preserves a single query param", async () => {
    const { location } = await runProxy("http://grove.md/dashboard?q=foo");
    expect(location).toBe("http://grove.md/login?redirect=%2Fdashboard%3Fq%3Dfoo");
  });

  it("preserves multiple query params", async () => {
    const { location } = await runProxy("http://grove.md/dashboard?tab=keys&sort=age");
    expect(location).toBe(
      "http://grove.md/login?redirect=%2Fdashboard%3Ftab%3Dkeys%26sort%3Dage",
    );
  });

  it("preserves query on nested paths", async () => {
    const { location } = await runProxy(
      "http://grove.md/dashboard/trails/abc123?open=true",
    );
    expect(location).toBe(
      "http://grove.md/login?redirect=%2Fdashboard%2Ftrails%2Fabc123%3Fopen%3Dtrue",
    );
  });

  it("preserves query on non-dashboard auth'd routes", async () => {
    const { location } = await runProxy("http://grove.md/settings?tab=vaults");
    expect(location).toBe("http://grove.md/login?redirect=%2Fsettings%3Ftab%3Dvaults");
  });

  it("handles percent-encoded query values", async () => {
    const { location } = await runProxy("http://grove.md/profile?name=John%20Doe");
    expect(location).toBe(
      "http://grove.md/login?redirect=%2Fprofile%3Fname%3DJohn%2520Doe",
    );
  });
});
