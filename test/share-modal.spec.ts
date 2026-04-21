import { test, expect, type BrowserContext } from "@playwright/test";
import { createCipheriv, createHash, randomBytes } from "node:crypto";

// ShareModal behavior — opened from the note-view header Share button.
// Runs against the same mock-API + next-dev harness as mobile.spec.ts.

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

const NOTE_URL = "/@test/Resources/Concepts/Example";

test.describe("share modal — mobile 375px", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("owner sees Share button; opens, generates, shows success", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await setOwnerSession(context);
    await page.goto(NOTE_URL, { waitUntil: "domcontentloaded" });

    const shareButton = page.getByRole("button", { name: "Share this note" });
    await expect(shareButton).toBeVisible();
    await shareButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await expect(dialog.getByRole("heading", { name: "Share this note" })).toBeVisible();

    // Modal must not push page sideways at 375px.
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    await dialog.getByRole("button", { name: "Generate" }).click();

    await expect(dialog.getByRole("heading", { name: "Shared" })).toBeVisible();
    await expect(dialog.getByRole("status")).toContainText("Link created");
    await expect(dialog.getByRole("textbox")).toHaveValue(/grove\.md\/@test\/s\/sh_mocktest/);

    const doneButton = dialog.getByRole("button", { name: "Done" });
    await expect(doneButton).toBeFocused();
  });

  test("Esc closes modal and returns focus to Share button", async ({ page, context }) => {
    await setOwnerSession(context);
    await page.goto(NOTE_URL, { waitUntil: "domcontentloaded" });

    const shareButton = page.getByRole("button", { name: "Share this note" });
    await shareButton.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(shareButton).toBeFocused();
  });

  test("Tab cycles focus inside modal (focus trap)", async ({ page, context }) => {
    await setOwnerSession(context);
    await page.goto(NOTE_URL, { waitUntil: "domcontentloaded" });

    await page.getByRole("button", { name: "Share this note" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // First focusable is the TTL select.
    await expect(page.locator("#share-ttl")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#share-max-views")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(dialog.getByRole("button", { name: "Generate" })).toBeFocused();

    // One more Tab wraps back to the first focusable.
    await page.keyboard.press("Tab");
    await expect(page.locator("#share-ttl")).toBeFocused();
  });
});

test.describe("share modal — clipboard failure fallback", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("when clipboard rejects, URL input is auto-selected", async ({ page, context }) => {
    await setOwnerSession(context);

    // Install a clipboard stub that rejects; must run before any client code
    // gets a chance to call navigator.clipboard.writeText.
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.reject(new Error("denied")) },
      });
    });

    await page.goto(NOTE_URL, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Share this note" }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Generate" }).click();

    const status = dialog.getByRole("status");
    await expect(status).toContainText("Couldn't copy");

    const urlInput = dialog.getByRole("textbox");
    await expect(urlInput).toBeFocused();
    const selection = await urlInput.evaluate(
      (el: HTMLInputElement) => el.value.slice(el.selectionStart ?? 0, el.selectionEnd ?? 0),
    );
    expect(selection).toMatch(/grove\.md\/@test\/s\/sh_mocktest/);
  });
});
