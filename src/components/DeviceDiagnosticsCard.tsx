import { 
  Laptop, 
  Monitor, 
  Wifi, 
  Globe2, 
  Layers, 
  CheckCircle2, 
  Sliders 
} from 'lucide-react';
import { ClientDeviceInfo } from '../types';

interface DeviceDiagnosticsCardProps {
  deviceInfo: ClientDeviceInfo;
}

export function DeviceDiagnosticsCard({ deviceInfo }: DeviceDiagnosticsCardProps) {
  const items = [
    {
      icon: Laptop,
      label: 'Browser Client',
      val: deviceInfo.browser,
      sub: deviceInfo.platform,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    {
      icon: Layers,
      label: 'Operating System',
      val: deviceInfo.os,
      sub: `Platform: ${deviceInfo.platform}`,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
    },
    {
      icon: Monitor,
      label: 'Display Resolution',
      val: deviceInfo.screenResolution,
      sub: 'Screen Pixel Dimension',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      isMono: true,
    },
    {
      icon: Wifi,
      label: 'Connection Link',
      val: deviceInfo.connectionType || 'Broadband / Cellular',
      sub: deviceInfo.downlink ? `Bandwidth: ~${deviceInfo.downlink} Mbps` : 'Direct Internet Gateway',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
  ];

  return (
    <div id="device-diagnostics-section" className="rounded-xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Client Device & Browser Audit</h2>
            <p className="text-xs text-slate-500">Hardware display, browser stack, and network interface metrics</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>{deviceInfo.online ? 'Online' : 'Offline'}</span>
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
                <div className={`text-sm font-semibold text-slate-800 truncate ${item.isMono ? 'font-mono' : ''}`}>
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
