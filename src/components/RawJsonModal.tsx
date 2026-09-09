import { useState } from 'react';
import { X, Copy, Check, Download, FileJson } from 'lucide-react';
import { IPDetails, CloudflareTrace } from '../types';

interface RawJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  details: IPDetails;
  trace: CloudflareTrace | null;
}

export function RawJsonModal({ isOpen, onClose, details, trace }: RawJsonModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const payload = {
    ip_details: details,
    cloudflare_trace: trace,
    generated_by: 'IP Checker & Geolocation',
    exported_at: new Date().toISOString(),
  };

  const jsonString = JSON.stringify(payload, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ip-details-${details.ip}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="raw-json-modal"
        className="relative w-full max-w-3xl rounded-xl bg-white border border-slate-200 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <FileJson className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Raw IP & Network JSON</h3>
              <p className="text-xs text-slate-500">Complete API response for {details.ip}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="copy-raw-json-btn"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              title="Copy JSON to clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              id="download-json-btn"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              title="Download as JSON file"
            >
              <Download className="h-3.5 w-3.5 text-blue-600" />
              <span>Download</span>
            </button>

            <button
              id="close-raw-json-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-auto flex-1 font-mono text-xs text-slate-800 bg-slate-50 selection:bg-blue-100 border-y border-slate-200">
          <pre className="whitespace-pre-wrap">{jsonString}</pre>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-white text-right text-xs text-slate-500">
          Source: {details.source} • Parsed at {details.fetchedAt}
        </div>
      </div>
    </div>
  );
}
