import React from "react";
import { EarthquakeFeature, getMagDotColorClass } from "@/hooks/use-earthquakes";

interface WorldMapProps {
  earthquakes: EarthquakeFeature[];
}

export function WorldMap({ earthquakes }: WorldMapProps) {
  // A very simplified SVG world map paths
  return (
    <div className="relative w-full aspect-[2/1] bg-white/5 rounded-lg border border-border overflow-hidden group">
      <svg 
        viewBox="0 0 360 180" 
        className="w-full h-full text-white/10 fill-current opacity-50"
        preserveAspectRatio="xMidYMid slice"
      >
        <path d="M120 40 L130 30 L160 30 L180 50 L160 80 L140 80 L120 60 Z M190 20 L230 20 L250 50 L230 80 L200 80 L180 60 Z M60 50 L90 50 L100 80 L80 120 L70 140 L50 140 L40 100 L50 80 Z M280 110 L320 110 L330 140 L300 160 L280 150 Z M180 100 L210 100 L230 130 L200 160 L190 140 Z M130 90 L160 90 L160 120 L140 130 Z" />
        {/* Adds grid lines for a radar feel */}
        <g stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" fill="none">
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`v-${i}`} x1={i * 30} y1="0" x2={i * 30} y2="180" />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={`h-${i}`} x1="0" y1={i * 30} x2="360" y2={i * 30} />
          ))}
        </g>
      </svg>

      <div className="absolute inset-0">
        {earthquakes.map((eq) => {
          // Convert lon/lat to relative percentages for positioning
          // Lon: -180 to 180 -> 0 to 100%
          // Lat: -90 to 90 -> 100% to 0%
          const [lon, lat] = eq.geometry.coordinates;
          const x = ((lon + 180) / 360) * 100;
          const y = ((90 - lat) / 180) * 100;
          
          const isSignificant = eq.properties.mag >= 4.0;
          const isRecent = Date.now() - eq.properties.time < 1000 * 60 * 60; // 1 hr
          
          const size = Math.max(3, Math.min(10, eq.properties.mag * 1.5));
          
          return (
            <div
              key={eq.id}
              className={`absolute rounded-full -translate-x-1/2 -translate-y-1/2 ${getMagDotColorClass(eq.properties.mag)} ${isRecent ? 'animate-pulse' : 'opacity-80'} hover:scale-150 transition-transform cursor-crosshair`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: `${size}px`,
                height: `${size}px`,
                boxShadow: isSignificant ? '0 0 10px currentColor' : 'none'
              }}
              title={`${eq.properties.place} (M${eq.properties.mag})`}
            >
              {isSignificant && isRecent && (
                <div className="absolute inset-0 rounded-full bg-inherit animate-ping opacity-75" style={{ animationDuration: '2s' }} />
              )}
            </div>
          );
        })}
      </div>
      
      <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground uppercase font-bold tracking-widest bg-background/80 px-2 py-1 rounded backdrop-blur-sm border border-border">
        Global Seismic Map
      </div>
    </div>
  );
}
