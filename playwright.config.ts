import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:5173", trace: "retain-on-failure" },
  projects: [
    {
      name: "desktop",
      testIgnore: "**/touch.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1366, height: 768 },
      },
    },
    {
      name: "mobile",
      testIgnore: "**/touch.spec.ts",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
    {
      name: "touchscreen",
      testMatch: [
        "**/touch.spec.ts",
        "**/review.spec.ts",
        "**/appearance.spec.ts",
        "**/tactics.spec.ts",
        "**/multiplayer.spec.ts",
      ],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1366, height: 768 },
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "npm run dev -- --port 5173 --strictPort",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
