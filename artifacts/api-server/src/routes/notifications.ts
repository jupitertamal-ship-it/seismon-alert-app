import { Router, type IRouter } from "express";
import admin from "firebase-admin";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ── Firebase Admin init ──────────────────────────────────────────────────────

let adminInitialized = false;

function ensureAdmin() {
  if (adminInitialized) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    logger.warn("FIREBASE_SERVICE_ACCOUNT_JSON not set — push notifications disabled");
    return;
  }
  try {
    // Step 1: fix invalid backslash escapes so JSON.parse doesn't throw.
    // When service account JSON is pasted into Replit Secrets, some backslashes
    // get duplicated, turning valid characters into invalid JSON escapes like \C.
    // The intent was just the character itself (C), so we drop the stray backslash.
    // Valid JSON escape chars after backslash: " \ / b f n r t u (and digits for \uXXXX)
    const INVALID_ESCAPE = /\\([^"\\\/bfnrtu0-9])/g;
    const cleaned = raw.replace(INVALID_ESCAPE, "$1");  // drop backslash, keep char
    const serviceAccount = JSON.parse(cleaned) as Record<string, unknown>;

    // Step 2: restore PEM newlines in the private key
    if (typeof serviceAccount.private_key === "string") {
      serviceAccount.private_key = (serviceAccount.private_key as string).replace(/\\n/g, "\n");
    }
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount as admin.ServiceAccount) });
    }
    adminInitialized = true;
    logger.info("Firebase Admin initialized successfully");
  } catch (err) {
    logger.error({ err }, "Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON");
  }
}

ensureAdmin();

// ── In-memory token store (replace with DB for production) ───────────────────

interface TokenEntry {
  token: string;
  lat?: number;
  lon?: number;
  registeredAt: number;
}

const tokenStore = new Map<string, TokenEntry>();

// ── Helpers ──────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

// ── Routes ───────────────────────────────────────────────────────────────────

// POST /api/notifications/register
router.post("/notifications/register", (req, res) => {
  const { token, lat, lon } = req.body as {
    token?: string;
    lat?: number;
    lon?: number;
  };

  if (!token || typeof token !== "string") {
    res.status(400).json({ error: "token is required" });
    return;
  }

  tokenStore.set(token, {
    token,
    lat: lat != null ? Number(lat) : undefined,
    lon: lon != null ? Number(lon) : undefined,
    registeredAt: Date.now(),
  });

  req.log.info({ tokenCount: tokenStore.size }, "FCM token registered");
  res.json({ ok: true, registered: tokenStore.size });
});

// DELETE /api/notifications/unregister
router.delete("/notifications/unregister", (req, res) => {
  const { token } = req.body as { token?: string };
  if (token) tokenStore.delete(token);
  res.json({ ok: true });
});

// GET /api/notifications/status
router.get("/notifications/status", (_req, res) => {
  res.json({ registered: tokenStore.size, adminReady: adminInitialized });
});

// ── Background USGS polling & push sender ────────────────────────────────────

const USGS_URL =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson";

const sentIds = new Set<string>();

async function pollAndNotify() {
  if (!adminInitialized || tokenStore.size === 0) return;

  let features: Array<{
    id: string;
    properties: { mag: number; place: string; time: number; url: string };
    geometry: { coordinates: [number, number, number] };
  }>;

  try {
    const resp = await fetch(USGS_URL);
    const data = (await resp.json()) as { features: typeof features };
    features = data.features;
  } catch (err) {
    logger.warn({ err }, "Failed to fetch USGS data for push");
    return;
  }

  for (const eq of features) {
    const { mag, place, time, url } = eq.properties;
    if (!mag || mag < 4.5) continue;
    if (sentIds.has(eq.id)) continue;

    const [lon, lat] = eq.geometry.coordinates;
    const tokensToNotify: Array<{ entry: TokenEntry; distanceKm: number }> = [];

    for (const entry of tokenStore.values()) {
      // If the token has a location, only notify if within 500 km
      if (entry.lat != null && entry.lon != null) {
        const dist = haversineKm(entry.lat, entry.lon, lat, lon);
        if (dist <= 500) {
          tokensToNotify.push({ entry, distanceKm: Math.round(dist) });
        }
      } else {
        // No location stored — notify for all M4.5+
        tokensToNotify.push({ entry, distanceKm: 0 });
      }
    }

    if (tokensToNotify.length === 0) continue;

    sentIds.add(eq.id);
    // Keep the set from growing forever
    if (sentIds.size > 500) {
      const first = sentIds.values().next().value;
      if (first !== undefined) sentIds.delete(first);
    }

    const title =
      mag >= 7
        ? "MAJOR EARTHQUAKE — TAKE COVER"
        : mag >= 6
        ? "Strong Earthquake Alert"
        : mag >= 5
        ? "Moderate Earthquake Alert"
        : "Earthquake Proximity Alert";

    const body = `M${mag.toFixed(1)} — ${place}`;

    const notifications = tokensToNotify.map(({ entry, distanceKm }) =>
      admin
        .messaging()
        .send({
          token: entry.token,
          notification: { title, body },
          data: {
            id: eq.id,
            magnitude: String(mag),
            location: place,
            distance: String(distanceKm),
            time: String(time),
            url: url || "",
          },
          android: {
            priority: "high",
            notification: {
              channelId: "earthquake_alerts",
              priority: "max",
              defaultVibrateTimings: false,
              vibrateTimingsMillis: [300, 100, 300, 100, 600],
              sound: "default",
            },
          },
          apns: {
            headers: { "apns-priority": "10" },
            payload: {
              aps: {
                alert: { title, body },
                sound: { critical: true, name: "default", volume: 1.0 },
                "content-available": 1,
              },
            },
          },
          webpush: {
            headers: { Urgency: "high" },
            notification: {
              title,
              body,
              icon: "/favicon.svg",
              requireInteraction: mag >= 5,
              vibrate: [300, 100, 300, 100, 600],
              tag: `eq-${eq.id}`,
              renotify: true,
            },
          },
        })
        .catch((err: unknown) => {
          // Remove stale tokens
          if (
            err instanceof Error &&
            (err.message.includes("registration-token-not-registered") ||
              err.message.includes("invalid-registration-token"))
          ) {
            tokenStore.delete(entry.token);
          }
          logger.warn({ err }, "Failed to send push");
        })
    );

    await Promise.allSettled(notifications);
    logger.info({ eq: eq.id, mag, recipients: tokensToNotify.length }, "Push notifications sent");
  }
}

// Poll every 10 seconds
setInterval(() => {
  pollAndNotify().catch((err) => logger.error({ err }, "Poll error"));
}, 10000);

// Initial poll after 3s startup delay
setTimeout(() => {
  pollAndNotify().catch((err) => logger.error({ err }, "Initial poll error"));
}, 3000);

export default router;
