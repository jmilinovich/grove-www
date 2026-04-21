import { test, expect, type BrowserContext } from "@playwright/test";
import { createCipheriv, createHash, randomBytes } from "node:crypto";

const MOCK_PORT = Number(process.env.MOCK_API_PORT ?? 3848);
const MOCK_URL = `http://localhost:${MOCK_PORT}`;

async function setSharesMode(mode: "populated" | "empty"): Promise<void> {
  const res = await fetch(`${MOCK_URL}/mock/config`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sharesMode: mode }),
  });
  if (!res.ok) throw new Error(`mock config failed: ${res.status}`);
}

// /dashboard/shares management page — runs against the same mock-API +
// next-dev harness as mobile.spec.ts. Per-test scenarios use page.route()
// to override the default populated mock response.

const AUTH_SECRET = "playwright-mobile-test-secret";

function encryptKey(key: string): string {
  const secret = createHash("sha256").update(AUTH_SECRET).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secret, iv);
  const encrypted = Buffer.concat([cipher.update(key, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

async function setOwnerSession(context: BrowserContext): Promise<void> {
  const token = encryptKey("grove_live_dashboard_shares_test");
  await context.addCookies([
    { name: "grove_token", value: token, domain: "localhost", path: "/", httpOnly: true },
    { name: "grove_session", value: "dashboard-shares", domain: "localhost", path: "/", httpOnly: true },
  ]);
}

async function gotoAndHydrate(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/dashboard/shares", { waitUntil: "domcontentloaded" });
  await expect(
    page.locator('[data-testid="shares-root"][data-hydrated="true"]'),
  ).toBeAttached();
}

test.describe("dashboard shares — desktop", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test.beforeEach(async () => {
    await setSharesMode("populated");
  });
  test.afterAll(async () => {
    await setSharesMode("populated");
  });

  test("populated state renders rows with status badges and muted expired row", async ({ page, context }) => {
    await setOwnerSession(context);
    await gotoAndHydrate(page);

    // Active row from default mock.
    await expect(page.locator('[data-testid="share-row-sh_active01"]')).toBeVisible();
    // Expired row renders with data-status="expired".
    const expiredRow = page.locator('[data-testid="share-row-sh_expired02"]');
    await expect(expiredRow).toHaveAttribute("data-status", "expired");
    // Active count reflects only active entries.
    await expect(page.locator('[data-testid="shares-active-count"]')).toHaveText("1 active");

    // Expired rows have no Revoke button; active rows do.
    await expect(page.locator('[data-testid="revoke-sh_active01"]')).toBeVisible();
    await expect(page.locator('[data-testid="revoke-sh_expired02"]')).toHaveCount(0);
  });

  test("search filters by note path", async ({ page, context }) => {
    await setOwnerSession(context);
    await gotoAndHydrate(page);

    const search = page.getByPlaceholder("Search by note path");
    await search.fill("Another");
    await expect(page.locator('[data-testid="share-row-sh_active01"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="share-row-sh_expired02"]')).toBeVisible();

    await search.fill("does-not-match-anything");
    await expect(page.locator('[data-testid="shares-no-match"]')).toBeVisible();
  });

  test("sort toggle on Note column flips direction", async ({ page, context }) => {
    await setOwnerSession(context);
    await gotoAndHydrate(page);

    const rows = page.locator("tbody tr[data-testid^='share-row-']");
    const getOrder = () => rows.evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")));

    await page.getByRole("button", { name: /Note/ }).click();
    const firstOrder = await getOrder();
    expect(firstOrder.length).toBe(2);

    await page.getByRole("button", { name: /Note/ }).click();
    const secondOrder = await getOrder();
    expect(secondOrder).toEqual([...firstOrder].reverse());
  });

  test("copy writes URL to clipboard and shows Copied!", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await setOwnerSession(context);
    await gotoAndHydrate(page);

    await page.locator('[data-testid="copy-sh_active01"]').click();
    await expect(page.locator('[data-testid="copy-sh_active01"]')).toHaveText("Copied!");

    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toBe("https://grove.md/@test/s/sh_active01");
  });

  test("revoke optimistic update moves row to revoked state", async ({ page, context }) => {
    await setOwnerSession(context);
    await gotoAndHydrate(page);

    await page.locator('[data-testid="revoke-sh_active01"]').click();
    await page.locator('[data-testid="confirm-revoke-sh_active01"]').click();

    const row = page.locator('[data-testid="share-row-sh_active01"]');
    await expect(row).toHaveAttribute("data-status", "revoked");
    await expect(page.locator('[data-testid="shares-active-count"]')).toHaveText("0 active");
  });

  test("revoke rollback on server failure restores active row + shows toast", async ({ page, context }) => {
    await setOwnerSession(context);

    // Force the DELETE proxy route to fail (intercepted in browser, before hitting Next).
    await page.route("**/api/admin/share/**", async (route) => {
      if (route.request().method() === "DELETE") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "internal_error" }),
        });
        return;
      }
      await route.fallback();
    });

    await gotoAndHydrate(page);
    await page.locator('[data-testid="revoke-sh_active01"]').click();
    await page.locator('[data-testid="confirm-revoke-sh_active01"]').click();

    // Toast appears, row rolls back to active.
    await expect(page.locator('[data-testid="shares-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="share-row-sh_active01"]')).toHaveAttribute(
      "data-status",
      "active",
    );
    await expect(page.locator('[data-testid="shares-active-count"]')).toHaveText("1 active");
  });

  test("empty state shows one-liner when zero shares", async ({ page, context }) => {
    await setSharesMode("empty");
    await setOwnerSession(context);
    await gotoAndHydrate(page);
    await expect(page.locator('[data-testid="shares-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="shares-empty"]')).toContainText(
      "No shares yet.",
    );
  });
});

test.describe("dashboard shares — mobile 375px", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async () => {
    await setSharesMode("populated");
  });

  test("renders without horizontal scroll at 375px", async ({ page, context }) => {
    await setOwnerSession(context);
    await gotoAndHydrate(page);

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});
