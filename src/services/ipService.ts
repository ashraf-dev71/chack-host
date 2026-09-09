import { IPDetails, CloudflareTrace, LatencyTestResult, ClientDeviceInfo, DomainDNSData } from '../types';

// Common Cloudflare datacenter (colo) IATA airport codes mapped to city/country
const CLOUDFLARE_COLO_MAP: Record<string, string> = {
  SIN: 'Singapore',
  DHK: 'Dhaka, Bangladesh',
  BKK: 'Bangkok, Thailand',
  KUL: 'Kuala Lumpur, Malaysia',
  HKG: 'Hong Kong',
  NRT: 'Tokyo (Narita), Japan',
  HND: 'Tokyo (Haneda), Japan',
  KIX: 'Osaka, Japan',
  ICN: 'Seoul, South Korea',
  DEL: 'Delhi, India',
  BOM: 'Mumbai, India',
  MAA: 'Chennai, India',
  BLR: 'Bengaluru, India',
  CCU: 'Kolkata, India',
  LHR: 'London (Heathrow), UK',
  LGW: 'London (Gatwick), UK',
  AMS: 'Amsterdam, Netherlands',
  FRA: 'Frankfurt, Germany',
  CDG: 'Paris (Charles de Gaulle), France',
  MAD: 'Madrid, Spain',
  ZRH: 'Zurich, Switzerland',
  ARN: 'Stockholm, Sweden',
  WAW: 'Warsaw, Poland',
  SJC: 'San Jose, CA, USA',
  LAX: 'Los Angeles, CA, USA',
  SFO: 'San Francisco, CA, USA',
  ORD: 'Chicago, IL, USA',
  DFW: 'Dallas, TX, USA',
  IAD: 'Washington DC / Ashburn, VA, USA',
  EWR: 'Newark, NJ, USA',
  JFK: 'New York (JFK), USA',
  MIA: 'Miami, FL, USA',
  SEA: 'Seattle, WA, USA',
  ATL: 'Atlanta, GA, USA',
  YYZ: 'Toronto, Canada',
  YVR: 'Vancouver, Canada',
  SYD: 'Sydney, Australia',
  MEL: 'Melbourne, Australia',
  GRU: 'São Paulo, Brazil',
  JNB: 'Johannesburg, South Africa',
  DXB: 'Dubai, UAE',
  DOH: 'Doha, Qatar',
};

/**
 * Fetch Cloudflare trace directly from edge
 */
export async function fetchCloudflareTrace(): Promise<CloudflareTrace | null> {
  const endpoints = [
    'https://1.1.1.1/cdn-cgi/trace',
    'https://cloudflare.com/cdn-cgi/trace',
    'https://one.one.one.one/cdn-cgi/trace',
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeout);

      if (res.ok) {
        const text = await res.text();
        return parseCloudflareTraceText(text);
      }
    } catch {
      // try next endpoint
    }
  }
  return null;
}

function parseCloudflareTraceText(text: string): CloudflareTrace {
  const result: Record<string, string> = {};
  const lines = text.trim().split('\n');
  for (const line of lines) {
    const idx = line.indexOf('=');
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      result[key] = val;
    }
  }

  const trace: CloudflareTrace = {
    fl: result['fl'],
    h: result['h'],
    ip: result['ip'],
    ts: result['ts'],
    visit_scheme: result['visit_scheme'],
    uag: result['uag'],
    colo: result['colo'],
    coloCity: result['colo'] ? CLOUDFLARE_COLO_MAP[result['colo']] || result['colo'] : undefined,
    http: result['http'],
    loc: result['loc'],
    tls: result['tls'],
    sni: result['sni'],
    warp: result['warp'],
    gateway: result['gateway'],
    rbi: result['rbi'],
    kex: result['kex'],
  };

  return trace;
}

/**
 * Sanitize user input to extract clean domain or IP (strip http://, https://, paths, ports)
 */
