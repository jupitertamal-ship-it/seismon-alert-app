import React from "react";
import { Layout } from "@/components/layout";
import { useEarthquakes, EarthquakeFeature, getMagColorClass } from "@/hooks/use-earthquakes";
import { AlertTriangle, Search, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AlertsPage() {
  const { data, isLoading } = useEarthquakes("week"); // Fetch more data for alert history
  
  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center p-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }
  
  const earthquakes = data?.features || [];
  // Only show significant earthquakes (mag >= 4.0)
  const alerts = earthquakes.filter(eq => eq.properties.mag >= 4.0).sort((a, b) => b.properties.time - a.properties.time);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border pb-6">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-foreground flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-mag-orange" /> Alert History
            </h2>
            <p className="text-muted-foreground text-sm uppercase tracking-widest mt-1">
              Significant events (M4.0+) past 7 days
            </p>
          </div>
          <div className="text-sm text-muted-foreground bg-white/5 px-3 py-1.5 rounded border border-white/5 font-mono">
            {alerts.length} Records Found
          </div>
        </div>

        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground bg-card border border-border rounded-lg border-dashed">
              No significant alerts in the selected timeframe.
            </div>
          ) : (
            alerts.map(alert => (
              <AlertCard key={alert.id} eq={alert} />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}

function AlertCard({ eq }: { eq: EarthquakeFeature }) {
  const colorClass = getMagColorClass(eq.properties.mag);
  const date = new Date(eq.properties.time);
  
  return (
    <div className={`bg-card border ${colorClass.includes('red') ? 'border-mag-red/30' : 'border-border'} rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row gap-6 relative overflow-hidden`}>
      {colorClass.includes('red') && (
        <div className="absolute top-0 left-0 w-1 h-full bg-mag-red" />
      )}
      
      <div className="shrink-0 flex items-center justify-center">
        <div className={`w-20 h-20 rounded-lg flex flex-col items-center justify-center ${colorClass} border`}>
          <span className="text-2xl font-bold">{eq.properties.mag.toFixed(1)}</span>
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 mt-1">Mag</span>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center">
        <h3 className="text-lg font-bold text-foreground mb-1">{eq.properties.place}</h3>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground font-mono mt-2">
          <span>{date.toLocaleDateString()} {date.toLocaleTimeString()}</span>
          <span>•</span>
          <span>{formatDistanceToNow(eq.properties.time, { addSuffix: true })}</span>
          <span>•</span>
          <span>Depth: {eq.geometry.coordinates[2].toFixed(1)}km</span>
        </div>
      </div>
      
      <div className="shrink-0 flex items-center sm:items-start pt-2">
        <a 
          href={eq.properties.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-foreground border border-white/10 rounded text-xs uppercase font-bold tracking-wider transition-colors"
        >
          Details
        </a>
      </div>
    </div>
  );
}
