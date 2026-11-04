import { defineConfig, devices } from '@playwright/test';

// PW_CHANNEL=msedge (or chrome) uses an installed browser instead of Playwright's download.
const channel = process.env.PW_CHANNEL;

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://127.0.0.1:5199', trace: 'on-first-retry' },
  webServer: {
    command: 'npx vite --host 127.0.0.1 --port 5199 --strictPort',
    url: 'http://127.0.0.1:5199/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, ...(channel ? { channel } : {}) } },
    { name: 'mobile', use: { ...devices['Pixel 7'], ...(channel ? { channel } : {}) } }
  ],
  reporter: 'list'
});
