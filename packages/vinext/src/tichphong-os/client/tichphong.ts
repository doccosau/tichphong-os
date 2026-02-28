/**
 * TichPhong OS - Client Gateway API
 * Export các chức năng hoạt động trên Browser/React.
 */
export { createTichPhongStore } from './tichphong-store.js';
export { TichPhongLocalDB, tposDB } from './tichphong-db.js';
export { useTichPhongSync, type SyncSession } from './use-tichphong-sync.js';
