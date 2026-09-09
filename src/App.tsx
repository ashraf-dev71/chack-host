import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { SearchHeader } from './components/SearchHeader';
import { MainIPCard } from './components/MainIPCard';
import { DomainDNSCard } from './components/DomainDNSCard';
import { InteractiveMap } from './components/InteractiveMap';
import { GeolocationDetails } from './components/GeolocationDetails';
import { NetworkDetails } from './components/NetworkDetails';
import { CloudflareEdgeCard } from './components/CloudflareEdgeCard';
import { DeviceDiagnosticsCard } from './components/DeviceDiagnosticsCard';
import { RawJsonModal } from './components/RawJsonModal';
import { 
  fetchIPDetails, 
  fetchCloudflareTrace, 
  measureLatencies, 
  getClientDeviceInfo 
} from './services/ipService';
import { 
  IPDetails, 
  CloudflareTrace, 
  LatencyTestResult, 
  ClientDeviceInfo, 
  SearchHistoryItem 
} from './types';
import { 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  Zap, 
  Globe2, 
  Check, 
  Info 
} from 'lucide-react';

const STORAGE_KEY = 'ip_checker_recent_searches_v1';

export default function App() {
  const [myIPDetails, setMyIPDetails] = useState<IPDetails | null>(null);
  const [currentDetails, setCurrentDetails] = useState<IPDetails | null>(null);
  const [cloudflareTrace, setCloudflareTrace] = useState<CloudflareTrace | null>(null);
  const [latencyResult, setLatencyResult] = useState<LatencyTestResult>({
    cloudflareLatency: null,
    googleLatency: null,
    status: 'idle',
  });
  const [deviceInfo, setDeviceInfo] = useState<ClientDeviceInfo>(getClientDeviceInfo());
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRetestingLatency, setIsRetestingLatency] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeQuery, setActiveQuery] = useState<string>('');
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [isRawJsonOpen, setIsRawJsonOpen] = useState<boolean>(false);

  // Load search history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save search history
  const addToHistory = (query: string, ip: string, location: string) => {
    try {
      const newItem: SearchHistoryItem = {
        query,
        ip,
        location,
        timestamp: Date.now(),
      };
      const filtered = searchHistory.filter(item => item.query.toLowerCase() !== query.toLowerCase());
      const updated = [newItem, ...filtered].slice(0, 10);
      setSearchHistory(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // Initial load: Fetch current client IP, Cloudflare trace, and Latency
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch in parallel for maximum speed
      const [ipData, traceData, latencyData] = await Promise.allSettled([
        fetchIPDetails(),
        fetchCloudflareTrace(),
        measureLatencies(),
      ]);

      if (ipData.status === 'fulfilled') {
        setMyIPDetails(ipData.value);
        setCurrentDetails(ipData.value);
        setActiveQuery('');
      } else {
        throw new Error(ipData.reason?.message || 'Failed to detect IP address');
      }

      if (traceData.status === 'fulfilled' && traceData.value) {
        setCloudflareTrace(traceData.value);
      }

      if (latencyData.status === 'fulfilled') {
        setLatencyResult(latencyData.value);
      }

      setDeviceInfo(getClientDeviceInfo());
    } catch (err: any) {
      setError(err?.message || 'Could not fetch IP details. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Search target IP or Domain
  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const details = await fetchIPDetails(query.trim());
      setCurrentDetails(details);
      setActiveQuery(query.trim());
      addToHistory(
        query.trim(),
        details.ip,
        `${details.city}, ${details.countryCode || details.country}`
      );
    } catch (err: any) {
      setError(err?.message || `Failed to lookup "${query}". Please verify the IP or domain name.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset back to user's detected IP
  const handleResetMyIP = () => {
    if (myIPDetails) {
      setCurrentDetails(myIPDetails);
      setActiveQuery('');
      setError(null);
    } else {
      loadInitialData();
    }
  };

  // Retest ping latencies
  const handleRetestLatency = async () => {
    setIsRetestingLatency(true);
    try {
      const latencies = await measureLatencies();
      setLatencyResult(latencies);
    } catch {
      // ignore
    } finally {
      setIsRetestingLatency(false);
    }
  };

  const isShowingMyIP = !activeQuery && currentDetails?.ip === myIPDetails?.ip;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Top Sticky Header */}
      <Navbar
        currentIP={myIPDetails?.ip}
        isDetecting={isLoading}
        onRefresh={loadInitialData}
        latency={latencyResult.cloudflareLatency}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Search and Presets Header */}
        <SearchHeader
          onSearch={handleSearch}
          onResetMyIP={handleResetMyIP}
          isLoading={isLoading}
          searchHistory={searchHistory}
          onClearHistory={handleClearHistory}
          currentQuery={activeQuery}
        />

        {/* Error Alert if any */}
        {error && (
          <div className="p-4 sm:p-5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3.5 text-rose-800 shadow-xs">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-rose-900">Lookup Error</h4>
              <p className="text-xs sm:text-sm mt-0.5 text-rose-700">{error}</p>
            </div>
            <button
              onClick={() => {
                setError(null);
                if (activeQuery) handleSearch(activeQuery);
                else loadInitialData();
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-xs font-semibold text-rose-800 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && !currentDetails && (
          <div className="space-y-6 animate-pulse">
            <div className="h-48 sm:h-56 bg-white rounded-xl border border-slate-200" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80 bg-white rounded-xl border border-slate-200" />
              <div className="h-80 bg-white rounded-xl border border-slate-200" />
            </div>
          </div>
        )}

        {/* IP Details Content */}
        {currentDetails && (
          <div className="space-y-6 sm:space-y-8">
            {/* Primary Hero IP Details Card */}
            <MainIPCard
              details={currentDetails}
              isMyIP={isShowingMyIP}
              latencyResult={latencyResult}
              onOpenRawJson={() => setIsRawJsonOpen(true)}
              onRetestLatency={handleRetestLatency}
            />

            {/* Comprehensive Domain & DNS Records Explorer (when domain is queried) */}
            {currentDetails.dnsData && (
              <DomainDNSCard
                dnsData={currentDetails.dnsData}
                primaryIP={currentDetails.ip}
                onSelectIP={(ip) => handleSearch(ip)}
              />
            )}

            {/* Interactive Leaflet Map */}
            <InteractiveMap
              latitude={currentDetails.latitude}
              longitude={currentDetails.longitude}
              locationLabel={`${currentDetails.city}, ${currentDetails.country}`}
              ip={currentDetails.ip}
              country={currentDetails.country}
              city={currentDetails.city}
              domain={currentDetails.queriedDomain}
            />

            {/* Geolocation Deep-Dive Grid */}
            <GeolocationDetails details={currentDetails} />

            {/* Network, ISP, and ASN Grid */}
            <NetworkDetails details={currentDetails} />

            {/* Cloudflare Edge Trace & Live Latency */}
            <CloudflareEdgeCard
              trace={cloudflareTrace}
              latency={latencyResult}
              onRetest={handleRetestLatency}
              isRetesting={isRetestingLatency}
            />

            {/* Client Device & Browser Diagnostics */}
            <DeviceDiagnosticsCard deviceInfo={deviceInfo} />
          </div>
        )}
      </main>

      {/* Raw JSON Modal */}
      {currentDetails && (
        <RawJsonModal
          isOpen={isRawJsonOpen}
          onClose={() => setIsRawJsonOpen(false)}
          details={currentDetails}
          trace={cloudflareTrace}
        />
      )}

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-slate-800">IP Checker & Geolocation Engine</span>
            <span>•</span>
            <span>Real-time Network Diagnostics</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-500">
            <span>Powered by Open Geolocation APIs</span>
            <span>•</span>
            <span>Cloudflare Edge Trace</span>
            <span>•</span>
            <span>OpenStreetMap</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
