import React, { useState } from 'react';
import { Search, RotateCcw, Compass, History, X, Sparkles } from 'lucide-react';
import { SearchHistoryItem } from '../types';

interface SearchHeaderProps {
  onSearch: (query: string) => void;
  onResetMyIP: () => void;
  isLoading: boolean;
  searchHistory: SearchHistoryItem[];
  onClearHistory: () => void;
  currentQuery?: string;
}

const PRESETS = [
  { label: 'Google', query: 'google.com', desc: 'Domain Lookup' },
  { label: 'Cloudflare', query: '1.1.1.1', desc: 'Fast DNS' },
  { label: 'Google DNS', query: '8.8.8.8', desc: 'Global Anycast' },
  { label: 'My Domain', query: 'bdhyperashraf71.me', desc: 'Custom Domain' },
  { label: 'Cloudflare Edge', query: 'cloudflare.com', desc: 'Domain Lookup' },
  { label: 'Quad9', query: '9.9.9.9', desc: 'Secured Anycast' },
];

export function SearchHeader({
  onSearch,
  onResetMyIP,
  isLoading,
  searchHistory,
  onClearHistory,
  currentQuery,
}: SearchHeaderProps) {
  const [inputVal, setInputVal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    onSearch(inputVal.trim());
  };

  const handlePreset = (query: string) => {
    setInputVal(query);
    onSearch(query);
  };

  return (
    <div className="w-full space-y-3">
      {/* Search Input Bar */}
      <form onSubmit={handleSubmit} className="relative flex items-center w-full">
        <div className="relative flex-1 flex items-center">
          <div className="absolute left-4 text-slate-400 pointer-events-none flex items-center">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            id="ip-search-input"
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Search any IP address or domain (e.g., 1.1.1.1, 8.8.8.8, google.com)..."
            className="w-full pl-11 pr-24 py-3.5 bg-white hover:border-slate-300 text-slate-800 placeholder-slate-400 text-sm sm:text-base rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 shadow-sm outline-none transition-all font-mono"
          />
          {inputVal && (
            <button
              type="button"
              onClick={() => setInputVal('')}
              className="absolute right-28 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              title="Clear input"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="ml-2 flex items-center gap-2">
          <button
            id="search-submit-btn"
            type="submit"
            disabled={isLoading || !inputVal.trim()}
            className="px-4 sm:px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-white" />
            )}
            <span className="hidden sm:inline">Lookup</span>
          </button>

          {currentQuery && (
            <button
              id="reset-my-ip-btn"
              type="button"
              onClick={() => {
                setInputVal('');
                onResetMyIP();
              }}
              className="px-3 sm:px-4 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs sm:text-sm font-medium transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              title="Back to my live IP address"
            >
              <RotateCcw className="h-4 w-4 text-slate-500" />
              <span className="hidden md:inline">My IP</span>
            </button>
          )}
        </div>
      </form>

      {/* Preset Quick Chips */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
          <Compass className="h-3.5 w-3.5 text-blue-600" />
          Presets:
        </span>
        {PRESETS.map((preset) => (
          <button
            key={preset.query}
            id={`preset-btn-${preset.query.replace(/[:.]/g, '-')}`}
            onClick={() => handlePreset(preset.query)}
            className="text-xs px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 border border-slate-200 shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            title={`${preset.label} - ${preset.desc}`}
          >
            <span className="font-semibold text-slate-800">{preset.label}</span>
            <span className="text-[11px] font-mono text-slate-500">{preset.query}</span>
          </button>
        ))}
      </div>

      {/* Recent Searches */}
      {searchHistory.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 border-t border-slate-200 text-xs text-slate-500">
          <div className="flex items-center gap-1 text-slate-400">
            <History className="h-3.5 w-3.5 text-slate-400" />
            <span>Recent:</span>
          </div>
          {searchHistory.slice(0, 5).map((item, idx) => (
            <button
              key={`${item.ip}-${idx}`}
              onClick={() => handlePreset(item.query)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 border border-slate-200 shadow-xs cursor-pointer font-mono text-[11px]"
            >
              <span>{item.query}</span>
              {item.location && <span className="text-slate-400 text-[10px]">({item.location})</span>}
            </button>
          ))}
          <button
            id="clear-history-btn"
            onClick={onClearHistory}
            className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer ml-auto"
          >
            Clear history
          </button>
        </div>
      )}
    </div>
  );
}
