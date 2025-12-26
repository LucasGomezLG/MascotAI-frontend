self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'MascotAI', body: '¡Alerta de Stock!' };
  
  const options = {
    body: data.body,
    icon: '/logo192.png',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: { url: '/' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});