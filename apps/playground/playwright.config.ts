import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: "**/extensions/**/*",
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 10,
  maxFailures: 100,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    channel: "chromium",
    video: "off",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: [
    {
      command: "pnpm --filter playground dev",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm --filter xcm-api start",
      url: "http://localhost:3001",
      timeout: 20 * 1000,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
    },
  ],
});
