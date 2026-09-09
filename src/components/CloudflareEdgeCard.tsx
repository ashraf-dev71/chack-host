import { useState } from 'react';
import { 
  Cloud, 
  Zap, 
  Activity, 
  Server, 
  Lock, 
  Shield, 
  RefreshCw, 
  CheckCircle2, 
  ArrowUpRight 
} from 'lucide-react';
import { CloudflareTrace, LatencyTestResult } from '../types';

interface CloudflareEdgeCardProps {
  trace: CloudflareTrace | null;
  latency: LatencyTestResult;
  onRetest: () => void;
  isRetesting: boolean;
}

export function CloudflareEdgeCard({
  trace,
  latency,
  onRetest,
  isRetesting,
}: CloudflareEdgeCardProps) {
  const cfLatency = latency.cloudflareLatency;
  const googleLatency = latency.googleLatency;

  const getLatencyQuality = (ms: number | null) => {
    if (ms === null) return { label: 'Unknown', color: 'text-slate-500', bg: 'bg-slate-100 border-slate-200' };
    if (ms < 35) return { label: 'Ultra Fast', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
    if (ms < 85) return { label: 'Good', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' };
    if (ms < 160) return { label: 'Moderate', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' };
    return { label: 'High Latency', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' };
  };

  const cfQuality = getLatencyQuality(cfLatency);
  const googleQuality = getLatencyQuality(googleLatency);

  return (
    <div id="cloudflare-edge-card" className="rounded-xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
            <Cloud className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-800">Cloudflare Edge & Latency</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                CDN-CGI Trace
              </span>
            </div>
            <p className="text-xs text-slate-500">Direct edge server diagnostics, TLS negotiation, and live ping</p>
          </div>
        </div>

        <button
          id="retest-latency-btn"
          onClick={onRetest}
          disabled={isRetesting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 border border-slate-200 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          title="Retest ping to edge nodes"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-blue-600 ${isRetesting ? 'animate-spin' : ''}`} />
          <span>{isRetesting ? 'Testing...' : 'Retest Ping'}</span>
        </button>
      </div>

      {/* Latency Gauges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        {/* Cloudflare 1.1.1.1 Ping */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-500"></span>
              <span className="text-xs font-semibold text-slate-700">Cloudflare Edge (1.1.1.1)</span>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfQuality.bg} ${cfQuality.color}`}>
              {cfQuality.label}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-800">
              {cfLatency !== null ? cfLatency : '—'}
            </span>
            <span className="text-sm font-semibold text-slate-400 font-mono">ms</span>
          </div>

          {/* Progress bar visual */}
          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                cfLatency === null
                  ? 'w-0'
                  : cfLatency < 35
                  ? 'bg-emerald-500 w-1/4'
                  : cfLatency < 85
                  ? 'bg-blue-600 w-1/2'
                  : cfLatency < 160
                  ? 'bg-amber-500 w-3/4'
                  : 'bg-rose-500 w-full'
              }`}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Round-trip delay to closest Cloudflare anycast node
          </p>
        </div>

        {/* Google DNS 8.8.8.8 Ping */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              <span className="text-xs font-semibold text-slate-700">Google Public DNS (8.8.8.8)</span>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${googleQuality.bg} ${googleQuality.color}`}>
              {googleQuality.label}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-800">
              {googleLatency !== null ? googleLatency : '—'}
            </span>
            <span className="text-sm font-semibold text-slate-400 font-mono">ms</span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                googleLatency === null
                  ? 'w-0'
                  : googleLatency < 35
                  ? 'bg-emerald-500 w-1/4'
                  : googleLatency < 85
                  ? 'bg-blue-600 w-1/2'
                  : googleLatency < 160
                  ? 'bg-amber-500 w-3/4'
                  : 'bg-rose-500 w-full'
              }`}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Round-trip delay to Google global DNS infrastructure
          </p>
        </div>
      </div>

      {/* Cloudflare Trace Parameters */}
      {trace && (
        <div className="mt-5 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Server className="h-3.5 w-3.5 text-orange-500" />
            Edge Trace Metadata
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Datacenter Colo */}
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Datacenter (Colo)</span>
              <span className="text-sm font-bold font-mono text-slate-800 block mt-0.5">
                {trace.colo || 'Global'}
              </span>
              <span className="text-[10px] text-slate-500 truncate block mt-0.5" title={trace.coloCity}>
                {trace.coloCity || 'Anycast Node'}
              </span>
            </div>

            {/* HTTP Protocol */}
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Protocol</span>
              <span className="text-sm font-bold font-mono text-emerald-600 block mt-0.5">
                {trace.http || 'HTTP/2'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {trace.visit_scheme?.toUpperCase() || 'HTTPS'}
              </span>
            </div>

            {/* TLS Version */}
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">TLS Cipher</span>
              <span className="text-sm font-bold font-mono text-indigo-600 block mt-0.5">
                {trace.tls || 'TLSv1.3'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Encrypted Stream
              </span>
            </div>

            {/* SNI */}
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">SNI Status</span>
              <span className="text-sm font-bold font-mono text-slate-800 block mt-0.5">
                {trace.sni || 'Standard'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Server Name Ind.
              </span>
            </div>

            {/* Cloudflare WARP */}
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">WARP Tunnel</span>
              <span className={`text-sm font-bold font-mono block mt-0.5 ${trace.warp === 'on' ? 'text-blue-600' : 'text-slate-500'}`}>
                {trace.warp === 'on' ? 'Active (ON)' : 'Disabled'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Zero Trust Client
              </span>
            </div>

            {/* Edge Location */}
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Edge Region</span>
              <span className="text-sm font-bold font-mono text-slate-800 block mt-0.5">
                {trace.loc || 'Global'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Country Geo
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
