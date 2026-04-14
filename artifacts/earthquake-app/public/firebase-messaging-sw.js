importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// Config is injected at install time via a message from the main page,
// but we also embed it directly here so the SW can initialize on cold start.
// The SW scope is /, so it can intercept all push events.
const firebaseConfig = self.__FIREBASE_CONFIG__ || {};

let messaging = null;

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "FIREBASE_CONFIG") {
    const config = event.data.config;
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }
    messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      handlePushPayload(payload);
    });
  }
});

// Also initialize immediately if config was baked in
if (Object.keys(firebaseConfig).length > 0) {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    handlePushPayload(payload);
  });
}

function handlePushPayload(payload) {
  const data = payload.data || {};
  const magnitude = parseFloat(data.magnitude || "0");
  const location = data.location || "Unknown location";
  const distance = data.distance ? `${data.distance} km away` : "";

  const title = magnitude >= 6
    ? "MAJOR EARTHQUAKE ALERT"
    : magnitude >= 5
    ? "Strong Earthquake Alert"
    : "Earthquake Proximity Alert";

  const body = `M${magnitude.toFixed(1)} — ${location}${distance ? " | " + distance : ""}`;

  const options = {
    body,
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: `eq-${data.id || Date.now()}`,
    renotify: true,
    requireInteraction: magnitude >= 5,
    vibrate: magnitude >= 5
      ? [300, 100, 300, 100, 300, 100, 600]
      : [200, 100, 200],
    data: { url: data.url || "/alerts" },
    actions: [
      { action: "view", title: "View Details" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  self.registration.showNotification(title, options);

  // Play alarm sound via AudioContext in SW (where allowed)
  if (magnitude >= 4.5) {
    playAlarmInSW();
  }
}

function playAlarmInSW() {
  // Notify all clients to play the alarm sound
  self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: "EARTHQUAKE_ALARM", play: true });
    });
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/alerts";
  if (event.action === "dismiss") return;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const found = clients.find((c) => c.url.includes(self.location.origin));
        if (found) {
          found.focus();
          found.navigate(url);
        } else {
          self.clients.openWindow(url);
        }
      })
  );
});
