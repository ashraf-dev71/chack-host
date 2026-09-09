import { useState } from 'react';
import { 
  Globe2, 
  Server, 
  Mail, 
  ShieldCheck, 
  Copy, 
  Check, 
  ExternalLink,
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';
import { DomainDNSData } from '../types';

interface DomainDNSCardProps {
  dnsData: DomainDNSData;
  primaryIP: string;
  onSelectIP?: (ip: string) => void;
}

type RecordTab = 'all' | 'A' | 'AAAA' | 'MX' | 'NS' | 'TXT' | 'CNAME';

export function DomainDNSCard({
  dnsData,
  primaryIP,
  onSelectIP,
}: DomainDNSCardProps) {
  const [activeTab, setActiveTab] = useState<RecordTab>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedZone, setCopiedZone] = useState(false);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyZoneFile = async () => {
    const lines: string[] = [
      `; DNS Records for ${dnsData.domain}`,
      `; Exported on ${new Date().toUTCString()}`,
      '',
    ];

    dnsData.a.forEach((ip) => lines.push(`${dnsData.domain}.\tIN\tA\t${ip}`));
    dnsData.aaaa.forEach((ip) => lines.push(`${dnsData.domain}.\tIN\tAAAA\t${ip}`));
    dnsData.cname.forEach((alias) => lines.push(`${dnsData.domain}.\tIN\tCNAME\t${alias}`));
    dnsData.mx.forEach((m) => lines.push(`${dnsData.domain}.\tIN\tMX\t${m.priority || 10}\t${m.host}`));
    dnsData.ns.forEach((ns) => lines.push(`${dnsData.domain}.\tIN\tNS\t${ns}`));
    dnsData.txt.forEach((txt) => lines.push(`${dnsData.domain}.\tIN\tTXT\t"${txt}"`));

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedZone(true);
      setTimeout(() => setCopiedZone(false), 2000);
    } catch {
      // fallback
    }
  };

  const totalRecords = 
    dnsData.a.length + 
    dnsData.aaaa.length + 
    dnsData.mx.length + 
    dnsData.ns.length + 
    dnsData.txt.length + 
    dnsData.cname.length;

  const tabs: { id: RecordTab; label: string; count: number }[] = [
    { id: 'all', label: 'All Records', count: totalRecords },
    { id: 'A', label: 'A (IPv4)', count: dnsData.a.length },
    { id: 'AAAA', label: 'AAAA (IPv6)', count: dnsData.aaaa.length },
    { id: 'MX', label: 'MX (Mail)', count: dnsData.mx.length },
    { id: 'NS', label: 'NS (Nameservers)', count: dnsData.ns.length },
    { id: 'TXT', label: 'TXT', count: dnsData.txt.length },
    { id: 'CNAME', label: 'CNAME', count: dnsData.cname.length },
  ];

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(dnsData.domain)}&sz=64`;

  return (
    <div 
      id="domain-dns-card"
      className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md"
    >
      {/* Top Header */}
      <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <img 
              src={faviconUrl} 
              alt={dnsData.domain}
              className="h-10 w-10 rounded-xl p-1.5 bg-white border border-slate-200 shadow-xs object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-mono tracking-tight">
                {dnsData.domain}
              </h2>
              {dnsData.httpStatus?.online && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Online
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <Server className="h-3.5 w-3.5 text-blue-600" />
                Primary IP: <b className="font-mono text-slate-800">{primaryIP}</b>
              </span>
              {dnsData.httpStatus && (
                <span className="flex items-center gap-1">
                  <Activity className="h-3.5 w-3.5 text-emerald-600" />
                  {dnsData.httpStatus.protocol} Latency: <b className="font-mono text-emerald-700">{dnsData.httpStatus.latencyMs}ms</b>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            id="copy-zone-file-btn"
            onClick={handleCopyZoneFile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 shadow-xs transition-colors cursor-pointer"
            title="Copy formatted DNS records"
          >
            {copiedZone ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
            <span>{copiedZone ? 'Zone Copied!' : 'Copy DNS Zone'}</span>
          </button>

          <a
            href={`https://${dnsData.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs transition-colors"
          >
            <span>Visit Site</span>
            <ExternalLink className="h-3.5 w-3.5 text-white/80" />
          </a>
        </div>
      </div>

      {/* Record filter tabs */}
      <div className="px-5 pt-3 border-b border-slate-100 bg-white flex items-center gap-1 overflow-x-auto no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === t.id
                ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>{t.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === t.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Records table/grid */}
      <div className="p-5 sm:p-6 space-y-4">
        {totalRecords === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No DNS records could be discovered for {dnsData.domain}.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {/* A Records */}
            {(activeTab === 'all' || activeTab === 'A') && dnsData.a.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-mono">A</span>
                  IPv4 Addresses ({dnsData.a.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {dnsData.a.map((ip, idx) => (
                    <div 
                      key={ip}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 flex items-center justify-between gap-2 transition-colors"
                    >
                      <div className="flex items-center gap-2 font-mono text-sm font-semibold text-slate-800">
                        <span>{ip}</span>
                        {ip === primaryIP && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-sans font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(ip, `a-${idx}`)}
                          className="p-1.5 rounded-lg hover:bg-white text-slate-500 hover:text-slate-800 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                          title="Copy IP"
                        >
                          {copiedKey === `a-${idx}` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        {onSelectIP && ip !== primaryIP && (
                          <button
                            onClick={() => onSelectIP(ip)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 border border-transparent hover:border-blue-200 transition-all cursor-pointer"
                            title="Inspect this IP"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AAAA Records */}
            {(activeTab === 'all' || activeTab === 'AAAA') && dnsData.aaaa.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-mono">AAAA</span>
                  IPv6 Addresses ({dnsData.aaaa.length})
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {dnsData.aaaa.map((ip, idx) => (
                    <div 
                      key={ip}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 flex items-center justify-between gap-2 font-mono text-xs text-slate-800 break-all"
                    >
                      <span>{ip}</span>
                      <button
                        onClick={() => handleCopy(ip, `aaaa-${idx}`)}
                        className="p-1.5 rounded-lg hover:bg-white text-slate-500 hover:text-slate-800 border border-transparent hover:border-slate-200 transition-all cursor-pointer shrink-0"
                        title="Copy IPv6"
                      >
                        {copiedKey === `aaaa-${idx}` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MX Records */}
            {(activeTab === 'all' || activeTab === 'MX') && dnsData.mx.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-mono">MX</span>
                  Mail Exchange Servers ({dnsData.mx.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {dnsData.mx.map((m, idx) => (
                    <div 
                      key={`${m.host}-${idx}`}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <div>
                          <span className="font-mono text-xs font-semibold text-slate-800 block truncate">
                            {m.host}
                          </span>
                          {m.priority !== undefined && (
                            <span className="text-[10px] text-slate-500">
                              Priority: <b className="text-amber-700">{m.priority}</b>
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopy(m.host, `mx-${idx}`)}
                        className="p-1.5 rounded-lg hover:bg-white text-slate-500 hover:text-slate-800 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                        title="Copy Mail Server"
                      >
                        {copiedKey === `mx-${idx}` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NS Records */}
            {(activeTab === 'all' || activeTab === 'NS') && dnsData.ns.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono">NS</span>
                  Authoritative Nameservers ({dnsData.ns.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {dnsData.ns.map((ns, idx) => (
                    <div 
                      key={`${ns}-${idx}`}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 font-mono text-xs font-semibold text-slate-800">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{ns}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(ns, `ns-${idx}`)}
                        className="p-1.5 rounded-lg hover:bg-white text-slate-500 hover:text-slate-800 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                        title="Copy Nameserver"
                      >
                        {copiedKey === `ns-${idx}` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TXT Records */}
            {(activeTab === 'all' || activeTab === 'TXT') && dnsData.txt.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-mono">TXT</span>
                  TXT Records / Verification ({dnsData.txt.length})
                </span>
                <div className="space-y-2">
                  {dnsData.txt.map((txt, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 flex items-start justify-between gap-3 text-xs font-mono text-slate-700 break-all"
                    >
                      <span>"{txt}"</span>
                      <button
                        onClick={() => handleCopy(txt, `txt-${idx}`)}
                        className="p-1.5 rounded-lg hover:bg-white text-slate-500 hover:text-slate-800 border border-transparent hover:border-slate-200 transition-all cursor-pointer shrink-0 mt-0.5"
                        title="Copy TXT record"
                      >
                        {copiedKey === `txt-${idx}` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CNAME Records */}
            {(activeTab === 'all' || activeTab === 'CNAME') && dnsData.cname.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-mono">CNAME</span>
                  Canonical Aliases ({dnsData.cname.length})
                </span>
                <div className="space-y-2">
                  {dnsData.cname.map((alias, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 flex items-center justify-between gap-3 text-xs font-mono text-slate-700"
                    >
                      <span>{alias}</span>
                      <button
                        onClick={() => handleCopy(alias, `cname-${idx}`)}
                        className="p-1.5 rounded-lg hover:bg-white text-slate-500 hover:text-slate-800 border border-transparent hover:border-slate-200 transition-all cursor-pointer shrink-0"
                        title="Copy alias"
                      >
                        {copiedKey === `cname-${idx}` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
