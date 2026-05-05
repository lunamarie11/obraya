importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Estas variables se reemplazan en runtime via /api/firebase-config o se hardcodean en prod
// En dev, el SW solo se activa si NEXT_PUBLIC_FIREBASE_* están configuradas
self.addEventListener("message", (event) => {
  if (event.data?.type === "FIREBASE_CONFIG") {
    firebase.initializeApp(event.data.config);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const { title, body } = payload.notification ?? {};
      if (title) {
        self.registration.showNotification(title, {
          body: body ?? "",
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          data: payload.data,
        });
      }
    });
  }
});
