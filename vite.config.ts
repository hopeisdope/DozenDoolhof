import { defineConfig } from 'vitest/config';

// GitHub Pages serves the site from /<repository-name>/, which is case-sensitive.
export const BASE_PATH = '/DozenDoolhof/';

export default defineConfig({
  base: BASE_PATH,
  build: {
    target: 'es2022',
  },
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    environment: 'node',
  },
});
