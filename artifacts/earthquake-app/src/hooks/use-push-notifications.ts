import { useState, useEffect, useCallback } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { getFirebaseMessaging, sendSwConfig } from "@/lib/firebase";

export type PermissionState = "default" | "granted" | "denied" | "unsupported";

export interface PushNotificationState {
  permission: PermissionState;
  fcmToken: string | null;
  isRegistering: boolean;
  error: string | null;
  requestPermission: () => Promise<void>;
}

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const REGISTER_URL = "/api/notifications/register";

async function registerTokenWithServer(
  token: string,
  lat?: number,
  lon?: number
): Promise<void> {
  await fetch(REGISTER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, lat, lon }),
  });
}

export function usePushNotifications(
  userLocation: { lat: number; lon: number } | null
): PushNotificationState {
  const [permission, setPermission] = useState<PermissionState>(() => {
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission as PermissionState;
  });
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setupToken = useCallback(async () => {
    if (!("serviceWorker" in navigator)) {
      setError("Service workers not supported");
      return;
    }
    setIsRegistering(true);
    setError(null);
    try {
      // Register the service worker
      let reg = await navigator.serviceWorker.getRegistration("/");
      if (!reg) {
        reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
          scope: "/",
        });
      }
      await navigator.serviceWorker.ready;
      sendSwConfig();

      const messaging = getFirebaseMessaging();
      if (!messaging) {
        setError("Firebase Messaging could not be initialized");
        return;
      }

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: reg,
      });

      if (token) {
        setFcmToken(token);
        await registerTokenWithServer(
          token,
          userLocation?.lat,
          userLocation?.lon
        );
      } else {
        setError("Failed to get FCM token");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsRegistering(false);
    }
  }, [userLocation]);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result as PermissionState);
    if (result === "granted") {
      await setupToken();
    }
  }, [setupToken]);

  // If already granted on mount, set up token automatically
  useEffect(() => {
    if (permission === "granted" && !fcmToken && !isRegistering) {
      setupToken();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for foreground messages
  useEffect(() => {
    const messaging = getFirebaseMessaging();
    if (!messaging) return;
    const unsubscribe = onMessage(messaging, (payload) => {
      const data = payload.data || {};
      const mag = parseFloat(data.magnitude || "0");
      const location = data.location || "Unknown location";
      if (Notification.permission === "granted") {
        new Notification(
          mag >= 5 ? "Strong Earthquake Alert" : "Earthquake Proximity Alert",
          {
            body: `M${mag.toFixed(1)} — ${location}`,
            icon: "/favicon.svg",
            requireInteraction: mag >= 5,
          }
        );
      }
    });
    return () => unsubscribe();
  }, [fcmToken]);

  return { permission, fcmToken, isRegistering, error, requestPermission };
}
