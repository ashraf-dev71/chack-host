import { Globe2, RefreshCw, Activity, ShieldCheck, Zap } from 'lucide-react';

interface NavbarProps {
  currentIP?: string;
  isDetecting: boolean;
  onRefresh: () => void;
  latency?: number | null;
}

export function Navbar({ currentIP, isDetecting, onRefresh, latency }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand logo */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm text-white">
            <Globe2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-lg tracking-tight">IP<span className="text-blue-600">Checker</span></span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Geolocation & Network Inspector</p>
          </div>
        </div>

        {/* Quick status badges & actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {latency !== null && latency !== undefined && (
            <div 
              id="header-latency-badge"
              className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono shadow-xs"
              title="Cloudflare Edge latency"
            >
              <Zap className="h-3.5 w-3.5 text-blue-600" />
              <span>{latency} ms</span>
            </div>
          )}

          {currentIP && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-slate-500">Current:</span>
              <span className="text-slate-900 font-semibold">{currentIP}</span>
            </div>
          )}

          <button
            id="nav-refresh-btn"
            onClick={onRefresh}
            disabled={isDetecting}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-white hover:bg-slate-50 active:scale-95 text-slate-700 border border-slate-200 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-xs hover:border-slate-300"
            title="Refresh current IP and network status"
          >
            <RefreshCw className={`h-4 w-4 text-blue-600 ${isDetecting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline font-medium">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
}
