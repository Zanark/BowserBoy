import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 120000,
  expect: { timeout: 15000 },
  workers: 1,
  retries: 0,
  use: {
    channel: process.env.BROWSER_CHANNEL || 'msedge',
    baseURL: 'http://127.0.0.1:5174/BowserBoyAdvance/',
    viewport: { width: 1440, height: 1100 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node scripts/serve.mjs --dist --port 5174 --base /BowserBoyAdvance/',
    url: 'http://127.0.0.1:5174/BowserBoyAdvance/',
    reuseExistingServer: false,
    timeout: 15000,
  },
});
