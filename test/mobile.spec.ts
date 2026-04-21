import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { createCipheriv, createHash, randomBytes } from "node:crypto";

// Baseline mobile viewport: iPhone SE (375×667). Every listed route must render
// without horizontal scroll at this width. Safety tolerance: 1 px.

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
  const token = encryptKey("grove_live_mobile_test");
  await context.addCookies([
    { name: "grove_token", value: token, domain: "localhost", path: "/", httpOnly: true },
    { name: "grove_session", value: "mobile-session", domain: "localhost", path: "/", httpOnly: true },
  ]);
}

async function assertNoHorizontalScroll(page: Page, label: string) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  if (scrollWidth > clientWidth + 1) {
    throw new Error(
      `[mobile] ${label}: horizontal scroll detected — scrollWidth=${scrollWidth} clientWidth=${clientWidth}`,
    );
  }
  expect(scrollWidth, `${label} scrollWidth`).toBeLessThanOrEqual(clientWidth + 1);
}

const SIGNED_OUT_ROUTES: Array<{ path: string; label: string }> = [
  { path: "/", label: "marketing" },
  { path: "/login", label: "login" },
];

const SIGNED_IN_ROUTES: Array<{ path: string; label: string }> = [
  { path: "/dashboard", label: "dashboard" },
  { path: "/home", label: "home" },
  { path: "/profile", label: "profile" },
  { path: "/dashboard/usage", label: "dashboard/usage" },
  { path: "/dashboard/trails", label: "dashboard/trails" },
  { path: "/dashboard/keys", label: "dashboard/keys" },
  { path: "/dashboard/shares", label: "dashboard/shares" },
  { path: "/dashboard/users", label: "dashboard/users" },
  { path: "/dashboard/health", label: "dashboard/health" },
  { path: "/images", label: "images" },
  { path: "/Resources/Concepts/Example", label: "note (catch-all)" },
];

test.describe("mobile 375px — no horizontal scroll", () => {
  for (const route of SIGNED_OUT_ROUTES) {
    test(`signed-out ${route.label} (${route.path})`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await assertNoHorizontalScroll(page, route.label);
    });
  }

  for (const route of SIGNED_IN_ROUTES) {
    test(`signed-in ${route.label} (${route.path})`, async ({ page, context }) => {
      await setOwnerSession(context);
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await assertNoHorizontalScroll(page, route.label);
    });
  }
});