export function sanitizeInput(input?: string): {
  clean: string;
  isIP: boolean;
  isDomain: boolean;
} {
  if (!input) return { clean: '', isIP: false, isDomain: false };
  let clean = input.trim();

  // Strip protocol
  clean = clean.replace(/^[a-zA-Z]+:\/\//, '');

  // Strip path, query, hash
  clean = clean.split('/')[0].split('?')[0].split('#')[0];

  // Strip port if IPv4 or domain (e.g. example.com:443 or 8.8.8.8:53)
  if (!clean.startsWith('[') && clean.includes(':') && clean.indexOf(':') === clean.lastIndexOf(':')) {
    const [host, port] = clean.split(':');
    if (!isNaN(Number(port))) {
      clean = host;
    }
  }

  clean = clean.trim();

  // Check if IPv4
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  // Check if IPv6
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){1,7}[0-9a-fA-F]{1,4}|::1|([0-9a-fA-F]{1,4}:)*:[0-9a-fA-F]{1,4})$/;
  const isIPv4 = ipv4Regex.test(clean);
  const isIPv6 = ipv6Regex.test(clean) || (clean.includes(':') && !clean.includes('.'));
  const isIP = isIPv4 || isIPv6;

  // Domain check: has letters/numbers, dots, and valid TLD pattern
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  const isDomain = !isIP && (domainRegex.test(clean) || clean.includes('.'));

  return { clean, isIP, isDomain };
}

/**
 * Resolve domain name to IP addresses using public DNS-over-HTTPS (Google & Cloudflare)
 */
export async function resolveDomainToIP(domain: string): Promise<{ primaryIP: string; allIPs: string[] }> {
  // Provider 1: Google DNS over HTTPS
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.Status === 3) {
        throw new Error(`Domain "${domain}" does not exist (NXDOMAIN). Please check the spelling.`);
      }

      if (data.Answer && Array.isArray(data.Answer)) {
        // type 1 = A record (IPv4)
        const aRecords = data.Answer.filter((ans: any) => ans.type === 1).map((ans: any) => ans.data);
        if (aRecords.length > 0) {
          return { primaryIP: aRecords[0], allIPs: aRecords };
        }
      }

      // If no A record, check for AAAA (IPv6)
      const resV6 = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=AAAA`);
      if (resV6.ok) {
        const dataV6 = await resV6.json();
        if (dataV6.Answer && Array.isArray(dataV6.Answer)) {
          const aaaaRecords = dataV6.Answer.filter((ans: any) => ans.type === 28).map((ans: any) => ans.data);
          if (aaaaRecords.length > 0) {
            return { primaryIP: aaaaRecords[0], allIPs: aaaaRecords };
          }
        }
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes('NXDOMAIN')) {
      throw err;
    }
  }

  // Provider 2: Cloudflare DNS over HTTPS
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`, {
      headers: { accept: 'application/dns-json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.Status === 3) {
        throw new Error(`Domain "${domain}" does not exist. Please verify the domain name.`);
      }

      if (data.Answer && Array.isArray(data.Answer)) {
        const aRecords = data.Answer.filter((ans: any) => ans.type === 1).map((ans: any) => ans.data);
        if (aRecords.length > 0) {
          return { primaryIP: aRecords[0], allIPs: aRecords };
        }
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes('does not exist')) {
      throw err;
    }
  }

  throw new Error(`Unable to resolve domain "${domain}". Please verify the domain name and try again.`);
}

/**
 * Fetch comprehensive DNS records for a domain (A, AAAA, MX, TXT, NS, CNAME)
 */
