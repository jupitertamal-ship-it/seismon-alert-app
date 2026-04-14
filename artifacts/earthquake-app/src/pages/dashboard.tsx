import React, { useState, useEffect } from "react";
import { useEarthquakes, TimeRange } from "@/hooks/use-earthquakes";
import { useProximityAlert } from "@/hooks/use-proximity-alert";
import { Layout } from "@/components/layout";
import { EarthquakeList } from "@/components/earthquake-list";
import { WorldMap } from "@/components/world-map";
import { AlertTriangle, Activity, Database, TrendingUp, Filter, MapPin, Volume2, VolumeX, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>("day");
  const { data, isLoading, isError, isRefetching } = useEarthquakes(timeRange);

  const earthquakes = data?.features || [];
  const { userLocation, locationError, locationGranted, proximityAlerts, alarmActive, dismissAlarm } =
    useProximityAlert(earthquakes);

  // Countdown timer for next refresh (10s interval)
  const [countdown, setCountdown] = useState(10);
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => (c <= 1 ? 10 : c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset countdown when data is fetched
  useEffect(() => {
    if (!isRefetching) {
      setCountdown(10);
    }
  }, [isRefetching, data]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-primary space-y-4">
          <Activity className="w-12 h-12 animate-pulse-fast" />
          <p className="uppercase tracking-widest text-sm animate-pulse">Initializing Data Feed...</p>
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <Alert variant="destructive" className="bg-destructive/10 border-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>Failed to connect to the USGS telemetry feed. Please check your connection.</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  // Calculate stats
  const totalCount = earthquakes.length;
  const strongest = earthquakes.reduce((max, eq) => Math.max(max, eq.properties.mag), 0);
  const avgMag = earthquakes.length > 0 
    ? earthquakes.reduce((sum, eq) => sum + eq.properties.mag, 0) / earthquakes.length 
    : 0;

  // Find recent significant quakes for alerts
  const recentSignificant = earthquakes.filter(
    eq => eq.properties.mag >= 4.0 && (Date.now() - eq.properties.time) < 1000 * 60 * 60 // Last hour
  );

  return (
    <Layout>
      <div className="flex flex-col h-full space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-foreground">Global Telemetry</h2>
            <p className="text-muted-foreground text-sm uppercase tracking-widest mt-1 flex items-center gap-2">
              <Database className="w-3 h-3" /> Live USGS Feed
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 bg-white/5 border border-white/5 p-1 rounded-md">
              <Filter className="w-4 h-4 text-muted-foreground ml-2" />
              {(["hour", "day", "week"] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded text-xs uppercase tracking-wider transition-colors ${
                    timeRange === range ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`filter-${range}`}
                >
                  {range}
                </button>
              ))}
            </div>
            
            <div className="bg-card border border-border px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-mono w-32 justify-center">
              <Activity className="w-3 h-3 text-primary animate-pulse-fast" />
              T - {countdown}s
            </div>
          </div>
        </div>

        {/* Proximity Alarm Banner */}
        {alarmActive && proximityAlerts.length > 0 && (
          <div className="animate-in slide-in-from-top-4 fade-in duration-300">
            {proximityAlerts.map(({ earthquake: eq, distanceKm }) => (
              <div
                key={eq.id}
                className="relative flex items-start gap-4 bg-red-950 border-2 border-red-500 rounded-lg p-4 overflow-hidden"
                data-testid="proximity-alarm-banner"
              >
                <div className="absolute inset-0 bg-red-600/10 animate-pulse pointer-events-none" />
                <Volume2 className="w-7 h-7 text-red-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-red-300 font-black uppercase tracking-widest text-sm">
                      PROXIMITY ALARM
                    </span>
                    <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                      M {eq.properties.mag.toFixed(1)}
                    </span>
                    <span className="text-red-400 text-xs font-mono border border-red-700 px-2 py-0.5 rounded">
                      {distanceKm} km from you
                    </span>
                  </div>
                  <div className="text-red-200 text-xs mt-1 truncate">
                    {eq.properties.place}
                  </div>
                  <div className="text-red-400 text-[10px] mt-0.5 uppercase tracking-wider">
                    Magnitude 4.5+ event within 500 km of your location
                  </div>
                </div>
                <button
                  onClick={dismissAlarm}
                  className="shrink-0 text-red-400 hover:text-red-200 transition-colors"
                  data-testid="dismiss-alarm"
                  aria-label="Dismiss alarm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Geolocation Status */}
        {locationGranted === false && (
          <div className="flex items-center gap-2 bg-yellow-950/50 border border-yellow-700/50 rounded-md px-3 py-2 text-xs text-yellow-400" data-testid="location-error-banner">
            <MapPin className="w-4 h-4 shrink-0" />
            <span>Location access denied — proximity alarm disabled. {locationError}</span>
          </div>
        )}
        {locationGranted === true && proximityAlerts.length === 0 && !alarmActive && (
          <div className="flex items-center gap-2 bg-green-950/30 border border-green-800/30 rounded-md px-3 py-2 text-xs text-green-500" data-testid="location-ok-banner">
            <MapPin className="w-4 h-4 shrink-0" />
            <span>
              Location acquired — monitoring for M4.5+ events within 500 km of your position
              {userLocation && (
                <span className="ml-1 text-green-600">
                  ({userLocation.lat.toFixed(2)}, {userLocation.lon.toFixed(2)})
                </span>
              )}
            </span>
            <VolumeX className="w-4 h-4 ml-auto text-green-600" />
          </div>
        )}

        {/* Significant Alerts */}
        {recentSignificant.length > 0 && (
          <div className="space-y-2 animate-in slide-in-from-top-4 fade-in duration-500">
            {recentSignificant.map(eq => (
              <Alert key={eq.id} variant="destructive" className="bg-mag-red/10 border-mag-red text-mag-red relative overflow-hidden">
                <div className="absolute inset-0 bg-mag-red/5 animate-pulse-fast pointer-events-none" />
                <AlertTriangle className="h-5 w-5 !text-mag-red" />
                <AlertTitle className="uppercase font-bold tracking-wider text-sm flex items-center gap-2">
                  Significant Seismic Event Detected
                  <span className="bg-mag-red text-mag-red-foreground px-2 py-0.5 rounded text-xs">M {eq.properties.mag.toFixed(1)}</span>
                </AlertTitle>
                <AlertDescription className="text-mag-red/80 text-xs mt-1">
                  {eq.properties.place} • {new Date(eq.properties.time).toLocaleTimeString()}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Active Events" value={totalCount.toString()} subtitle={`Last ${timeRange}`} />
          <StatCard title="Max Magnitude" value={`M ${strongest.toFixed(1)}`} subtitle="Peak Intensity" valueColor={strongest >= 6 ? "text-mag-red" : strongest >= 4 ? "text-mag-orange" : "text-primary"} />
          <StatCard title="Avg Magnitude" value={`M ${avgMag.toFixed(1)}`} subtitle="Baseline Average" />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <WorldMap earthquakes={earthquakes} />
            <div className="flex-1 bg-card rounded-lg border border-border p-4">
               {/* Activity Graph placeholder */}
               <div className="flex items-center justify-between mb-4">
                 <h3 className="uppercase tracking-widest text-xs font-bold text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" /> Energy Signature
                 </h3>
               </div>
               <div className="h-32 w-full flex items-end justify-between gap-1 opacity-50 px-2 pb-2">
                 {/* Fake waveform */}
                 {Array.from({ length: 50 }).map((_, i) => {
                    const height = Math.random() * 20 + (Math.sin(i * 0.5) * 10) + 10;
                    return (
                      <div key={i} className="w-full bg-primary rounded-t-sm transition-all" style={{ height: `${height}%`, opacity: Math.random() * 0.5 + 0.2 }} />
                    )
                 })}
               </div>
               <div className="text-[10px] text-muted-foreground uppercase text-center border-t border-border pt-2">Simulated Waveform Reference</div>
            </div>
          </div>
          
          <div className="lg:col-span-1 h-[600px] lg:h-auto">
            <EarthquakeList earthquakes={earthquakes} isRefetching={isRefetching} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, subtitle, valueColor = "text-foreground" }: { title: string; value: string; subtitle: string; valueColor?: string }) {
  return (
    <div className="bg-card border border-border p-5 rounded-lg flex flex-col justify-center relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors" />
      <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-bold">{title}</div>
      <div className={`text-3xl font-mono ${valueColor}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase mt-2 opacity-70">{subtitle}</div>
    </div>
  );
}
