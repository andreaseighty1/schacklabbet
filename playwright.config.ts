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
      testIgnore: [
        "**/touch.spec.ts",
        "**/compact.spec.ts",
        "**/security.spec.ts",
      ],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1366, height: 768 },
      },
    },
    {
      name: "mobile",
      testIgnore: [
        "**/touch.spec.ts",
        "**/compact.spec.ts",
        "**/security.spec.ts",
      ],
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
    {
      name: "compact-laptop",
      testMatch: "**/compact.spec.ts",
      use: { ...devices["Desktop Chrome"], hasTouch: true },
    },
    {
      name: "touchscreen",
      testMatch: [
        "**/touch.spec.ts",
        "**/review.spec.ts",
        "**/appearance.spec.ts",
        "**/motion.spec.ts",
        "**/tactics.spec.ts",
        "**/learning.spec.ts",
        "**/daily.spec.ts",
        "**/multiplayer.spec.ts",
      ],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1366, height: 768 },
        hasTouch: true,
      },
    },
    {
      name: "production-security",
      testMatch: "**/security.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://127.0.0.1:4173",
        viewport: { width: 1024, height: 768 },
      },
    },
  ],
  webServer: [
    {
      command: "npm run dev -- --port 5173 --strictPort",
      url: "http://127.0.0.1:5173",
      env: { VITE_TURNSTILE_SITE_KEY: "" },
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      command: "npm run build && npm run preview -- --port 4173 --strictPort",
      url: "http://127.0.0.1:4173",
      env: { VITE_TURNSTILE_SITE_KEY: "e2e-public-sitekey" },
      reuseExistingServer: false,
      timeout: 90000,
    },
  ],
});
