import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  cacheVersion,
  NOT_PRECACHED,
  precacheEntries,
  renderServiceWorker,
  serviceWorker,
} from '../../pwa/precache';

const template = readFileSync(new URL('../../pwa/service-worker.js', import.meta.url), 'utf8');
const bytes = (text: string) => new TextEncoder().encode(text);

describe('precacheEntries', () => {
  it('lists every built file in a stable order, without the worker, maps and hidden files', () => {
    expect(
      precacheEntries([
        'sw.js',
        'index.html',
        'assets/index-abc.js',
        'assets/index-abc.js.map',
        'assets/.DS_Store',
        'manifest.webmanifest',
        'favicon.svg',
        ...NOT_PRECACHED,
        'icons/icon-192.png',
      ]),
    ).toEqual([
      'assets/index-abc.js',
      'favicon.svg',
      'icons/icon-192.png',
      'index.html',
      'manifest.webmanifest',
    ]);
  });

  it('refuses a build without index.html', () => {
    expect(() => precacheEntries(['assets/index.js'])).toThrow(/index\.html/);
  });
});

describe('cacheVersion', () => {
  const files = [
    { path: 'index.html', content: bytes('<html>') },
    { path: 'assets/a.js', content: bytes('a') },
  ];

  it('is stable for the same files in any order', () => {
    expect(cacheVersion(files)).toMatch(/^[0-9a-f]{16}$/);
    expect(cacheVersion([...files].reverse())).toBe(cacheVersion(files));
  });

  it('changes when any name or content changes', () => {
    const base = cacheVersion(files);
    expect(cacheVersion([files[0]!, { path: 'assets/a.js', content: bytes('b') }])).not.toBe(base);
    expect(cacheVersion([files[0]!, { path: 'assets/b.js', content: bytes('a') }])).not.toBe(base);
    expect(cacheVersion([files[0]!])).not.toBe(base);
  });
});

describe('renderServiceWorker', () => {
  it('fills the list and version into the template, giving valid JavaScript', () => {
    const source = renderServiceWorker(template, ['assets/x.js', 'index.html'], 'abc123');
    expect(source).toContain('const PRECACHE = ["assets/x.js","index.html"];');
    expect(source).toContain('const VERSION = "abc123";');
    expect(source).not.toContain('inject:');
    expect(() => new Function(source)).not.toThrow();
  });

  it('fails loudly when the template lost its markers', () => {
    expect(() => renderServiceWorker('const PRECACHE = [];', [], 'v')).toThrow(/markers/);
  });

  it('keeps the worker to the safe rules: no skipWaiting on install, own scope only', () => {
    const install = template.slice(
      template.indexOf("addEventListener('install'"),
      template.indexOf("addEventListener('activate'"),
    );
    expect(install).not.toContain('skipWaiting');
    expect(template).toContain("event.data === 'skip-waiting'");
    expect(template).toContain('url.origin !== scope.origin');
    expect(template).toContain("request.method !== 'GET'");
  });
});

describe('the service worker plugin', () => {
  let dir = '';
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it('writes sw.js listing exactly the files in the output directory', () => {
    dir = mkdtempSync(join(tmpdir(), 'dozendoolhof-sw-'));
    mkdirSync(join(dir, 'dist', 'assets'), { recursive: true });
    mkdirSync(join(dir, 'pwa'));
    writeFileSync(join(dir, 'pwa', 'service-worker.js'), template);
    writeFileSync(join(dir, 'dist', 'index.html'), '<html>');
    writeFileSync(join(dir, 'dist', 'assets', 'index-1.js'), 'x');
    writeFileSync(join(dir, 'dist', 'sw.js'), 'old');

    const plugin = serviceWorker();
    const hooks = plugin as unknown as {
      configResolved(config: { root: string; build: { outDir: string } }): void;
      closeBundle(): void;
    };
    hooks.configResolved({ root: dir, build: { outDir: 'dist' } });
    hooks.closeBundle();
    const written = readFileSync(join(dir, 'dist', 'sw.js'), 'utf8');
    expect(written).toContain('const PRECACHE = ["assets/index-1.js","index.html"];');
    expect(written).toMatch(/const VERSION = "[0-9a-f]{16}";/);
    expect(plugin.apply).toBe('build');
  });
});
