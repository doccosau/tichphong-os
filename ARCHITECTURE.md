# Vinext-Clone Architecture

## Tổng Quan Kiến Trúc

```mermaid
graph TB
    subgraph CLI["CLI Layer"]
        CLI_CMD["vinext dev/build/start/deploy"]
    end

    subgraph Core["Core Plugin (index.ts)"]
        VP["Vite Plugin Config"]
        RD["Route Discovery"]
        TR["Code Transforms"]
        BS["Build System"]
    end

    subgraph Server["Server Layer"]
        DS["Dev Server"]
        PS["Prod Server"]
        IO["Image Optimization"]
        RL["Rate Limiter"]
    end

    subgraph Shims["Next.js API Shims (36 files)"]
        SH_R["Router/Navigation"]
        SH_C["Cache/Headers"]
        SH_I["Image/Link/Script"]
        SH_F["Font (Google/Local)"]
    end

    subgraph Config["Config Layer"]
        NC["next-config.ts"]
        CM["config-matchers.ts"]
        DE["dotenv.ts"]
    end

    subgraph TPOS["TichPhong OS"]
        KN["Kernel"]
        AK["Audio Kernel"]
        MU["Music Module"]
        CO["Community Module"]
        SY["System Module"]
        MT["Metrics Collector"]
    end

    subgraph CF["Cloudflare"]
        KV["KV Cache Handler"]
        TPR["TPR Pre-renderer"]
    end

    CLI_CMD --> Core
    Core --> Server
    Core --> Shims
    Core --> Config
    PS --> IO
    PS --> RL
    PS --> MT
    PS --> KV
    KN --> AK
    KN --> MU
    KN --> CO
    KN --> SY
    SY --> MT
```

## Module Overview

| Module | Files | Lines | Description |
|--------|-------|-------|-------------|
| **Core Plugin** | `index.ts` | 3,697 | Vite plugin, route discovery, build config |
| **Server** | 16 files | ~4,500 | Production/dev servers, image optimization, rate limiting |
| **Shims** | 36 files | ~5,000 | Next.js API compatibility layer |
| **Config** | 3 files | ~1,300 | Config resolution, matchers, env loading |
| **TichPhong OS** | 112 files | ~6,000 | Kernel, audio, music, community, system |
| **Cloudflare** | 3 files | ~1,400 | KV cache, TPR pre-renderer |
| **Routing** | 2 files | ~1,500 | App Router + Pages Router discovery |
| **Utils** | 4 files | ~300 | Logger, hash, query, project helpers |

## Request Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Prod Server
    participant RL as Rate Limiter
    participant M as Metrics
    participant H as Health Check
    participant IO as Image Optimizer
    participant RSC as RSC Handler

    C->>S: HTTP Request
    S->>S: Timeout guard (30s)
    S->>S: Path normalization
    
    alt /_health
        S->>H: Health check
        H-->>C: JSON status
    else /_metrics
        S->>M: Get report
        M-->>C: JSON metrics
    else /_vinext/image
        S->>RL: Check rate limit
        alt Rate limited
            RL-->>C: 429 Too Many Requests
        else Allowed
            S->>IO: Parse & serve image
            IO-->>C: Image + CSP headers
        end
    else Static asset
        S-->>C: File from dist/client/
    else Dynamic route
        S->>RSC: handler(Request)
        RSC-->>S: Response
        S->>S: Compress (br/gzip)
        S->>M: Record metrics
        S-->>C: Streamed response
    end
```

## Test Coverage

| Test File | Tests | Module |
|-----------|-------|--------|
| `image-optimization.test.ts` | 26 | Image pipeline |
| `deploy.test.ts` | 12 | Deploy & config generation |
| `prod-server-utils.test.ts` | 11 | Server utilities |
| `navigation.test.ts` | 8 | Navigation context |
| `metrics.test.ts` | 8 | Metrics collector |
| `rate-limit.test.ts` | 7 | Rate limiter |
| `cache.test.ts` | 6 | Memory cache handler |
| `logger.test.ts` | 6 | Structured logger |
| `normalize-path.test.ts` | 5 | Path normalization |
| `router.test.ts` | 6 | Router utilities |
| `config-matchers.test.ts` | 3 | Config pattern matching |
| `kernel.test.ts` | 3 | TichPhong OS kernel |
| **Total** | **101** | |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `VINEXT_REQUEST_TIMEOUT` | `30000` | Request timeout (ms) |
| `VINEXT_IMAGE_RATE_LIMIT` | `100` | Max image requests per window |
| `VINEXT_IMAGE_RATE_WINDOW` | `60` | Rate limit window (seconds) |
| `VINEXT_LOG_LEVEL` | `info` (prod) / `debug` (dev) | Log level |
| `VINEXT_TRUSTED_HOSTS` | — | Comma-separated trusted proxy hosts |
| `VINEXT_TRUST_PROXY` | `0` | Trust X-Forwarded-Proto |
