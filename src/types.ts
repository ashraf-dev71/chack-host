export interface DNSRecordItem {
  name: string;
  type: string;
  ttl?: number;
  data: string;
  priority?: number;
}

export interface DomainDNSData {
  domain: string;
  a: string[];
  aaaa: string[];
  mx: { host: string; priority?: number }[];
  ns: string[];
  txt: string[];
  cname: string[];
  httpStatus?: {
    online: boolean;
    statusCode?: number;
    latencyMs?: number;
    protocol?: string;
  };
}

export interface IPDetails {
  ip: string;
  type: 'IPv4' | 'IPv6';
  hostname?: string;
  queriedDomain?: string;
  resolvedIPs?: string[];
  dnsData?: DomainDNSData;
  city: string;
  region: string;
  regionCode?: string;
  country: string;
  countryCode: string;
  countryFlag?: string;
  countryFlagSvg?: string;
  continent: string;
  continentCode?: string;
  postal?: string;
  latitude: number;
  longitude: number;
  timezone: {
    id: string;
    abbr?: string;
    offset?: string | number;
    utc?: string;
    currentTime?: string;
  };
  callingCode?: string;
  capital?: string;
  currency?: {
    code: string;
    name: string;
    symbol: string;
  };
  connection: {
    asn?: number | string;
    org?: string;
    isp?: string;
    domain?: string;
  };
  security?: {
    isProxy?: boolean;
    isVpn?: boolean;
    isTor?: boolean;
    isHosting?: boolean;
  };
  source: string;
  fetchedAt: string;
}

export interface CloudflareTrace {
  fl?: string;
  h?: string;
  ip?: string;
  ts?: string;
  visit_scheme?: string;
  uag?: string;
  colo?: string;
  coloCity?: string;
  http?: string;
  loc?: string;
  tls?: string;
  sni?: string;
  warp?: string;
  gateway?: string;
  rbi?: string;
  kex?: string;
}

export interface LatencyTestResult {
  cloudflareLatency: number | null;
  googleLatency: number | null;
  status: 'idle' | 'testing' | 'completed' | 'failed';
  lastChecked?: string;
}

export interface ClientDeviceInfo {
  browser: string;
  os: string;
  screenResolution: string;
  language: string;
  platform: string;
  connectionType?: string;
  downlink?: number;
  rtt?: number;
  online: boolean;
}

export interface SearchHistoryItem {
  query: string;
  ip: string;
  location: string;
  timestamp: number;
}