export async function fetchDomainDNSData(domain: string): Promise<DomainDNSData> {
  const types = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME'];
  const dns: DomainDNSData = {
    domain,
    a: [],
    aaaa: [],
    mx: [],
    ns: [],
    txt: [],
    cname: [],
  };

  const results = await Promise.allSettled(
    types.map(async (t) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${t}`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) return { type: t, answers: [] };
      const data = await res.json();
      return { type: t, answers: data.Answer || [] };
    })
  );

  results.forEach((r) => {
    if (r.status === 'fulfilled') {
      const { type, answers } = r.value;
      if (type === 'A') dns.a = answers.filter((a: any) => a.type === 1).map((a: any) => a.data);
      if (type === 'AAAA') dns.aaaa = answers.filter((a: any) => a.type === 28).map((a: any) => a.data);
      if (type === 'MX') {
        dns.mx = answers
          .filter((a: any) => a.type === 15)
          .map((a: any) => {
            const parts = (a.data || '').trim().split(/\s+/);
            if (parts.length > 1 && !isNaN(Number(parts[0]))) {
              return { priority: Number(parts[0]), host: parts.slice(1).join(' ') };
            }
            return { host: a.data };
          });
      }
      if (type === 'NS') dns.ns = answers.filter((a: any) => a.type === 2).map((a: any) => a.data);
      if (type === 'TXT') dns.txt = answers.filter((a: any) => a.type === 16).map((a: any) => (a.data || '').replace(/^"|"$/g, ''));
      if (type === 'CNAME') dns.cname = answers.filter((a: any) => a.type === 5).map((a: any) => a.data);
    }
  });

  return dns;
}

/**
 * Live host HTTP / HTTPS connectivity probe and round-trip ping latency
 */
export async function probeHostHttp(domain: string): Promise<{ online: boolean; latencyMs: number; protocol: string }> {
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    await fetch(`https://${domain}/favicon.ico`, {
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);
    const latencyMs = Math.max(2, Math.round(performance.now() - start));
    return { online: true, latencyMs, protocol: 'HTTPS' };
  } catch {
    try {
      const controller2 = new AbortController();
      const timer2 = setTimeout(() => controller2.abort(), 3000);
      await fetch(`http://${domain}/`, {
        mode: 'no-cors',
        signal: controller2.signal,
        cache: 'no-store',
      });
      clearTimeout(timer2);
      const latencyMs = Math.max(2, Math.round(performance.now() - start));
      return { online: true, latencyMs, protocol: 'HTTP' };
    } catch {
      return { online: false, latencyMs: 0, protocol: 'Unreachable' };
    }
  }
}

/**
 * Reverse DNS (PTR) lookup for an IP address
 */
