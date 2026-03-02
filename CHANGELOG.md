# Changelog

## [0.1.0] — 2026-03-02

### 🚀 New Framework Modules

- **SEO Module** (`vinext/seo`) — Auto-generate `sitemap.xml`, `robots.txt`, and Open Graph/Twitter Card meta tags from configuration
- **Security Headers** (`vinext/server/security-headers`) — Production-ready security headers: HSTS, CSP, X-Frame-Options, Permissions-Policy, Referrer-Policy, COOP/COEP
- **API Middleware Pipeline** (`vinext/server/api-middleware`) — Composable middleware system: `compose()`, `withCors()`, `withAuth()`, `withRateLimit()`, `withValidation()`, `withLogging()`
- **PWA Module** (`vinext/pwa`) — Generate `manifest.json` and Service Worker with 3 caching strategies (Cache-First, Network-First, Stale-While-Revalidate)
- **Admin Dashboard** (`vinext/admin`) — Built-in `/_admin` endpoint with real-time metrics visualization, dark theme UI, auto-refresh
- **Bundle Analyzer** — New `vinext analyze` CLI command for bundle size analysis with optimization suggestions

### 🛡️ Production Server Hardening

- **Graceful Shutdown** — SIGTERM/SIGINT handlers with connection draining (10s force kill)
- **Health Check** — `/_health` endpoint returning JSON status, uptime, memory usage
- **Request Timeout** — 30s default protection (configurable via `VINEXT_REQUEST_TIMEOUT`)
- **Rate Limiting** — Token bucket per-IP rate limiter on image optimization endpoint (configurable via `VINEXT_IMAGE_RATE_LIMIT`)
- **Metrics Collector** — Request count, error rate, p95/p99 latency, status breakdown, top 10 paths, memory tracking
- **`/_metrics` Endpoint** — JSON API for monitoring metrics
- **Security Headers** — Auto-applied to all dynamic responses (HSTS, CSP, X-Frame-Options, etc.)

### 🌐 Auto-Serve Endpoints

| Endpoint | Description |
|----------|-------------|
| `/_health` | Server health status |
| `/_metrics` | Real-time metrics (JSON) |
| `/_admin` | Admin dashboard (HTML) |
| `/sitemap.xml` | Auto-generated sitemap |
| `/robots.txt` | Auto-generated robots.txt |
| `/manifest.json` | PWA manifest |
| `/sw.js` | Service worker |

### 📦 Package Exports

Added 8 new package exports:
- `vinext/seo`, `vinext/seo/*`
- `vinext/pwa`
- `vinext/server/api-middleware`
- `vinext/server/security-headers`
- `vinext/server/rate-limit`
- `vinext/admin`
- `vinext/utils/logger`

### ✅ Testing

- Test coverage increased from **11 tests (3 files)** to **147 tests (16 files)** — 13.4x improvement
- New test files: `image-optimization`, `deploy`, `prod-server-utils`, `navigation`, `metrics`, `rate-limit`, `cache`, `logger`, `router`, `seo`, `security-headers`, `api-middleware`, `pwa`

### 🔧 Utilities

- **Structured Logger** (`vinext/utils/logger`) — Colored dev output, JSON production output, configurable log levels

## [0.0.5] — Previous Release

Initial release with core functionality: Vite plugin, App Router/Pages Router support, Cloudflare Workers deployment, TichPhong OS integration.
