import { useState } from 'react';
import { 
  Copy, 
  Check, 
  MapPin, 
  Network, 
  Clock, 
  Activity, 
  FileJson, 
  Shield, 
  Share2, 
  CheckCircle2, 
  AlertTriangle,
  Globe
} from 'lucide-react';
import { IPDetails, LatencyTestResult } from '../types';

interface MainIPCardProps {
  details: IPDetails;
  isMyIP: boolean;
  latencyResult: LatencyTestResult;
  onOpenRawJson: () => void;
  onRetestLatency: () => void;
}

export function MainIPCard({
  details,
  isMyIP,
  latencyResult,
  onOpenRawJson,
  onRetestLatency,
}: MainIPCardProps) {
  const [copiedIP, setCopiedIP] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const handleCopyIP = async () => {
    try {
      await navigator.clipboard.writeText(details.ip);
      setCopiedIP(true);
      setTimeout(() => setCopiedIP(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopySummary = async () => {
    const summary = `${details.queriedDomain ? `Queried Domain: ${details.queriedDomain}\n` : ''}IP Address: ${details.ip} (${details.type})
Location: ${details.city}, ${details.region}, ${details.country} (${details.countryCode})
Coordinates: ${details.latitude}, ${details.longitude}
ISP / Org: ${details.connection.isp || details.connection.org || 'Unknown'}
ASN: ${details.connection.asn || 'N/A'}
Timezone: ${details.timezone.id} (${details.timezone.utc || 'UTC'})
Source: ${details.source}`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      // fallback
    }
  };

  const hasSecurityThreat = details.security?.isProxy || details.security?.isVpn || details.security?.isTor;

  return (
    <div 
      id="main-ip-hero-card"
      className="relative overflow-hidden rounded-xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm"
    >
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isMyIP ? 'Your Public IP Address' : details.queriedDomain ? 'Domain Lookup' : 'Lookup IP Address'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {details.type}
            </span>
            {details.queriedDomain && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {details.queriedDomain}
              </span>
            )}
            {isMyIP && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Current Client
              </span>
            )}
            <span className="text-xs text-slate-400 font-mono">
              via {details.source}
            </span>
          </div>

          {/* Big IP or Domain address display */}
          {details.queriedDomain ? (
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <h1 
                  id="display-domain-name"
                  className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 font-mono tracking-tight break-all select-all"
                >
                  {details.queriedDomain}
                </h1>
                <button
                  id="copy-domain-btn"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(details.queriedDomain || '');
                      setCopiedIP(true);
                      setTimeout(() => setCopiedIP(false), 2000);
                    } catch {}
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    copiedIP
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                  title="Copy domain name"
                >
                  {copiedIP ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Primary Resolved IP:</span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-mono text-sm font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                  {details.ip}
                </span>
                <button
                  id="copy-primary-ip-btn"
                  onClick={handleCopyIP}
                  className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Copy resolved IP"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <h1 
                id="display-ip-address"
                className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-800 font-mono tracking-tight break-all select-all"
              >
                {details.ip}
              </h1>
              <button
                id="copy-ip-btn"
                onClick={handleCopyIP}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  copiedIP
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
                title="Copy IP address to clipboard"
              >
                {copiedIP ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          )}

          {/* Hostname or Domain resolution info */}
          {details.queriedDomain && details.resolvedIPs && details.resolvedIPs.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-slate-600 font-mono">
              <span className="text-slate-400 font-sans font-medium">All A-Records ({details.resolvedIPs.length}):</span>
              {details.resolvedIPs.map((ip) => (
                <span
                  key={ip}
                  className={`px-2 py-0.5 rounded-md text-[11px] border ${
                    ip === details.ip
                      ? 'bg-blue-100/70 border-blue-300 text-blue-800 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  {ip}
                </span>
              ))}
            </div>
          )}

          {details.hostname && !details.queriedDomain && (
            <p className="text-sm font-mono text-slate-500 truncate max-w-xl">
              Host: {details.hostname}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          <button
            id="copy-summary-btn"
            onClick={handleCopySummary}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all cursor-pointer active:scale-95 shadow-xs hover:border-slate-300"
            title="Copy formatted text summary"
          >
            {copiedSummary ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Share2 className="h-4 w-4 text-blue-600" />
            )}
            <span>{copiedSummary ? 'Summary Copied!' : 'Copy Summary'}</span>
          </button>

          <button
            id="open-raw-json-btn"
            onClick={onOpenRawJson}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all cursor-pointer active:scale-95 shadow-xs hover:border-slate-300 font-mono"
            title="Inspect raw JSON API payload"
          >
            <FileJson className="h-4 w-4 text-slate-500" />
            <span>Raw JSON</span>
          </button>
        </div>
      </div>

      {/* Quick Status Sub-grid */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Location snippet */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex items-start gap-3.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Location</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl shrink-0" role="img" aria-label={details.country}>
                {details.countryFlag || '🌐'}
              </span>
              <p className="text-sm font-semibold text-slate-800 truncate">
                {details.city}, {details.countryCode || details.country}
              </p>
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {details.region} {details.postal ? `• ${details.postal}` : ''}
            </p>
          </div>
        </div>

        {/* Network & ISP snippet */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex items-start gap-3.5">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
            <Network className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ISP / Network</span>
            <p className="text-sm font-semibold text-slate-800 truncate mt-0.5" title={details.connection.isp || details.connection.org || 'Standard Network'}>
              {details.connection.isp || details.connection.org || 'Standard Network'}
            </p>
            <p className="text-xs font-mono text-slate-500 truncate mt-0.5">
              {details.connection.asn ? `AS${details.connection.asn}` : 'ASN Unknown'}
            </p>
          </div>
        </div>

        {/* Timezone snippet */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex items-start gap-3.5">
          <div className="p-2 rounded-lg bg-purple-50 text-purple-600 shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Local Timezone</span>
            <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
              {details.timezone.id}
            </p>
            <p className="text-xs font-mono text-slate-500 truncate mt-0.5">
              {details.timezone.currentTime ? details.timezone.currentTime : `UTC ${details.timezone.utc || '+00:00'}`}
            </p>
          </div>
        </div>

        {/* Latency / Security snippet */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex items-start gap-3.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <Activity className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Edge Latency</span>
              <button 
                onClick={onRetestLatency}
                className="text-[11px] text-blue-600 hover:underline cursor-pointer font-medium"
                title="Retest ping latency"
              >
                Retest
              </button>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {latencyResult.cloudflareLatency !== null ? (
                <span className="text-sm font-bold text-emerald-600 font-mono">
                  {latencyResult.cloudflareLatency} ms
                </span>
              ) : latencyResult.status === 'testing' ? (
                <span className="text-xs text-amber-600 animate-pulse font-mono">Testing...</span>
              ) : (
                <span className="text-xs text-slate-500 font-mono">Check below</span>
              )}
              <span className="text-[11px] text-slate-500">Cloudflare Edge</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {hasSecurityThreat ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-medium">
                  <AlertTriangle className="h-3 w-3 text-amber-600" /> VPN/Proxy detected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Direct connection
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
