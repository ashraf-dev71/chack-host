# CheckHost – Web‑Based Host, Domain & IP Intelligence  

**CheckHost** is a high-performance, lightweight, client‑side web application that instantly gathers intelligence for domain names, hostnames, IPv4, and IPv6 addresses. Built for network engineers, developers, sysadmins, security researchers, and students who need fast, accurate network diagnostics without maintaining a backend server.

---

## 🚀 Live Demo

**▶️ Visit:** [https://chack-host.bdhyperashraf71.me/](https://chack-host.bdhyperashraf71.me/)

---

## ✨ Features

| Feature | Description |
|---|---|
| **Domain & DNS Inspector** | Resolves full DNS records: **A (IPv4)**, **AAAA (IPv6)**, **MX (Mail servers with priorities)**, **NS (Nameservers)**, **TXT (SPF/verification)**, and **CNAME** via Google DoH. |
| **1-Click Zone Export** | Copy individual DNS records or export a formatted BIND-style DNS zone file in a single click. |
| **Live Host Ping & HTTP Probe** | Real-time round-trip latency (ping ms) and HTTP/HTTPS status probe. |
| **Interactive Geolocation Map** | High-precision Leaflet map with 3 switchable tile layers: **CartoDB Voyager**, **OpenStreetMap Standard**, and **ESRI World Satellite Imagery**. Includes GPS coordinate copy & pin centering. |
| **Reverse DNS (PTR)** | Automatically resolves PTR hostname records for queried IP addresses. |
| **Network & ASN Intelligence** | Identifies ISP, Autonomous System Number (ASN), organization, routing domain, and CIDR notation. |
| **Security Threat Flags** | Detects known Proxy, VPN, Tor exit nodes, and datacenter/cloud hosting ranges. |
| **Cloudflare Edge Diagnostics** | Reads Cloudflare Edge headers, colo airport code (IATA), TLS cipher, HTTP protocol version, and WARP status. |
| **Client Diagnostics** | Displays local client IP, browser engine, operating system, and network interface metrics. |
| **Zero Backend Required** | 100% client-side queries against secure public HTTPS APIs. Privacy-focused; no personal query data is logged. |

---

## 🛠️ Tech Stack

- **Framework:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite 6](https://vitejs.dev/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Mapping:** [Leaflet](https://leafletjs.com/) + OpenStreetMap / CartoDB / Esri Satellite
- **Icons:** [Lucide React](https://lucide.dev/)
- **DNS Resolution:** Google Public DNS-over-HTTPS (`dns.google`) & Cloudflare 1.1.1.1 DoH
- **Deployment:** GitHub Pages / Cloudflare Pages / Static Hosting

---

## 📦 Getting Started

### Prerequisites

- **Node.js**: v20+
- **npm**: v10+

### Installation & Local Run

```bash
# 1. Clone the repository
git clone https://github.com/bdhyperashraf71/checkhost.git
cd checkhost

# 2. Install dependencies
npm install

# 3. Start development server (runs on 0.0.0.0:3000)
npm run dev

# 4. Build for production (outputs to dist/)
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```text
checkhost/
├── .github/
│   └── workflows/
│       └── deploy.yml        # Automatic GitHub Pages CI/CD workflow
├── docs/                     # Static bundle for GitHub Pages (/docs option)
│   ├── index.html
│   ├── script.js
│   ├── style.css
│   └── CNAME
├── public/
│   └── CNAME                 # Custom domain configuration for GitHub Pages
├── src/
│   ├── components/
│   │   ├── CloudflareEdgeCard.tsx     # Cloudflare edge trace & colo diagnostics
│   │   ├── DeviceDiagnosticsCard.tsx  # Browser & OS device detection
│   │   ├── DomainDNSCard.tsx          # Comprehensive DNS explorer (A, AAAA, MX, NS, TXT, CNAME)
│   │   ├── GeolocationDetails.tsx     # City, region, postal, timezone details
│   │   ├── InteractiveMap.tsx         # Leaflet map with multi-layer controls
│   │   ├── MainIPCard.tsx             # Primary hero IP/Domain inspection card
│   │   ├── Navbar.tsx                 # Top branding & latency meter
│   │   ├── NetworkDetails.tsx         # ASN, ISP, Security & Proxy detection
│   │   ├── RawJsonModal.tsx           # Exportable JSON data modal
│   │   └── SearchHeader.tsx           # Search input with history & presets
│   ├── services/
│   │   └── ipService.ts      # DoH, reverse DNS, geolocation & latency tests
│   ├── types.ts              # TypeScript data models and interfaces
│   ├── App.tsx               # Main application container
│   ├── main.tsx              # React DOM entry point
│   └── index.css             # Tailwind CSS & Leaflet custom styling
├── index.html                # HTML entry point
├── package.json              # Dependencies and build scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite bundler configuration
└── LICENSE                   # MIT License
```

---

## 🌐 Deploying to GitHub Pages

This repository is pre-configured for GitHub Pages:

1. **Option A: GitHub Actions (Recommended)**  
   - Go to your repository **Settings** → **Pages** → **Build and deployment**.
   - Select **GitHub Actions** as the Source.
   - Every push to `main` will automatically build and deploy the app.

2. **Option B: Deploy from `/docs` folder**  
   - Go to **Settings** → **Pages** → **Source** → select `Deploy from a branch`.
   - Choose `main` branch and select `/docs` folder.
   - Save.

The `CNAME` file is included in both `public/` and `docs/` for `chack-host.bdhyperashraf71.me`.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE) – feel free to use, modify, and distribute.