export async function resolveReverseDNS(ip: string): Promise<string | undefined> {
  if (!ip || ip.includes(':')) return undefined; // basic IPv4
  try {
    const parts = ip.split('.').reverse().join('.');
    const ptrQuery = `${parts}.in-addr.arpa`;
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(ptrQuery)}&type=PTR`);
    if (res.ok) {
      const data = await res.json();
      if (data.Answer && data.Answer.length > 0) {
        return (data.Answer[0].data || '').replace(/\.$/, '');
      }
    }
  } catch {
    // fallback
  }
  return undefined;
}

/**
 * Fetch IP details using ipwho.is (Free, CORS enabled, no key required, comprehensive)
 * with graceful fallback to freeipapi.com.
 * Automatically resolves domain names to IP addresses first and fetches full DNS records!
 */
export async function fetchIPDetails(query?: string): Promise<IPDetails> {
  let targetIP = '';
  let queriedDomain: string | undefined = undefined;
  let resolvedIPs: string[] | undefined = undefined;
  let dnsDataPromise: Promise<DomainDNSData> | null = null;
  let httpProbePromise: Promise<{ online: boolean; latencyMs: number; protocol: string }> | null = null;

  if (query && query.trim()) {
    const { clean, isIP, isDomain } = sanitizeInput(query);

    if (isDomain) {
      queriedDomain = clean;
      // Start fetching full DNS records & HTTP probe in background while resolving IP
      dnsDataPromise = fetchDomainDNSData(clean);
      httpProbePromise = probeHostHttp(clean);

      // Resolve domain to IP
      const resolved = await resolveDomainToIP(clean);
      targetIP = resolved.primaryIP;
      resolvedIPs = resolved.allIPs;
    } else {
      targetIP = clean;
    }
  }

  // Await DNS data if domain
  const [dnsDataResult, httpProbeResult] = await Promise.allSettled([
    dnsDataPromise ?? Promise.resolve(null),
    httpProbePromise ?? Promise.resolve(null),
  ]);

  const dnsData = dnsDataResult.status === 'fulfilled' && dnsDataResult.value ? dnsDataResult.value : undefined;
  if (dnsData && httpProbeResult.status === 'fulfilled' && httpProbeResult.value) {
    dnsData.httpStatus = httpProbeResult.value;
  }

  // If IP lookup (not domain), perform reverse DNS check
  let reverseHostname: string | undefined = undefined;
  if (!queriedDomain && targetIP) {
    reverseHostname = await resolveReverseDNS(targetIP);
  }

  // Try ipwho.is first
  try {
    const url = targetIP ? `https://ipwho.is/${encodeURIComponent(targetIP)}` : 'https://ipwho.is/';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.success !== false) {
        return {
          ip: data.ip,
          type: data.type || (data.ip.includes(':') ? 'IPv6' : 'IPv4'),
          hostname: queriedDomain || reverseHostname || data.connection?.domain,
          queriedDomain,
          resolvedIPs,
          dnsData,
          city: data.city || 'Unknown',
          region: data.region || 'Unknown',
          regionCode: data.region_code,
          country: data.country || 'Unknown',
          countryCode: data.country_code || '',
          countryFlag: data.flag?.emoji || getFlagEmoji(data.country_code),
          countryFlagSvg: data.flag?.img,
          continent: data.continent || 'Unknown',
          continentCode: data.continent_code,
          postal: data.postal,
          latitude: Number(data.latitude) || 0,
          longitude: Number(data.longitude) || 0,
          timezone: {
            id: data.timezone?.id || 'UTC',
            abbr: data.timezone?.abbr,
            offset: data.timezone?.offset,
            utc: data.timezone?.utc,
            currentTime: data.timezone?.current_time,
          },
          callingCode: data.calling_code,
          capital: data.capital,
          currency: data.currency ? {
            code: data.currency.code || '',
            name: data.currency.name || '',
            symbol: data.currency.symbol || '',
          } : undefined,
          connection: {
            asn: data.connection?.asn,
            org: data.connection?.org,
            isp: data.connection?.isp,
            domain: queriedDomain || data.connection?.domain,
          },
          security: {
            isProxy: data.security?.proxy,
            isVpn: data.security?.vpn,
            isTor: data.security?.tor,
            isHosting: data.security?.hosting,
          },
          source: queriedDomain ? `DNS + ipwho.is` : 'ipwho.is',
          fetchedAt: new Date().toISOString(),
        };
      } else if (data.message && targetIP) {
        throw new Error(data.message);
      }
    }
  } catch (err: any) {
    if (err?.message && !err.message.includes('fetch') && !err.message.includes('Abort')) {
      throw err;
    }
  }

  // Fallback 1: freeipapi.com
  try {
    const url = targetIP
      ? `https://freeipapi.com/api/json/${encodeURIComponent(targetIP)}`
      : 'https://freeipapi.com/api/json';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return {
        ip: data.ipAddress || targetIP || 'Unknown',
        type: data.ipVersion === 6 ? 'IPv6' : 'IPv4',
        hostname: queriedDomain || reverseHostname,
        queriedDomain,
        resolvedIPs,
        dnsData,
        city: data.cityName || 'Unknown',
        region: data.regionName || 'Unknown',
        country: data.countryName || 'Unknown',
        countryCode: data.countryCode || '',
        countryFlag: getFlagEmoji(data.countryCode),
        continent: data.continent || 'Unknown',
        postal: data.zipCode,
        latitude: Number(data.latitude) || 0,
        longitude: Number(data.longitude) || 0,
        timezone: {
          id: data.timeZone || 'UTC',
        },
        connection: {
          isp: 'Standard ISP',
          domain: queriedDomain,
        },
        source: queriedDomain ? `DNS + freeipapi` : 'freeipapi.com',
        fetchedAt: new Date().toISOString(),
      };
    }
  } catch {
    // Continue to fallback 2
  }

  // Fallback 2: api.ipify.org to get IP at least
  try {
    const res = await fetch('https://api64.ipify.org?format=json');
    if (res.ok) {
      const data = await res.json();
      return {
        ip: data.ip,
        type: data.ip.includes(':') ? 'IPv6' : 'IPv4',
        hostname: queriedDomain || reverseHostname,
        queriedDomain,
        resolvedIPs,
        dnsData,
        city: 'Global',
        region: 'Internet',
        country: 'Worldwide',
        countryCode: '',
        countryFlag: '🌐',
        continent: 'Global',
        latitude: 20,
        longitude: 0,
        timezone: {
          id: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        },
        connection: {
          isp: 'Detected via IPify',
          domain: queriedDomain,
        },
        source: 'api.ipify.org',
        fetchedAt: new Date().toISOString(),
      };
    }
  } catch {
    // fallback exhausted
  }

  throw new Error('Unable to retrieve IP details. Please check your network connection.');
}

