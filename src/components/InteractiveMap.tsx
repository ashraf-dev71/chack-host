import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Copy, 
  Check, 
  ExternalLink, 
  Crosshair,
  Layers,
  Globe2,
  Maximize2,
  Minimize2,
  Map as MapIcon,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface InteractiveMapProps {
  latitude: number;
  longitude: number;
  locationLabel: string;
  ip: string;
  country: string;
  city: string;
  domain?: string;
}

type MapProviderMode = 'leaflet' | 'google';
type TileSource = 'osm' | 'osm_hot' | 'opentopo' | 'esri_street' | 'satellite';

const TILE_LAYERS: Record<TileSource, { name: string; tag: string; url: string; attribution: string; maxZoom: number; subdomains?: string }> = {
  osm: {
    name: 'OpenStreetMap',
    tag: 'Classic',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  osm_hot: {
    name: 'Humanitarian OSM',
    tag: 'Vibrant Colors',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors, Tiles by <a href="https://www.hotosm.org/" target="_blank" rel="noopener">HOT</a>',
    maxZoom: 19,
    subdomains: 'abc',
  },
  opentopo: {
    name: 'OpenTopoMap',
    tag: 'Topographic & Relief',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>, SRTM | Map style &copy; <a href="https://opentopomap.org" target="_blank" rel="noopener">OpenTopoMap</a>',
    maxZoom: 17,
    subdomains: 'abc',
  },
  esri_street: {
    name: 'World Street Map',
    tag: 'Detailed Urban',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, DeLorme, NAVTEQ',
    maxZoom: 19,
  },
  satellite: {
    name: 'Satellite Imagery',
    tag: 'Aerial Photography',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 18,
  },
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!);
}

