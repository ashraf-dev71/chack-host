# CheckHost

### A fast, visual toolkit for understanding hosts, domains, and networks.

[![Live site](https://img.shields.io/badge/Live%20site-chack--host.bdhyperashraf71.me-0f766e?style=flat-square)](https://chack-host.bdhyperashraf71.me/)
[![Built with React](https://img.shields.io/badge/React-19-149eca?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-111827?style=flat-square)](LICENSE)

CheckHost is a client-side network intelligence dashboard for developers, sysadmins, network engineers, and curious builders. Enter a hostname, domain, IPv4 address, or IPv6 address and get a clear view of its DNS, location, routing, security signals, and edge details.

<p align="center">
  <a href="https://ipchacker
.bdhyperashraf71.me"><strong>Open the live dashboard →</strong></a>
</p>

## What you can inspect

| Area | What CheckHost reveals |
| --- | --- |
| **IP intelligence** | Location, timezone, ISP, ASN, organization, CIDR, reverse DNS, and routing details |
| **DNS records** | A, AAAA, CNAME, MX, NS, and TXT records resolved through public DNS-over-HTTPS providers |
| **Connectivity** | Client-side latency measurements and HTTP/HTTPS reachability checks |
| **Security signals** | Proxy, VPN, Tor, hosting, and datacenter indicators where data is available |
| **Cloudflare edge** | Colo, protocol, TLS, WARP, and edge response diagnostics |
| **Device context** | Browser, operating system, local IP, and connection information |
| **Geography** | Interactive Leaflet map with standard, Voyager, and satellite tile layers |
| **Exports** | Copy individual values, download DNS zone-style output, or inspect the raw JSON response |

## Why it is useful

- **No account and no backend to maintain:** the dashboard runs in the browser and calls public HTTPS APIs directly.
- **Designed for scanning:** related information is grouped into focused cards instead of buried in a raw response.
- **Useful in real workflows:** copy values, switch map layers, check a record, and export results without leaving the page.
- **Privacy-minded by design:** this project does not run a private query database or require an application server.

## Built with

- [React 19](https://react.dev/) and [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) with [Tailwind CSS](https://tailwindcss.com/)
- [Leaflet](https://leafletjs.com/) for interactive maps
- [Lucide](https://lucide.dev/) for interface icons
- Public DNS-over-HTTPS services from [Google](https://dns.google/) and [Cloudflare](https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/)
- GitHub Actions and GitHub Pages for continuous deployment

## Run locally

### Requirements

- Node.js 20 or newer
- npm 10 or newer

```bash
git clone https://github.com/ashraf-dev71/chack-host.git
cd chack-host
npm install
npm run dev
```

The development server runs at [http://localhost:3000](http://localhost:3000).

### Production checks

```bash
npm run lint   # TypeScript check
npm run build  # Production bundle in dist/
npm run preview
```

## Project map

```text
src/
├── components/       Dashboard cards, search, map, navigation, and modals
├── services/         IP, DNS, geolocation, edge, and latency integrations
├── App.tsx           Main dashboard composition
├── index.css         Application and Leaflet styles
└── types.ts          Shared data models

.github/workflows/
└── deploy.yml        GitHub Pages build and deployment workflow
```

## Deployment

Pushes to `main` automatically run the workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). The workflow installs dependencies, runs the Vite production build, uploads `dist/`, and deploys it to GitHub Pages.

The production site uses the custom domain [chack-host.bdhyperashraf71.me](https://chack-host.bdhyperashraf71.me/), configured through [`public/CNAME`](public/CNAME).

## Data and privacy

CheckHost is a diagnostic interface, not a guarantee of ownership, safety, or availability. Results depend on the public services and third-party APIs used at request time. Do not use the tool to submit secrets, private hostnames, credentials, or sensitive internal network information.

## License

Released under the [MIT License](LICENSE).
