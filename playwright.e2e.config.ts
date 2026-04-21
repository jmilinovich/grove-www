import { defineConfig } from "@playwright/test";

const BASE_PORT = Number(process.env.E2E_TEST_PORT ?? 3849);
const MOCK_PORT = Number(process.env.E2E_MOCK_API_PORT ?? 3850);

export default defineConfig({
  testDir: "./test",
  testMatch: "**/multi-resident.e2e.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${BASE_PORT}`,
    trace: "off",
  },
  webServer: [
    {
      command: `MOCK_API_PORT=${MOCK_PORT} node test/multi-resident-mock-api.mjs`,
      port: MOCK_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 15_000,
    },
    {
      command: `GROVE_API_URL=http://localhost:${MOCK_PORT} AUTH_SECRET=playwright-e2e-secret NEXT_DIST_DIR=.next-e2e-test next dev --port ${BASE_PORT}`,
      port: BASE_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
