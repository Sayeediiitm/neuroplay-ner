import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./tests/e2e/screenshots",
  use: {
    baseURL: "http://localhost:5173",
    // 360px width — minimum target per spec
    viewport: { width: 360, height: 780 },
    screenshot: "on",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium-360",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 360, height: 780 },
      },
    },
  ],
  // Start the Vite dev server before running tests
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  reporter: [["list"], ["html", { open: "never" }]],
});
