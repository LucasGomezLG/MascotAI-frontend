importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBZXfiM5mlrfpcEGOiUf_1YzqEEa3MmfHg",
  authDomain: "mascotai-e9e96.firebaseapp.com",
  projectId: "mascotai-e9e96",
  storageBucket: "mascotai-e9e96.firebasestorage.app",
  messagingSenderId: "1090049897111",
  appId: "1:1090049897111:web:2ee07b2f631a16b9a6efd2",
  measurementId: "G-5ZH3B983FD"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png',
    data: { url: '/' }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || '/'));
});