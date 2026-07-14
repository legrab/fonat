import { defineConfig } from "@playwright/test";

const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

export default defineConfig({
  testDir: "tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
    launchOptions: chromiumExecutable
      ? { executablePath: chromiumExecutable }
      : undefined,
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