export function InteractiveMap({
  latitude,
  longitude,
  locationLabel,
  ip,
  country,
  city,
  domain,
}: InteractiveMapProps) {
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [mapMode, setMapMode] = useState<MapProviderMode>('leaflet');
  const [activeTile, setActiveTile] = useState<TileSource>('osm');
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasValidCoords = !isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0);

  const createPinIcon = useCallback(() => L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="position: relative; width: 38px; height: 48px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 28px; height: 12px; background: rgba(37, 99, 235, 0.35); border-radius: 50%; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; bottom: 1px; left: 50%; transform: translateX(-50%); width: 14px; height: 6px; background: rgba(15, 23, 42, 0.35); border-radius: 50%; filter: blur(1.5px);"></div>
        <svg style="position: absolute; top: 0; left: 0; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.25));" width="38" height="46" viewBox="0 0 38 46" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 0C8.50659 0 0 8.50659 0 19C0 31.5 19 46 19 46C19 46 38 31.5 38 19C38 8.50659 29.4934 0 19 0Z" fill="url(#pinGradient)"/>
          <circle cx="19" cy="18" r="7.5" fill="#FFFFFF"/><circle cx="19" cy="18" r="3.5" fill="#2563EB"/>
          <defs><linearGradient id="pinGradient" x1="0" y1="0" x2="38" y2="46" gradientUnits="userSpaceOnUse"><stop stop-color="#3B82F6"/><stop offset="1" stop-color="#1D4ED8"/></linearGradient></defs>
        </svg>
      </div>
    `,
    iconSize: [38, 48],
    iconAnchor: [19, 46],
    popupAnchor: [0, -42],
  }), []);

  const createPopupContent = useCallback(() => {
    const safeCity = escapeHtml(city || '');
    const safeCountry = escapeHtml(country);
    const safeIp = escapeHtml(ip);
    const safeDomain = domain ? escapeHtml(domain) : '';
    const targetTitle = safeDomain ? `${safeDomain} (${safeCity || 'Host'})` : (safeCity || 'Location');
    const gmapsLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    return `
      <div style="font-family: inherit; font-size: 13px; line-height: 1.5; color: #0f172a; min-width: 200px;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;"><span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #2563eb;"></span><strong style="color: #1e40af; font-size: 14px; font-weight: 700;">${targetTitle}</strong></div>
        <div style="color: #475569; font-weight: 500; font-size: 12px; margin-bottom: 6px;">${safeCity ? `${safeCity}, ` : ''}${safeCountry}</div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 8px; font-family: monospace; font-size: 11px; color: #475569; display: flex; flex-direction: column; gap: 3px;"><div><span style="color: #64748b;">IP:</span> <b style="color: #0f172a;">${safeIp}</b></div><div><span style="color: #64748b;">Coords:</span> ${lat.toFixed(5)}, ${lng.toFixed(5)}</div></div>
        <div style="margin-top: 8px; text-align: right;"><a href="${gmapsLink}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: none; font-size: 11px; font-weight: 600;">Open in Google Maps &rarr;</a></div>
      </div>
    `;
  }, [lat, lng, city, country, ip, domain]);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (mapMode !== 'leaflet') return;
    if (!mapContainerRef.current || !hasValidCoords) {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      markerRef.current = null;
      return;
    }

    if (!mapInstanceRef.current) {
      // Create new Leaflet instance
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 12,
        zoomControl: false, // custom or default placed neatly
        scrollWheelZoom: true,
      });

      // Add zoom control in top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Add tile layer
      const layerConfig = TILE_LAYERS[activeTile];
      const tileLayer = L.tileLayer(layerConfig.url, {
        attribution: layerConfig.attribution,
        maxZoom: layerConfig.maxZoom,
        subdomains: layerConfig.subdomains || 'abc',
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      const marker = L.marker([lat, lng], { icon: createPinIcon() }).addTo(map);
      marker.bindPopup(createPopupContent());

      markerRef.current = marker;
      mapInstanceRef.current = map;
    } else {
      // Map instance already exists, update position
      const map = mapInstanceRef.current;
      map.setView([lat, lng], 13, { animate: true });

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        markerRef.current.setIcon(createPinIcon());
        markerRef.current.setPopupContent(createPopupContent());
      }
    }

    // Force multiple invalidateSize passes to guarantee crisp rendering inside dynamic flex containers
    const timers = [
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 60),
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 250),
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 600),
    ];

    // Setup ResizeObserver
    let resizeObserver: ResizeObserver | null = null;
    if (mapContainerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        mapInstanceRef.current?.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      timers.forEach(t => clearTimeout(t));
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [mapMode, lat, lng, hasValidCoords, createPinIcon, createPopupContent]);

  // Handle tile switch
  useEffect(() => {
    if (mapMode !== 'leaflet' || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const config = TILE_LAYERS[activeTile];
    const newLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
      subdomains: config.subdomains || 'abc',
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [activeTile, mapMode]);

  useEffect(() => {
    if (mapMode !== 'leaflet' && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      markerRef.current = null;
    }
  }, [mapMode]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleCopyCoordinates = async () => {
    if (!hasValidCoords) return;
    try {
      await navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current && hasValidCoords) {
      mapInstanceRef.current.setView([lat, lng], 13, { animate: true });
      markerRef.current?.openPopup();
    }
  };

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  const toggleFullscreen = async () => {
    if (!mapWrapperRef.current) return;
    try {
      if (document.fullscreenElement === mapWrapperRef.current) await document.exitFullscreen();
      else await mapWrapperRef.current.requestFullscreen();
    } catch {
      return;
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === mapWrapperRef.current);
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=13/${lat}/${lng}`;
  const googleEmbedUrl = `https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=13&output=embed`;

  return (
    <div 
      id="interactive-map-card"
      ref={mapWrapperRef}
      className={`relative rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-md ${isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen w-screen border-none' : ''}`}
    >
      {/* Header bar of the map */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
              <span>Geolocation & IP Map</span>
              <span className="text-xs font-normal text-slate-500 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                {locationLabel}
              </span>
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>Pinpointed coordinates via OpenStreetMap & Google Maps</span>
              {domain && (
                <span className="inline-flex items-center gap-1 font-mono text-blue-600 font-semibold">
                  &bull; {domain}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Controls & external map links */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 bg-slate-200/70 rounded-xl text-xs font-semibold text-slate-600">
            <button onClick={() => setMapMode('leaflet')} className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${mapMode === 'leaflet' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'hover:text-slate-900'}`}>
              <MapIcon className="h-3.5 w-3.5" /><span>Interactive Map</span>
            </button>
            <button onClick={() => setMapMode('google')} className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${mapMode === 'google' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'hover:text-slate-900'}`}>
              <Globe2 className="h-3.5 w-3.5" /><span>Google Maps View</span>
            </button>
          </div>
          {/* Layer switcher menu */}
          {mapMode === 'leaflet' && <div className="relative">
            <button
              id="map-layers-btn"
              onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 border border-slate-200 shadow-xs transition-colors cursor-pointer"
              title="Change map style"
            >
              <Layers className="h-3.5 w-3.5 text-blue-600" />
              <span className="hidden sm:inline">{TILE_LAYERS[activeTile].name}</span>
            </button>

            {isLayerMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-white border border-slate-200 shadow-xl z-30 py-1.5 text-xs">
                <div className="px-3 py-1.5 font-bold text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-100">Open Source & Satellite Maps</div>
                {(Object.keys(TILE_LAYERS) as TileSource[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveTile(key);
                      setIsLayerMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors cursor-pointer ${
                      activeTile === key ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-col"><span className="font-medium text-slate-900">{TILE_LAYERS[key].name}</span><span className="text-[10px] text-slate-500">{TILE_LAYERS[key].tag}</span></div>
                    {activeTile === key && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>}

          {/* Coordinates chip */}
          {hasValidCoords && mapMode === 'leaflet' && (
            <button
              id="copy-coords-btn"
              onClick={handleCopyCoordinates}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-xs font-mono text-slate-700 border border-slate-200 shadow-xs transition-colors cursor-pointer"
              title="Copy GPS coordinates"
            >
              {copiedCoords ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
              <span>{lat.toFixed(4)}, {lng.toFixed(4)}</span>
            </button>
          )}

          <button onClick={toggleFullscreen} className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs transition-colors cursor-pointer" title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          {/* Recenter button */}
          {hasValidCoords && (
            <button
              id="recenter-map-btn"
              onClick={handleRecenter}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs transition-colors cursor-pointer"
              title="Recenter pin on map"
            >
              <Crosshair className="h-4 w-4" />
            </button>
          )}

          {/* Open in Google Maps */}
          {hasValidCoords && (
            <a
              id="google-maps-link"
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 border border-slate-200 shadow-xs transition-colors"
            >
              <span>Google Maps</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
          )}

          {/* Open in OpenStreetMap */}
          {hasValidCoords && (
            <a
              id="osm-link"
              href={osmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 border border-slate-200 shadow-xs transition-colors"
            >
              <span>OSM</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
          )}
        </div>
      </div>

      {/* Map viewport */}
      <div className={`relative w-full ${isFullscreen ? 'flex-1 h-full' : 'h-80 sm:h-96 min-h-[340px]'} bg-slate-100`}>
        {hasValidCoords ? (
          <>
            {mapMode === 'leaflet' ? <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full" /> : <iframe title="Google Maps Location View" src={googleEmbedUrl} className="absolute inset-0 z-0 h-full w-full border-0" loading="lazy" allowFullScreen />}

            {mapMode === 'leaflet' && <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 bg-white/90 backdrop-blur-md p-1 rounded-xl border border-slate-200/90 shadow-md">
              <button onClick={handleZoomIn} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer" title="Zoom in"><ZoomIn className="h-4 w-4" /></button>
              <button onClick={handleZoomOut} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer" title="Zoom out"><ZoomOut className="h-4 w-4" /></button>
              <div className="h-px bg-slate-200 my-0.5" />
              <button onClick={handleRecenter} className="p-1.5 rounded-lg hover:bg-slate-100 text-blue-600 transition-colors cursor-pointer" title="Recenter pin"><Crosshair className="h-4 w-4" /></button>
            </div>}
            
            {/* Subtle Map Overlay Badge */}
            <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
              <div className="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-xs font-mono text-slate-700 flex items-center gap-2 shadow-md">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold text-slate-900">{city || 'Location'}</span>
                <span className="text-slate-400">&bull;</span>
                <span>{country}</span>
                <span className="text-slate-400">&bull;</span>
                <span className="text-blue-600 font-bold">{ip}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className="p-4 rounded-full bg-blue-50 text-blue-600 mb-3">
              <Globe2 className="h-8 w-8" />
            </div>
            <h4 className="text-sm font-semibold text-slate-700">Coordinates Not Resolved</h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Geographic coordinates could not be pinpointed for this IP or domain range.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
