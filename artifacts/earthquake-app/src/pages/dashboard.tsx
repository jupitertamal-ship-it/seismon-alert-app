import React, { useState, useEffect, useRef } from "react";
import { useEarthquakes, TimeRange, EarthquakeFeature } from "@/hooks/use-earthquakes";
import { useProximityAlert } from "@/hooks/use-proximity-alert";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { Layout } from "@/components/layout";
import { EarthquakeList } from "@/components/earthquake-list";
import { WorldMap } from "@/components/world-map";
import { AlertTriangle, Activity, Database, TrendingUp, Filter, MapPin, Volume2, VolumeX, X, Bell, BellOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>("day");
  const { data, isLoading, isError, isRefetching } = useEarthquakes(timeRange);

  const earthquakes = data?.features || [];
  const { userLocation, locationError, locationGranted, proximityAlerts, alarmActive, dismissAlarm } =
    useProximityAlert(earthquakes);

  const { permission, isRegistering, requestPermission } = usePushNotifications(userLocation);

  // Listen for alarm trigger from service worker background notifications
  const audioCtxRef = useRef<AudioContext | null>(null);
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "EARTHQUAKE_ALARM" && event.data.play) {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContext();
        }
        const ctx = audioCtxRef.current;
        const resume = () => {
          const beats = [0, 0.22, 0.44, 0.66, 0.88, 1.1, 1.32, 1.54];
          beats.forEach((start, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = "square";
            osc.frequency.value = i % 2 === 0 ? 960 : 720;
            const t = ctx.currentTime + start;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(1.0, t + 0.01);
            gain.gain.setValueAtTime(1.0, t + 0.17);
            gain.gain.linearRampToValueAtTime(0, t + 0.2);
            osc.start(t);
            osc.stop(t + 0.21);
          });
        };
        ctx.state === "suspended" ? ctx.resume().then(resume) : resume();
      }
    };
    navigator.serviceWorker?.addEventListener("message", handler);
    return () => navigator.serviceWorker?.removeEventListener("message", handler);
  }, []);

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

        {/* Push Notification Permission Banner */}
        {permission === "default" && (
          <div className="flex items-center gap-3 bg-blue-950/50 border border-blue-700/50 rounded-md px-4 py-2.5 text-xs" data-testid="push-permission-banner">
            <Bell className="w-4 h-4 text-blue-400 shrink-0" />
            <div className="flex-1">
              <span className="text-blue-300 font-semibold uppercase tracking-wider">Enable Push Notifications</span>
              <span className="text-blue-400 ml-2">Get real-time M4.5+ alerts even when the app is closed</span>
            </div>
            <button
              onClick={requestPermission}
              disabled={isRegistering}
              className="shrink-0 bg-blue-700 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              data-testid="enable-push-btn"
            >
              {isRegistering ? "Registering..." : "Enable"}
            </button>
          </div>
        )}
        {permission === "granted" && (
          <div className="flex items-center gap-2 bg-blue-950/20 border border-blue-900/30 rounded-md px-3 py-2 text-xs text-blue-500" data-testid="push-active-banner">
            <Bell className="w-4 h-4 shrink-0" />
            <span>Push notifications active — you will receive alerts even when the app is closed</span>
          </div>
        )}
        {permission === "denied" && (
          <div className="flex items-center gap-2 bg-yellow-950/30 border border-yellow-800/30 rounded-md px-3 py-2 text-xs text-yellow-500" data-testid="push-denied-banner">
            <BellOff className="w-4 h-4 shrink-0" />
            <span>Push notifications blocked — enable them in your browser settings to receive background alerts</span>
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
            <MagnitudeChart earthquakes={earthquakes} />
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

function barColor(mag: number): string {
  if (mag >= 6.0) return "#ef4444";
  if (mag >= 4.0) return "#f97316";
  if (mag >= 2.0) return "#eab308";
  return "#22c55e";
}

function MagnitudeChart({ earthquakes }: { earthquakes: EarthquakeFeature[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  // Sort oldest → newest, take last 80 events
  const sorted = [...earthquakes]
    .filter(eq => eq.properties.mag != null)
    .sort((a, b) => a.properties.time - b.properties.time)
    .slice(-80);

  const maxMag = 9;
  const yTicks = [0, 3, 6, 9];

  const hoveredEq = hovered !== null ? sorted[hovered] : null;

  return (
    <div className="bg-card rounded-lg border border-border p-4" data-testid="magnitude-chart">
      <div className="flex items-center justify-between mb-3">
        <h3 className="uppercase tracking-widest text-xs font-bold text-muted-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Energy Signature
        </h3>
        <span className="text-[10px] text-muted-foreground font-mono">
          {sorted.length} events
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-muted-foreground text-xs uppercase tracking-wider">
          No data in range
        </div>
      ) : (
        <>
          {/* Tooltip */}
          <div className="h-9 mb-1 flex items-center">
            {hoveredEq ? (
              <div className="text-xs font-mono flex items-center gap-3 animate-in fade-in duration-100">
                <span
                  className="px-1.5 py-0.5 rounded text-white text-[11px] font-bold"
                  style={{ background: barColor(hoveredEq.properties.mag) }}
                  data-testid="chart-tooltip-mag"
                >
                  M {hoveredEq.properties.mag.toFixed(1)}
                </span>
                <span className="text-muted-foreground truncate max-w-xs" data-testid="chart-tooltip-place">
                  {hoveredEq.properties.place}
                </span>
                <span className="text-muted-foreground/60 shrink-0">
                  {new Date(hoveredEq.properties.time).toLocaleTimeString()}
                </span>
              </div>
            ) : (
              <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
                Hover a bar for details
              </span>
            )}
          </div>

          {/* Chart area */}
          <div className="flex gap-px items-end" style={{ height: "7rem" }}>
            {/* Y-axis */}
            <div className="flex flex-col justify-between items-end pr-1.5 shrink-0" style={{ height: "100%" }}>
              {[...yTicks].reverse().map(t => (
                <span key={t} className="text-[9px] text-muted-foreground/50 font-mono leading-none">
                  {t}
                </span>
              ))}
            </div>

            {/* Bars */}
            <div className="relative flex-1 flex items-end gap-px" style={{ height: "100%" }}>
              {/* Grid lines */}
              {yTicks.map(t => (
                <div
                  key={t}
                  className="absolute w-full border-t border-white/5"
                  style={{ bottom: `${(t / maxMag) * 100}%` }}
                />
              ))}

              {sorted.map((eq, i) => {
                const pct = Math.max(2, (eq.properties.mag / maxMag) * 100);
                const color = barColor(eq.properties.mag);
                const isHov = hovered === i;
                return (
                  <div
                    key={eq.id}
                    className="flex-1 rounded-t-sm cursor-crosshair transition-all duration-150"
                    style={{
                      height: `${pct}%`,
                      background: color,
                      opacity: isHov ? 1 : hovered !== null ? 0.35 : 0.7,
                      transform: isHov ? "scaleY(1.06)" : "scaleY(1)",
                      transformOrigin: "bottom",
                      minWidth: 2,
                    }}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    data-testid={`chart-bar-${i}`}
                  />
                );
              })}
            </div>
          </div>

          {/* X-axis label */}
          <div className="flex justify-between text-[9px] text-muted-foreground/40 font-mono mt-1.5 border-t border-border pt-1">
            <span>{sorted.length > 0 ? new Date(sorted[0].properties.time).toLocaleTimeString() : ""}</span>
            <span className="uppercase tracking-widest">Oldest → Newest</span>
            <span>{sorted.length > 0 ? new Date(sorted[sorted.length - 1].properties.time).toLocaleTimeString() : ""}</span>
          </div>
        </>
      )}
    </div>
  );
}
