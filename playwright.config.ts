import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false, // run sequentially — API tests share DB state
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:49951",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "api",
      testMatch: "**/tests/api/**/*.ts",
    },
    {
      name: "e2e",
      testMatch: "**/tests/e2e/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // No webServer block — user starts dev server separately
});
