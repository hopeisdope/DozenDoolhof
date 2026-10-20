import { defineConfig } from 'vitest/config';
import { serviceWorker } from './pwa/precache.ts';

// GitHub Pages serves the site from /<repository-name>/, which is case-sensitive.
export const BASE_PATH = '/DozenDoolhof/';

export default defineConfig({
  base: BASE_PATH,
  // Writes dist/sw.js with the exact list of built files, for offline play.
  plugins: [serviceWorker()],
  build: {
    target: 'es2022',
  },
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    environment: 'node',
  },
});
