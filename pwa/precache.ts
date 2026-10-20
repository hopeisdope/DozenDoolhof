import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import type { Plugin } from 'vite';

/**
 * Build step for offline play: after Vite has written `dist/`, list every file in it and
 * write `dist/sw.js` from `pwa/service-worker.js` with that list and a version hash. No
 * runtime caching and no dependency: the precache list is exactly what was built.
 */

export const SERVICE_WORKER_FILE = 'sw.js';
const PRECACHE_MARKER = /\/\* inject:precache \*\/ \[[^\]]*\]/;
const VERSION_MARKER = /\/\* inject:version \*\/ '[^']*'/;

export interface BuiltFile {
  /** Path relative to the output directory, with forward slashes. */
  readonly path: string;
  readonly content: Uint8Array;
}

/**
 * Large icons that only the browser's install dialog uses (online, from the manifest);
 * caching them would double the first download for nothing.
 */
export const NOT_PRECACHED: readonly string[] = [
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
];

/** Files to cache, in a stable order: everything built except the worker and install icons. */
export function precacheEntries(paths: readonly string[]): string[] {
  const entries = paths
    .map((path) => path.split(sep).join('/'))
    .filter((path) => path !== SERVICE_WORKER_FILE && !path.endsWith('.map'))
    .filter((path) => !NOT_PRECACHED.includes(path))
    .filter((path) => !path.split('/').some((part) => part.startsWith('.')))
    .sort();
  if (!entries.includes('index.html')) throw new Error('Precache: no index.html in the build');
  return entries;
}

/** A short hash of every cached file's name and content: any change gives a new version. */
export function cacheVersion(files: readonly BuiltFile[]): string {
  const hash = createHash('sha256');
  for (const file of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
    hash.update(file.path).update('\0').update(file.content).update('\0');
  }
  return hash.digest('hex').slice(0, 16);
}

/** Fills the template's markers; fails loudly if the template no longer has them. */
export function renderServiceWorker(
  template: string,
  entries: readonly string[],
  version: string,
): string {
  if (!PRECACHE_MARKER.test(template) || !VERSION_MARKER.test(template)) {
    throw new Error('Service worker template is missing its inject markers');
  }
  return template
    .replace(PRECACHE_MARKER, () => JSON.stringify(entries))
    .replace(VERSION_MARKER, () => JSON.stringify(version));
}

function listFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

/** Vite plugin; `template` is relative to the project root. */
export function serviceWorker(template = 'pwa/service-worker.js'): Plugin {
  let outDir = 'dist';
  let templatePath = template;
  return {
    name: 'dozendoolhof:service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
      templatePath = resolve(config.root, template);
    },
    closeBundle() {
      const files = listFiles(outDir).map((path) => ({
        path: relative(outDir, path).split(sep).join('/'),
        content: readFileSync(path),
      }));
      const entries = precacheEntries(files.map((file) => file.path));
      const cached = files.filter((file) => entries.includes(file.path));
      const source = renderServiceWorker(
        readFileSync(templatePath, 'utf8'),
        entries,
        cacheVersion(cached),
      );
      writeFileSync(join(outDir, SERVICE_WORKER_FILE), source);
    },
  };
}
