import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, ChevronRight, Activity, MapPin, Waves, ExternalLink, RefreshCw } from "lucide-react";
import { EarthquakeFeature, getMagColorClass, getMagDotColorClass } from "@/hooks/use-earthquakes";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface EarthquakeListProps {
  earthquakes: EarthquakeFeature[];
  isRefetching?: boolean;
}

export function EarthquakeList({ earthquakes, isRefetching }: EarthquakeListProps) {
  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between bg-white/5">
        <h2 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Seismic Feed
        </h2>
        {isRefetching && <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />}
      </div>
      <div className="flex-1 overflow-y-auto">
        {earthquakes.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No seismic activity detected.</div>
        ) : (
          <div className="divide-y divide-border">
            {earthquakes.map((eq) => (
              <EarthquakeListItem key={eq.id} eq={eq} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EarthquakeListItem({ eq }: { eq: EarthquakeFeature }) {
  const isRecent = Date.now() - eq.properties.time < 1000 * 60 * 15; // 15 mins
  const isSignificant = eq.properties.mag >= 4.0;
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button 
          className="w-full text-left p-4 hover:bg-white/5 transition-colors flex items-start gap-4 group relative"
          data-testid={`eq-list-item-${eq.id}`}
        >
          {isRecent && (
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/50" />
          )}
          
          <div className="shrink-0 flex flex-col items-center justify-center">
            <div className={`w-12 h-12 rounded-full border flex items-center justify-center font-bold text-lg ${getMagColorClass(eq.properties.mag)} relative`}>
              {eq.properties.mag.toFixed(1)}
              {isSignificant && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                </span>
              )}
            </div>
          </div>
          
          <div className="flex-1 min-w-0 py-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-sm truncate text-foreground group-hover:text-primary transition-colors">
                {eq.properties.place}
              </p>
              {eq.properties.tsunami === 1 && (
                <Badge variant="destructive" className="h-5 px-1.5 text-[10px] uppercase shrink-0 rounded-sm">
                  <Waves className="w-3 h-3 mr-1" /> Tsunami
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ClockIcon /> {formatDistanceToNow(eq.properties.time, { addSuffix: true })}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {eq.geometry.coordinates[2].toFixed(1)}km depth
              </span>
            </div>
          </div>
          
          <div className="shrink-0 py-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-5 h-5" />
          </div>
        </button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md bg-card border-border font-mono text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 uppercase tracking-widest text-sm text-muted-foreground border-b border-border pb-4 mb-4">
            <Activity className="w-4 h-4 text-primary" />
            Seismic Event Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className={`w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center ${getMagColorClass(eq.properties.mag)}`}>
              <span className="text-3xl font-bold">{eq.properties.mag.toFixed(1)}</span>
              <span className="text-[10px] uppercase opacity-80">Magnitude</span>
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">{eq.properties.place}</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Time: {new Date(eq.properties.time).toLocaleString()}</p>
                <p>Coordinates: {eq.geometry.coordinates[1].toFixed(4)}°N, {eq.geometry.coordinates[0].toFixed(4)}°E</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-md border border-white/5">
              <div className="text-xs text-muted-foreground uppercase mb-1">Depth</div>
              <div className="text-lg font-medium">{eq.geometry.coordinates[2].toFixed(1)} km</div>
            </div>
            <div className="bg-white/5 p-4 rounded-md border border-white/5">
              <div className="text-xs text-muted-foreground uppercase mb-1">Significance</div>
              <div className="text-lg font-medium">{eq.properties.sig} / 1000</div>
            </div>
            <div className="bg-white/5 p-4 rounded-md border border-white/5">
              <div className="text-xs text-muted-foreground uppercase mb-1">Felt Reports</div>
              <div className="text-lg font-medium">{eq.properties.felt ?? 0}</div>
            </div>
            <div className="bg-white/5 p-4 rounded-md border border-white/5">
              <div className="text-xs text-muted-foreground uppercase mb-1">Alert Level</div>
              <div className="text-lg font-medium capitalize flex items-center gap-2">
                {eq.properties.alert ? (
                  <>
                    <div className={`w-3 h-3 rounded-full bg-mag-${eq.properties.alert}`} />
                    {eq.properties.alert}
                  </>
                ) : 'None'}
              </div>
            </div>
          </div>
          
          {eq.properties.tsunami === 1 && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-md flex items-start gap-3">
              <Waves className="w-5 h-5 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm uppercase">Tsunami Warning Evaluated</h4>
                <p className="text-xs mt-1 opacity-80">A tsunami warning was evaluated for this event. Check official channels for current status.</p>
              </div>
            </div>
          )}
          
          <a 
            href={eq.properties.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-md transition-colors text-sm uppercase font-bold tracking-wider"
          >
            <ExternalLink className="w-4 h-4" />
            View USGS Report
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
