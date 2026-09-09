import { useEffect, useRef, useState } from 'react';
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

type TileSource = 'carto' | 'osm' | 'satellite';

const TILE_LAYERS: Record<TileSource, { name: string; url: string; attribution: string; maxZoom: number }> = {
  carto: {
    name: 'Carto Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 19,
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye',
    maxZoom: 18,
  },
};

export function InteractiveMap({
  latitude,
  longitude,
  locationLabel,
  ip,
  country,
  city,
  domain,
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [copiedCoords, setCopiedCoords] = useState(false);
  const [activeTile, setActiveTile] = useState<TileSource>('carto');
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);

  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasValidCoords = !isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || !hasValidCoords) return;

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
        subdomains: activeTile === 'carto' ? 'abcd' : 'abc',
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      // Custom pulsing marker icon
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
            <span class="absolute inline-flex h-9 w-9 animate-ping rounded-full bg-blue-500 opacity-60"></span>
            <span class="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 border-2 border-white shadow-lg">
              <span class="h-2 w-2 rounded-full bg-white"></span>
            </span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const targetTitle = domain ? `${domain} (${city || 'Host Location'})` : `${city || 'Location'}`;
      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; line-height: 1.45; color: #0f172a; padding: 2px;">
          <strong style="color: #2563eb; font-size: 14px;">${targetTitle}</strong><br/>
          <span style="color: #475569; font-weight: 500;">${city ? `${city}, ` : ''}${country}</span><br/>
          <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #e2e8f0; font-family: monospace; font-size: 11px; color: #64748b;">
            <span>IP: <b>${ip}</b></span><br/>
            <span>Coords: ${lat.toFixed(5)}, ${lng.toFixed(5)}</span>
          </div>
        </div>
      `);

      markerRef.current = marker;
      mapInstanceRef.current = map;
    } else {
      // Map instance already exists, update position
      const map = mapInstanceRef.current;
      map.setView([lat, lng], 12, { animate: true });

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        const targetTitle = domain ? `${domain} (${city || 'Host Location'})` : `${city || 'Location'}`;
        markerRef.current.setPopupContent(`
          <div style="font-family: inherit; font-size: 13px; line-height: 1.45; color: #0f172a; padding: 2px;">
            <strong style="color: #2563eb; font-size: 14px;">${targetTitle}</strong><br/>
            <span style="color: #475569; font-weight: 500;">${city ? `${city}, ` : ''}${country}</span><br/>
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #e2e8f0; font-family: monospace; font-size: 11px; color: #64748b;">
              <span>IP: <b>${ip}</b></span><br/>
              <span>Coords: ${lat.toFixed(5)}, ${lng.toFixed(5)}</span>
            </div>
          </div>
        `);
      }
    }

    // Force multiple invalidateSize passes to guarantee crisp rendering inside dynamic flex containers
    const timers = [
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 50),
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200),
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
  }, [lat, lng, city, country, ip, domain, hasValidCoords]);

  // Handle tile switch
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const config = TILE_LAYERS[activeTile];
    const newLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
      subdomains: activeTile === 'carto' ? 'abcd' : 'abc',
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [activeTile]);

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

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=13/${lat}/${lng}`;

  return (
    <div 
      id="interactive-map-card"
      className="relative rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-md"
    >
      {/* Header bar of the map */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
              <span>Interactive Geolocation Map</span>
              <span className="text-xs font-normal text-slate-500 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                {locationLabel}
              </span>
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>Precise coordinates mapped via Leaflet & OpenStreetMap</span>
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
          {/* Layer switcher menu */}
          <div className="relative">
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
              <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white border border-slate-200 shadow-xl z-30 py-1 text-xs">
                {(Object.keys(TILE_LAYERS) as TileSource[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveTile(key);
                      setIsLayerMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                      activeTile === key ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{TILE_LAYERS[key].name}</span>
                    {activeTile === key && <Check className="h-3.5 w-3.5 text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Coordinates chip */}
          {hasValidCoords && (
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
      <div className="relative w-full h-80 sm:h-96 min-h-[320px] bg-slate-100">
        {hasValidCoords ? (
          <>
            <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full" />
            
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
