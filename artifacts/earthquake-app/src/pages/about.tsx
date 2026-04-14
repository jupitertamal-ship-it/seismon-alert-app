import React from "react";
import { Layout } from "@/components/layout";
import { Info, Shield, Radio, Server } from "lucide-react";

export default function AboutPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="border-b border-border pb-6">
          <h2 className="text-2xl font-bold uppercase tracking-tight text-foreground flex items-center gap-3">
            <Info className="w-6 h-6 text-primary" /> System Information
          </h2>
        </div>

        <div className="prose prose-invert max-w-none font-mono text-sm space-y-8">
          <section className="bg-card border border-border p-6 rounded-lg">
            <h3 className="text-lg text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
              <Server className="w-5 h-5" /> Architecture
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              SeisMon is a near real-time telemetry dashboard designed to provide rapid awareness of global seismic events. 
              The application interfaces directly with the United States Geological Survey (USGS) Earthquake Hazards Program API, 
              pulling GeoJSON feeds at a 60-second polling interval. No intermediary database is used, ensuring data freshness 
              and reducing point-of-failure risk.
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border p-6 rounded-lg">
              <h3 className="text-lg text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                <Radio className="w-5 h-5" /> Data Feed
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>Source</span>
                  <span className="text-foreground">USGS API</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>Protocol</span>
                  <span className="text-foreground">HTTPS / GeoJSON</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>Refresh Rate</span>
                  <span className="text-foreground">60 Seconds</span>
                </li>
                <li className="flex justify-between pt-2">
                  <span>Coverage</span>
                  <span className="text-foreground">Global</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-card border border-border p-6 rounded-lg">
              <h3 className="text-lg text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" /> Alert Thresholds
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-mag-green" />
                  <span className="text-foreground">Low (&lt; 2.0)</span>
                  <span className="text-muted-foreground text-xs ml-auto">Micro</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-mag-yellow" />
                  <span className="text-foreground">Minor (2.0 - 3.9)</span>
                  <span className="text-muted-foreground text-xs ml-auto">Felt</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-mag-orange" />
                  <span className="text-foreground">Moderate (4.0 - 5.9)</span>
                  <span className="text-muted-foreground text-xs ml-auto">Damage Possible</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-mag-red shadow-[0_0_8px_currentColor]" />
                  <span className="text-foreground font-bold">Strong (6.0+)</span>
                  <span className="text-mag-red text-xs ml-auto uppercase font-bold tracking-wider">Critical</span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white/5 border border-white/10 p-6 rounded-lg">
            <h3 className="text-lg text-foreground uppercase tracking-widest mb-2">Disclaimer</h3>
            <p className="text-muted-foreground text-xs uppercase leading-relaxed">
              This dashboard is for informational purposes only. Do not rely on this application for life safety decisions. 
              In the event of an earthquake, follow instructions from local emergency management authorities. Data is provided 
              "as is" from the USGS and may be subject to revision as seismologists review the events.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
