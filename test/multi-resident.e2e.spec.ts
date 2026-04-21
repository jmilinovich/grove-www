import { test, expect, type BrowserContext } from "@playwright/test";
import { createCipheriv, createHash, randomBytes } from "node:crypto";

// Multi-resident golden path (PLAN.md P16-6). Exercises the five flows that
// together prove the @handle URL scheme hangs together across signed-out
// profile reads, legacy redirects, trail invites, handle rotation, and
// unknown-handle 404s. Runs against a stateful mock of api.grove.md
// (test/multi-resident-mock-api.mjs) and a fresh `next dev` server with
// GROVE_API_URL pointed at the mock.

const AUTH_SECRET = "playwright-e2e-secret";
const MOCK_API_URL = `http://localhost:${process.env.E2E_MOCK_API_PORT ?? 3850}`;

function encryptKey(key: string): string {
  const secret = createHash("sha256").update(AUTH_SECRET).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secret, iv);
  const encrypted = Buffer.concat([cipher.update(key, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

async function setOwnerSession(context: BrowserContext): Promise<void> {
  const token = encryptKey("grove_live_owner_key");
  await context.addCookies([
    { name: "grove_token", value: token, domain: "localhost", path: "/", httpOnly: true },
    { name: "grove_session", value: "owner-session", domain: "localhost", path: "/", httpOnly: true },
  ]);
}

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ request }) => {
  const res = await request.post(`${MOCK_API_URL}/__test/reset`);
  expect(res.ok()).toBeTruthy();
});

test.describe("multi-resident golden path (P16-6)", () => {
  test("1. signed-out visitor on /@jm sees public profile card", async ({ page }) => {
    const res = await page.goto("/@jm");
    expect(res?.status()).toBe(200);
    await expect(page.getByText("@jm", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "John M" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Sign in to Grove/i })).toBeVisible();
  });

  test("2. legacy /s/abc123 308-redirects to /@jm/s/abc123 and renders share viewer", async ({
    page,
  }) => {
    // Capture the redirect chain so we can assert the 308 hop exists.
    const chain: Array<{ url: string; status: number }> = [];
    page.on("response", (resp) => {
      if (resp.url().includes("/s/")) {
        chain.push({ url: resp.url(), status: resp.status() });
      }
    });

    const final = await page.goto("/s/abc123");
    expect(final?.status()).toBe(200);
    expect(page.url()).toMatch(/\/@jm\/s\/abc123$/);
    await expect(
      page.getByRole("heading", { name: "Shared note" }).first(),
    ).toBeVisible();

    const sawPermanentRedirect = chain.some(
      (e) => e.status === 308 && e.url.endsWith("/s/abc123"),
    );
    expect(sawPermanentRedirect).toBeTruthy();
  });

  test("3. trail invitee: magic-link callback lands at /home with @jm · Weekly Reads context", async ({
    page,
    context,
    request,
  }) => {
    // Prime the mock with an outgoing invite so we can assert the email
    // carries the resident handle. `/auth/magic-link` records the last
    // request for us.
    const inviteRes = await request.post(`${MOCK_API_URL}/auth/magic-link`, {
      data: {
        email: "member@example.com",
        redirect: `http://localhost/api/auth/callback?trail=t-research&resident=jm`,
      },
    });
    expect(inviteRes.ok()).toBeTruthy();

    const stateRes = await request.get(`${MOCK_API_URL}/__test/state`);
    const stateBody = (await stateRes.json()) as {
      lastInvite: { subject: string; body: string } | null;
    };
    expect(stateBody.lastInvite?.subject).toContain("@jm");
    expect(stateBody.lastInvite?.body).toContain("@jm");

    // "Click" the magic link by hitting the callback route directly with
    // the trail + resident context the invite email would carry.
    const callbackRes = await page.goto(
      "/api/auth/callback?code=magic-code&trail=t-research&resident=jm",
    );
    expect(callbackRes?.status()).toBe(200);
    expect(page.url()).toMatch(/\/home$/);
    await expect(page.getByRole("heading", { name: "Weekly Reads" })).toBeVisible();

    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === "grove_token")?.value).toBeTruthy();
  });

  test("4. owner changes handle; legacy /s/abc123 still 301-redirects via updated owner_handle", async ({
    page,
    context,
    request,
  }) => {
    await setOwnerSession(context);

    // Sanity: before the change, /s/abc123 redirects to /@jm/s/abc123.
    await page.goto("/s/abc123");
    expect(page.url()).toMatch(/\/@jm\/s\/abc123$/);

    // Rotate the handle through the grove-www proxy (exercises the real
    // PATCH /api/me flow with encrypted cookie → proxy → mock API).
    const cookies = await context.cookies();
    const cookieHeader = cookies
      .filter((c) => c.name === "grove_token" || c.name === "grove_session")
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
    const patchRes = await request.patch(`${page.url().split("/@")[0]}/api/me`, {
      headers: { "content-type": "application/json", cookie: cookieHeader },
      data: { handle: "newjm" },
    });
    expect(patchRes.ok()).toBeTruthy();
    const patchBody = (await patchRes.json()) as { handle: string };
    expect(patchBody.handle).toBe("newjm");

    // Old handle no longer resolves as a live resident.
    const oldHandleRes = await request.get(`${MOCK_API_URL}/v1/residents/jm`);
    expect(oldHandleRes.status()).toBe(404);

    // But the legacy /s/abc123 URL still redirects — now to the new scope.
    const finalRes = await page.goto("/s/abc123");
    expect(finalRes?.status()).toBe(200);
    expect(page.url()).toMatch(/\/@newjm\/s\/abc123$/);
    await expect(
      page.getByRole("heading", { name: "Shared note" }).first(),
    ).toBeVisible();
  });

  test("5. /@nonexistent returns 404", async ({ page }) => {
    const res = await page.goto("/@nonexistent");
    expect(res?.status()).toBe(404);
  });
});
