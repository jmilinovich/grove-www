/**
 * Visual regression — snapshots of key routes at mobile + desktop widths.
 *
 * Snapshots live under test/visual.spec.ts-snapshots/. First run creates
 * the baseline; subsequent runs diff against it. To update after an
 * intentional visual change: `npm run test:visual -- --update-snapshots`.
 *
 * Reuses the mobile-mock-api server + owner cookie from mobile.spec.ts.
 */

import { test, expect, type BrowserContext } from "@playwright/test";
import { createCipheriv, createHash, randomBytes } from "node:crypto";

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

// Inject a stylesheet that kills every animation so pixel diffs aren't flaky.
// This targets fade-up, cursor-blink, and any transition declared in tailwind.
const FREEZE_MOTION_CSS = `
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    caret-color: transparent !important;
  }
  .fade-up { opacity: 1 !important; transform: none !important; }
  .cursor-blink { opacity: 1 !important; }
`;

async function stabilize(page: import("@playwright/test").Page) {
  await page.addStyleTag({ content: FREEZE_MOTION_CSS });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForLoadState("networkidle");
}

interface Route {
  path: string;
  label: string;
  signedIn?: boolean;
}

const SCOPED_PREFIX = "/%40test/personal";
const ROUTES: Route[] = [
  { path: "/", label: "landing" },
  { path: "/login", label: "login" },
  { path: "/home", label: "home", signedIn: true },
  { path: `${SCOPED_PREFIX}/profile`, label: "profile", signedIn: true },
  { path: `${SCOPED_PREFIX}/dashboard`, label: "dashboard", signedIn: true },
  { path: `${SCOPED_PREFIX}/dashboard/keys`, label: "dashboard-keys", signedIn: true },
  { path: `${SCOPED_PREFIX}/dashboard/trails`, label: "dashboard-trails", signedIn: true },
  { path: "/Resources/Concepts/Example", label: "note-viewer", signedIn: true },
];

const VIEWPORTS = [
  { width: 375, height: 812, label: "mobile" },
  { width: 1280, height: 900, label: "desktop" },
];

for (const vp of VIEWPORTS) {
  test.describe(`visual — ${vp.label} ${vp.width}px`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const route of ROUTES) {
      test(`${route.label} (${route.path})`, async ({ page, context }) => {
        if (route.signedIn) await setOwnerSession(context);
        await page.goto(route.path, { waitUntil: "domcontentloaded" });
        await stabilize(page);
        await expect(page).toHaveScreenshot(`${route.label}-${vp.label}.png`, {
          fullPage: true,
          // Cap pixel diff — small font-rendering jitter is OK, new elements aren't.
          maxDiffPixelRatio: 0.01,
        });
      });
    }
  });
}
