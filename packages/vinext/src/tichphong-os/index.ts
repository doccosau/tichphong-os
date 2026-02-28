/**
 * TichPhong OS - System API Gateway
 * Giao diện lập trình (API) chính thức của Hệ Điều Hành Tích Phong trên nền Vinext
 */

// Core
export type { KernelEvent, EmitOptions, EventLane, AuthoritySource } from './core/types.js';
export { TichPhongSystemKernel } from './core/kernel.js';
export { TichPhongModule, BaseKernel, BaseDriver, BaseService } from './core/module.js';
export { createTichPhongStore, BaseStore, type TichPhongStoreOptions } from './core/store.js';
export { TichPhongScheduler } from './core/scheduler.js';

// Drivers & Sync
export { TichPhongRealtimeDriver, type RealtimeConfig } from './drivers/realtime-driver.js';
export { TichPhongSyncManager, type SyncManagerOptions, type SyncResult } from './sync/sync-manager.js';

// CMS Engine
export { TichPhongCMSRegistry } from './cms/registry.js';
export type { ModuleManifest, PluginManifest, AdminPageConfig, RouteConfig } from './cms/types.js';

// Client React Bindings
export { createTichPhongStore as createStore } from './client/tichphong-store.js';
export { TichPhongLocalDB, tposDB } from './client/tichphong-db.js';
export { useTichPhongSync, type SyncSession } from './client/use-tichphong-sync.js';
export { TichPhongCMSRouter, useTichPhongAdminMenu } from './react/cms-router.js';
