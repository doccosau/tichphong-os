# TichPhong OS Architecture 🌀

**TichPhong OS** is an advanced, proprietary Agentic Cloud-Native Framework developed by **Thiên Sơn (Tịch Phong)**. It represents the perfect harmonization of modern frontend architecture and edge-native backend computing.

By seamlessly weaving together the React Server Components (RSC) capabilities of Next.js (via the experimental `vinext` engine) and a highly robust, event-driven System Kernel over Cloudflare Workers, TichPhong OS establishes a new paradigm for building ultra-fast, highly scalable Web Applications.

---

## 🏛 The Four Pillars of TichPhong OS

### 1. The Vinext Engine (Frontend Core)
At the base of the presentation layer lies **Vinext**, an experimental Vite plugin that reimagines the Next.js API surface (App Router, SSR, Server Actions) on top of Rollup. It provides:
- Lightning-fast development server with HMR.
- Native `cdn-cgi/image` resizing bindings natively optimized for Cloudflare Edge.
- Zero-dependency RSC multi-environment builds resolving instantly to Cloudflare Workers.

### 2. TichPhong System Kernel (Central Brain)
Unlike traditional monolithic apps, TichPhong OS is driven by the `TichPhongSystemKernel`.
- An **Event Envelope** architecture (`KernelEvent`) ensuring every action is trackable and reversible.
- A **Hook Registry** and **Plugin Manifest** system, enabling fully decoupled Modules to register routes, admin interfaces, and database schemas dynamically at runtime.

### 3. Native Edge SyncManager (Data Synchronization)
A flawless pipeline that bridges the Client and the Edge. 
- Integrated **Idempotency** and Consistency Control tailored for Cloudflare D1.
- Offline-first cache adaptations (via Dexie L1 Cache) automatically syncing up via WebSocket / Background Fetch.
- Smart conflict resolution, protecting `sequence` state.

### 4. Living Module Architecture
TichPhong OS is not just a library; it's a living ecosystem. The `src/tichphong-os/modules` directory contains fully functional, "living documentation" examples migrated from real-world applications (like the Nhac Quan v7.0 `music`, `system`, and `community` modules) demonstrating the exact pattern of combining Store (Zustand) + Kernel Logic + Edge Syncing.

---

## 🚀 Quick Start (Development)

### Requirements
- Node.js >= 18
- `pnpm` or `npm`
- Cloudflare Wrangler CLI configured

### Installation

```bash
# Install dependencies
npm install

# Start the TichPhong OS Environment (Vinext Dev Server)
npm run dev
```

### Deployment

To deploy directly to Cloudflare Workers:
```bash
npm run deploy
```
*Note: Due to the integration of Native Cloudflare Bindings (D1, KV, R2), local development will automatically simulate these environments via Miniflare.*

---

## 🛠 Project Structure

```text
tichphong-novel/
├── package.json
├── tsconfig.json
└── packages/
    └── vinext/
        ├── src/
        │   ├── index.ts                  # Gateway merging Vinext & TichPhong OS API
        │   ├── routing/                  # Next.js App Router emulation Engine
        │   ├── server/                   # Edge Dev/Prod Request Handlers
        │   │
        │   ├── tichphong/                # 🌀 TICHPHONG OS KERNEL
        │   │   ├── core/                 # Abstract classes (Module, Kernel, Driver, Store)
        │   │   ├── drivers/              # Hardware/Network specific adapters (RT Driver)
        │   │   └── server/               # D1 Sync Manager backend logic
        │   │
        │   └── tichphong-os/             # 🏢 TICHPHONG OS APPLICATION & MODULES
        │       ├── legacy/               # Base utilities / Types Mocks
        │       ├── sync/                 # Frontend Sync Instance
        │       └── modules/              # Sub-App Manifests (Music, System, Community...)
        └── ...
```

---

## 📜 License

This project architecture, including the **TichPhong OS Core Components**, **SyncManager**, and associated **Module Manifests**, are proprietary innovations of **Thiên Sơn**. 

The underlying `vinext` engine implementations retain their respective open-source licensing (MIT). See [LICENSE](./LICENSE) for details.
