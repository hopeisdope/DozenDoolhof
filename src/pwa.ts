/**
 * Registers the service worker that makes the game playable offline (production builds
 * only; `pwa/service-worker.js`). A new version never takes over by itself: `onUpdate`
 * gets a function that switches to it, and the start screen offers that as a button.
 * After switching, every open page reloads once, so no page keeps old HTML around.
 * Without service worker support, or when registering fails, the game simply runs online.
 */
export function registerServiceWorker(onUpdate: (apply: () => void) => void): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const container = navigator.serviceWorker;
  // The very first install takes control without a reload; when one version replaces
  // another, the page reloads so its HTML and files come from the same version again.
  let controller = container.controller;
  let reloading = false;
  container.addEventListener('controllerchange', () => {
    const replaced = controller !== null;
    controller = container.controller;
    if (!replaced || reloading) return;
    reloading = true;
    window.location.reload();
  });

  const offer = (worker: ServiceWorker): void => {
    onUpdate(() => worker.postMessage('skip-waiting'));
  };

  const register = async (): Promise<void> => {
    try {
      const base = import.meta.env.BASE_URL;
      const registration = await container.register(`${base}sw.js`, { scope: base });
      if (registration.waiting && container.controller) offer(registration.waiting);
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        installing?.addEventListener('statechange', () => {
          if (installing.state === 'installed' && container.controller) offer(installing);
        });
      });
      // An app on the home screen can stay open for days: look for a new version when it
      // comes back to the front, at most once an hour.
      let checked = Date.now();
      document.addEventListener('visibilitychange', () => {
        if (document.hidden || Date.now() - checked < 60 * 60 * 1000) return;
        checked = Date.now();
        registration.update().catch(() => undefined);
      });
    } catch {
      // Offline on the very first visit, private mode or blocked: nothing to do.
    }
  };
  if (document.readyState === 'complete') void register();
  else window.addEventListener('load', () => void register(), { once: true });
}
