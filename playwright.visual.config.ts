import { defineConfig } from "@playwright/test";

const BASE_PORT = Number(process.env.VISUAL_TEST_PORT ?? 3849);
const MOCK_PORT = Number(process.env.VISUAL_MOCK_API_PORT ?? 3850);

export default defineConfig({
  testDir: "./test",
  testMatch: "**/visual.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${BASE_PORT}`,
    trace: "off",
  },
  expect: {
    toHaveScreenshot: {
      // Ignore up to 0.5% of pixels as antialiasing noise.
      maxDiffPixelRatio: 0.005,
      // Where snapshots live. Version-controlled.
      threshold: 0.2,
    },
  },
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{arg}{ext}",
  webServer: [
    {
      command: `MOCK_API_PORT=${MOCK_PORT} node test/mobile-mock-api.mjs`,
      port: MOCK_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 15_000,
    },
    {
      command: `GROVE_API_URL=http://localhost:${MOCK_PORT} AUTH_SECRET=playwright-mobile-test-secret NEXT_DIST_DIR=.next-visual-test next dev --port ${BASE_PORT}`,
      port: BASE_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
