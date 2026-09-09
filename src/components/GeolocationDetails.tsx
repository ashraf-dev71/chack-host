import { useState, useEffect } from 'react';
import { 
  Globe, 
  Compass, 
  Clock, 
  Coins, 
  Phone, 
  Building2, 
  MapPinned, 
  Navigation 
} from 'lucide-react';
import { IPDetails } from '../types';

interface GeolocationDetailsProps {
  details: IPDetails;
}

export function GeolocationDetails({ details }: GeolocationDetailsProps) {
  // Live ticking clock for timezone
  const [localTime, setLocalTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      try {
        if (details.timezone.id) {
          const now = new Date();
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: details.timezone.id,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          setLocalTime(formatter.format(now));
        }
      } catch {
        setLocalTime(details.timezone.currentTime || 'N/A');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [details.timezone.id, details.timezone.currentTime]);

  const items = [
    {
      icon: Globe,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      label: 'Country & Code',
      val: (
        <span className="flex items-center gap-2">
          <span>{details.countryFlag}</span>
          <span>{details.country}</span>
          <span className="text-xs font-mono text-slate-500">({details.countryCode})</span>
        </span>
      ),
      sub: details.continent ? `Continent: ${details.continent}` : undefined,
    },
    {
      icon: Building2,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
      label: 'City & Postal Code',
      val: details.city || 'Unknown',
      sub: details.postal ? `Postal Code: ${details.postal}` : 'Postal Code: Not specified',
    },
    {
      icon: MapPinned,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      label: 'Region / State',
      val: details.region || 'Unknown',
      sub: details.regionCode ? `State Code: ${details.regionCode}` : undefined,
    },
    {
      icon: Clock,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
      label: 'Local Time & Zone',
      val: localTime || details.timezone.id,
      sub: `${details.timezone.id} (${details.timezone.utc || 'UTC'})`,
    },
    {
      icon: Navigation,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
      label: 'Coordinates',
      val: `${details.latitude.toFixed(5)}, ${details.longitude.toFixed(5)}`,
      sub: `Lat: ${details.latitude} • Lng: ${details.longitude}`,
      isMono: true,
    },
    {
      icon: Phone,
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50',
      label: 'Calling Code & Capital',
      val: details.callingCode ? `+${details.callingCode}` : 'N/A',
      sub: details.capital ? `Capital: ${details.capital}` : undefined,
    },
    {
      icon: Coins,
      iconColor: 'text-yellow-600',
      iconBg: 'bg-yellow-50',
      label: 'Currency',
      val: details.currency ? `${details.currency.name} (${details.currency.code})` : 'N/A',
      sub: details.currency?.symbol ? `Symbol: ${details.currency.symbol}` : undefined,
    },
    {
      icon: Compass,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      label: 'Continent & Area',
      val: details.continent || 'Unknown',
      sub: details.continentCode ? `Code: ${details.continentCode}` : undefined,
    },
  ];

  return (
    <div id="geolocation-details-section" className="rounded-xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
          <Globe className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800">Detailed Geolocation</h2>
          <p className="text-xs text-slate-500">Comprehensive geographic and regional mapping</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`p-1.5 rounded-md ${item.iconBg} ${item.iconColor}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {item.label}
                </span>
              </div>
              <div>
                <div className={`text-sm font-semibold text-slate-800 ${item.isMono ? 'font-mono' : ''}`}>
                  {item.val}
                </div>
                {item.sub && (
                  <div className="text-xs text-slate-500 mt-1 truncate">
                    {item.sub}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
