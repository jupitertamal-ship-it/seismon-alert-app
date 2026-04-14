import { useQuery } from "@tanstack/react-query";

export type TimeRange = "hour" | "day" | "week" | "significant";

export interface EarthquakeProperties {
  mag: number;
  place: string;
  time: number;
  updated: number;
  tz: number | null;
  url: string;
  detail: string;
  felt: number | null;
  cdi: number | null;
  mmi: number | null;
  alert: string | null;
  status: string;
  tsunami: number;
  sig: number;
  net: string;
  code: string;
  ids: string;
  sources: string;
  types: string;
  nst: number | null;
  dmin: number | null;
  rms: number | null;
  gap: number | null;
  magType: string;
  type: string;
  title: string;
}

export interface EarthquakeGeometry {
  type: "Point";
  coordinates: [number, number, number]; // longitude, latitude, depth
}

export interface EarthquakeFeature {
  type: "Feature";
  properties: EarthquakeProperties;
  geometry: EarthquakeGeometry;
  id: string;
}

export interface EarthquakeFeatureCollection {
  type: "FeatureCollection";
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: EarthquakeFeature[];
}

const FEED_URLS: Record<TimeRange, string> = {
  hour: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson",
  day: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson",
  week: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson",
  significant: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_day.geojson",
};

export const useEarthquakes = (timeRange: TimeRange = "day") => {
  return useQuery<EarthquakeFeatureCollection, Error>({
    queryKey: ["earthquakes", timeRange],
    queryFn: async () => {
      const response = await fetch(FEED_URLS[timeRange]);
      if (!response.ok) {
        throw new Error("Failed to fetch earthquake data");
      }
      return response.json();
    },
    refetchInterval: 60000, // Refresh every 60 seconds
  });
};

export const getMagColorClass = (mag: number): string => {
  if (mag >= 6.0) return "text-mag-red bg-mag-red/10 border-mag-red/20";
  if (mag >= 4.0) return "text-mag-orange bg-mag-orange/10 border-mag-orange/20";
  if (mag >= 2.0) return "text-mag-yellow bg-mag-yellow/10 border-mag-yellow/20";
  return "text-mag-green bg-mag-green/10 border-mag-green/20";
};

export const getMagDotColorClass = (mag: number): string => {
  if (mag >= 6.0) return "bg-mag-red";
  if (mag >= 4.0) return "bg-mag-orange";
  if (mag >= 2.0) return "bg-mag-yellow";
  return "bg-mag-green";
};
