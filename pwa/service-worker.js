/**
 * Dozendoolhof's service worker: makes the whole game work offline after one visit.
 *
 * `pwa/precache.ts` turns this template into `dist/sw.js` at build time, filling in the
 * exact list of built files and a version (a hash of their contents). Each version keeps
 * its files in a cache of its own, installed all at once (or not at all), and the page is
 * always served from the cache of the version that controls it: HTML and scripts can
 * never come from different builds. A new version waits until the player taps "update"
 * on the start screen (or every tab is closed); only then is the old cache removed.
 *
 * Only this game's own files under its scope are handled; other requests go to the
 * network untouched, and nothing is cached at runtime.
 */

const PRECACHE = /* inject:precache */ ['index.html'];
const VERSION = /* inject:version */ 'dev';
const CACHE_PREFIX = 'dozendoolhof-';
const CACHE = `${CACHE_PREFIX}${VERSION}`;

const scope = new URL(self.registration.scope);
const shell = new URL('index.html', scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // Straight from the network, so a stale HTTP cache cannot mix in an older file.
      .then((cache) =>
        cache.addAll(
          PRECACHE.map((path) => new Request(new URL(path, scope), { cache: 'reload' })),
        ),
      ),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;

  // Every page of the game is the same app shell, also with ?tier=…&level=… behind it.
  const key = request.mode === 'navigate' ? shell : request;
  event.respondWith(
    caches
      .open(CACHE)
      .then((cache) => cache.match(key))
      .then((cached) => cached ?? fetch(request)),
  );
});
