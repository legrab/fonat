import { defineConfig, devices } from '@playwright/test';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure'
  },
  webServer: [
    {
      command: 'npm run dev:e2e -w @fonat/server',
      url: 'http://127.0.0.1:3100/api/health',
      reuseExistingServer: !process.env.CI
    },
    {
      command: 'npm run dev:e2e -w @fonat/web',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: !process.env.CI
    }
  ],
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: executablePath ? { executablePath, args: ['--no-sandbox'] } : undefined
      }
    }
  ]
});
