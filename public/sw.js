// This file must live at the site root (/public/sw.js -> served at /sw.js)
// so its scope covers the entire site.

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Awaaz Uthao';
  const options = {
    body: data.body || 'A new update was just published.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/updates' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/updates';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