/**
 * Perform real latency measurements to Cloudflare and Google
 */
export async function measureLatencies(): Promise<LatencyTestResult> {
  const result: LatencyTestResult = {
    cloudflareLatency: null,
    googleLatency: null,
    status: 'testing',
    lastChecked: new Date().toLocaleTimeString(),
  };

  // Test Cloudflare edge (1.1.1.1)
  try {
    const t0 = performance.now();
    await fetch('https://1.1.1.1/cdn-cgi/trace?_=' + Math.random(), {
      cache: 'no-store',
      mode: 'cors',
    });
    const t1 = performance.now();
    result.cloudflareLatency = Math.round(t1 - t0);
  } catch {
    // try fallback image beacon
    try {
      const t0 = performance.now();
      await fetch('https://cloudflare.com/favicon.ico?_=' + Math.random(), {
        mode: 'no-cors',
        cache: 'no-store',
      });
      const t1 = performance.now();
      result.cloudflareLatency = Math.round(t1 - t0);
    } catch {
      result.cloudflareLatency = null;
    }
  }

  // Test Google DNS (dns.google)
  try {
    const t0 = performance.now();
    await fetch('https://dns.google/resolve?name=example.com&type=A&_=' + Math.random(), {
      cache: 'no-store',
    });
    const t1 = performance.now();
    result.googleLatency = Math.round(t1 - t0);
  } catch {
    result.googleLatency = null;
  }

  result.status = (result.cloudflareLatency !== null || result.googleLatency !== null) ? 'completed' : 'failed';
  return result;
}

/**
 * Gather client device diagnostics directly from navigator and screen
 */
export function getClientDeviceInfo(): ClientDeviceInfo {
  const nav = typeof navigator !== 'undefined' ? navigator : ({} as any);
  const ua = nav.userAgent || '';

  // Browser detection
  let browser = 'Unknown Browser';
  if (ua.includes('Firefox/')) {
    browser = 'Mozilla Firefox ' + (ua.split('Firefox/')[1]?.split(' ')[0] || '');
  } else if (ua.includes('Edg/')) {
    browser = 'Microsoft Edge ' + (ua.split('Edg/')[1]?.split(' ')[0] || '');
  } else if (ua.includes('Chrome/')) {
    browser = 'Google Chrome ' + (ua.split('Chrome/')[1]?.split(' ')[0] || '');
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    browser = 'Apple Safari ' + (ua.split('Version/')[1]?.split(' ')[0] || '');
  } else if (ua.includes('Opera/') || ua.includes('OPR/')) {
    browser = 'Opera';
  }

  // OS detection
  let os = 'Unknown OS';
  if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
  else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1';
  else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
  else if (ua.includes('Mac OS X')) {
    const match = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
    os = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
  } else if (ua.includes('Android')) {
    const match = ua.match(/Android\s([0-9.]*)/);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'Apple iOS';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  }

  const screenResolution = typeof window !== 'undefined'
    ? `${window.screen.width} × ${window.screen.height} (${window.devicePixelRatio}x)`
    : 'Unknown';

  const connection = (nav as any).connection || (nav as any).mozConnection || (nav as any).webkitConnection;

  return {
    browser,
    os,
    screenResolution,
    language: nav.language || 'en-US',
    platform: nav.platform || 'Unknown',
    connectionType: connection?.effectiveType || connection?.type || 'Broadband / Cellular',
    downlink: connection?.downlink,
    rtt: connection?.rtt,
    online: nav.onLine !== false,
  };
}

/**
 * Generate Country Flag Emoji from 2-letter ISO code
 */
export function getFlagEmoji(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
