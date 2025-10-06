import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
const CONVEX_URL = process.env.VITE_CONVEX_URL ?? "http://127.0.0.1:3999";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ...(process.env.CI ? [["github"]] : [])],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `pnpm exec vite --host 127.0.0.1 --port ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      ...process.env,
      VITE_CONVEX_URL: CONVEX_URL,
    },
  },
});
