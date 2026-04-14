import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Activity, Globe, AlertTriangle, Info, Clock } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { href: "/", label: "Dashboard", icon: Activity },
    { href: "/alerts", label: "Alert History", icon: AlertTriangle },
    { href: "/about", label: "System Info", icon: Info },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground font-mono selection:bg-primary/30">
      {/* Sidebar Navigation */}
      <nav className="w-64 border-r border-border bg-card/50 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 text-primary mb-2">
            <Globe className="w-8 h-8 animate-pulse-fast" />
            <h1 className="font-bold text-xl tracking-tight uppercase tracking-widest">SeisMon</h1>
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {currentTime.toISOString().split('T')[1].split('.')[0]} UTC
          </div>
        </div>

        <div className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="block">
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium text-sm uppercase tracking-wider">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-border">
          <div className="bg-white/5 p-4 rounded-md border border-white/5">
            <div className="text-xs text-muted-foreground mb-2 uppercase font-bold tracking-wider">System Status</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-mag-green animate-pulse-fast" />
              <span className="text-sm text-mag-green">ONLINE / ACTIVE</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-2">
              Connected to USGS Network
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden border-b border-border bg-card/80 p-4 flex items-center justify-between z-10 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-primary">
            <Globe className="w-6 h-6" />
            <h1 className="font-bold text-lg">SEISMON</h1>
          </div>
          <div className="flex gap-4 text-muted-foreground">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <item.icon className={`w-5 h-5 ${location === item.href ? 'text-primary' : ''}`} />
              </Link>
            ))}
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
