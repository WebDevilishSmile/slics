// The service worker for push notifications (docs/PUSH-NOTIFICATIONS.md).
// Push only, never a cache: it shows a push and opens the app when one is
// tapped, and it has NO fetch handler, ever, so it never comes between a page
// and the network. It's registered only when someone turns notifications on
// (hooks/usePushNotifications.js) and unregistered when they turn them off.

// Lifecycle only: a new version takes over at once, and the page that turned
// notifications on is controlled right away, so a tap can navigate it.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// A payload is { title, body, url, tag } from lib/push.js. Every push shows a
// notification: browsers (iOS especially) revoke a subscription that pushes
// silently.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }

  const options = {
    body: data.body || '',
    icon: '/android-chrome-192x192.png',
    data: { url: data.url || '/home' },
  };
  if (data.tag) options.tag = data.tag;

  event.waitUntil(self.registration.showNotification(data.title || 'SLICs', options));
});

// A tap opens the notification's page in the app: an open window is focused
// and sent there, or a new one is opened. Only this site's own pages.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  let url = new URL(event.notification.data?.url || '/home', self.location.origin);
  if (url.origin !== self.location.origin) url = new URL('/home', self.location.origin);

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const open = windows.find((client) => new URL(client.url).origin === url.origin);
      if (open) {
        try {
          const focused = await open.focus();
          await (focused || open).navigate(url.href);
          return;
        } catch {
          // navigate() refuses a window this worker doesn't control.
        }
      }
      await self.clients.openWindow(url.href);
    })(),
  );
});
