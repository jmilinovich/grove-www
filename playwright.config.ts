import { defineConfig } from "@playwright/test";

const BASE_PORT = Number(process.env.MOBILE_TEST_PORT ?? 3847);
const MOCK_PORT = Number(process.env.MOCK_API_PORT ?? 3848);

export default defineConfig({
  testDir: "./test",
  testMatch: ["**/mobile.spec.ts", "**/share-modal.spec.ts"],
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${BASE_PORT}`,
    viewport: { width: 375, height: 667 },
    trace: "off",
  },
  webServer: [
    {
      command: `MOCK_API_PORT=${MOCK_PORT} node test/mobile-mock-api.mjs`,
      port: MOCK_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 15_000,
    },
    {
      command: `GROVE_API_URL=http://localhost:${MOCK_PORT} AUTH_SECRET=playwright-mobile-test-secret NEXT_DIST_DIR=.next-mobile-test next dev --port ${BASE_PORT}`,
      port: BASE_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
