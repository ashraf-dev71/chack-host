import { 
  Network, 
  Server, 
  ShieldCheck, 
  ShieldAlert, 
  Globe, 
  ExternalLink, 
  Cpu, 
  Radio 
} from 'lucide-react';
import { IPDetails } from '../types';

interface NetworkDetailsProps {
  details: IPDetails;
}

export function NetworkDetails({ details }: NetworkDetailsProps) {
  const security = details.security || {};
  const isSuspicious = security.isProxy || security.isVpn || security.isTor || security.isHosting;

  const securityBadges = [
    { label: 'VPN Detected', active: security.isVpn },
    { label: 'Proxy Detected', active: security.isProxy },
    { label: 'Tor Exit Node', active: security.isTor },
    { label: 'Datacenter / Hosting', active: security.isHosting },
  ];

  return (
    <div id="network-details-section" className="rounded-xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <Network className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Network & Autonomous System (ASN)</h2>
            <p className="text-xs text-slate-500">Carrier routing, ISP infrastructure, and connection analysis</p>
          </div>
        </div>

        {/* ASN Radb/BGP Link if ASN is known */}
        {details.connection.asn && (
          <a
            href={`https://bgp.he.net/AS${details.connection.asn}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-mono text-blue-600 border border-slate-200 transition-colors"
            title="View BGP Routing & Peering Details on Hurricane Electric"
          >
            <span>BGP Info</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
        {/* ISP Card */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
              <Radio className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">ISP Provider</span>
          </div>
          <p className="text-sm font-semibold text-slate-800">
            {details.connection.isp || 'Standard Internet Service Provider'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {details.connection.domain ? `Domain: ${details.connection.domain}` : 'Direct consumer or business tier'}
          </p>
        </div>

        {/* Organization Card */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
              <Server className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Organization</span>
          </div>
          <p className="text-sm font-semibold text-slate-800">
            {details.connection.org || details.connection.isp || 'Identified Network Owner'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Autonomous System entity
          </p>
        </div>

        {/* ASN Card */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-cyan-50 text-cyan-600">
              <Cpu className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">ASN Routing</span>
          </div>
          <p className="text-sm font-bold text-blue-600 font-mono">
            {details.connection.asn ? `AS${details.connection.asn}` : 'Unallocated / Private ASN'}
          </p>
          <p className="text-xs text-slate-500 mt-1 truncate">
            {details.connection.org || 'BGP Anycast Routing'}
          </p>
        </div>
      </div>

      {/* Security & Privacy Diagnostics Row */}
      <div className="mt-5 p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${isSuspicious ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {isSuspicious ? <ShieldAlert className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Security & Privacy Classification</h4>
            <p className="text-xs text-slate-500">
              {isSuspicious
                ? 'Traffic shows signs of proxy, hosting facility, or privacy tunnel.'
                : 'Connection appears to be a residential or direct ISP broadcast address.'}
            </p>
          </div>
        </div>

        {/* Security badges */}
        <div className="flex flex-wrap items-center gap-2">
          {securityBadges.map((badge, idx) => (
            <span
              key={idx}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                badge.active
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-white text-slate-600 border-slate-200 shadow-xs'
              }`}
            >
              {badge.label}: {badge.active ? 'YES' : 'NO'}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
