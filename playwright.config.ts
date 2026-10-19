import { defineConfig, devices } from '@playwright/test';
import { BASE_PATH } from './vite.config';

const PORT = 4173;

/**
 * End-to-end tests run against the production build (`vite preview`), served under
 * the same base path as GitHub Pages. Mobile projects use Chromium's device
 * emulation (viewport, touch, DPR); this is NOT a test on real iOS Safari/WebKit.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}${BASE_PATH}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'iphone-se',
      use: { ...devices['iPhone SE'], browserName: 'chromium' },
    },
    {
      name: 'iphone-15-landscape',
      use: { ...devices['iPhone 15 landscape'], browserName: 'chromium' },
    },
    {
      name: 'ipad-mini',
      use: { ...devices['iPad Mini'], browserName: 'chromium' },
    },
  ],
  webServer: {
    command: `npx vite build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}${BASE_PATH}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
