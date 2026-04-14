import { useState, useEffect, useRef, useCallback } from "react";
import { EarthquakeFeature } from "./use-earthquakes";

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

function playAlarm(ctx: AudioContext) {
  const beepPattern = [0, 0.22, 0.44, 0.66, 0.88, 1.1, 1.32, 1.54, 1.76, 1.98, 2.2, 2.42];
  beepPattern.forEach((startTime, i) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.value = i % 2 === 0 ? 960 : 720;
    const t = ctx.currentTime + startTime;
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(1.0, t + 0.01);
    gainNode.gain.setValueAtTime(1.0, t + 0.17);
    gainNode.gain.linearRampToValueAtTime(0, t + 0.2);
    osc.start(t);
    osc.stop(t + 0.21);
  });
}

export interface ProximityAlert {
  earthquake: EarthquakeFeature;
  distanceKm: number;
}

export function useProximityAlert(earthquakes: EarthquakeFeature[]) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [proximityAlerts, setProximityAlerts] = useState<ProximityAlert[]>([]);
  const [alarmActive, setAlarmActive] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const seenEqIdsRef = useRef<Set<string>>(new Set());
  const alarmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      setLocationGranted(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocationGranted(true);
        setLocationError(null);
      },
      (err) => {
        setLocationError(err.message);
        setLocationGranted(false);
      },
      { timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  const triggerAlarm = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") {
      ctx.resume().then(() => playAlarm(ctx));
    } else {
      playAlarm(ctx);
    }
    setAlarmActive(true);
    if (alarmTimeoutRef.current) clearTimeout(alarmTimeoutRef.current);
    alarmTimeoutRef.current = setTimeout(() => setAlarmActive(false), 4500);
  }, []);

  const dismissAlarm = useCallback(() => {
    setAlarmActive(false);
    if (alarmTimeoutRef.current) clearTimeout(alarmTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (!userLocation || earthquakes.length === 0) return;

    const newAlerts: ProximityAlert[] = [];
    let shouldAlarm = false;

    for (const eq of earthquakes) {
      const mag = eq.properties.mag;
      if (mag == null || mag < 4.5) continue;
      const [lon, lat] = eq.geometry.coordinates;
      const dist = haversineDistance(userLocation.lat, userLocation.lon, lat, lon);
      if (dist <= 500) {
        newAlerts.push({ earthquake: eq, distanceKm: Math.round(dist) });
        if (!seenEqIdsRef.current.has(eq.id)) {
          seenEqIdsRef.current.add(eq.id);
          shouldAlarm = true;
        }
      }
    }

    setProximityAlerts(newAlerts);
    if (shouldAlarm) triggerAlarm();
  }, [earthquakes, userLocation, triggerAlarm]);

  return {
    userLocation,
    locationError,
    locationGranted,
    proximityAlerts,
    alarmActive,
    dismissAlarm,
  };
}
