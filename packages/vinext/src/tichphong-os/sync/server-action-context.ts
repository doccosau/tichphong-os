import { AsyncLocalStorage } from "node:async_hooks";
import type { KernelEvent } from "../core/types.js";

/**
 * Server-only context for capturing TichPhong OS Kernel Events
 * emitted during a React Server Action.
 */
export const serverActionSyncStorage = new AsyncLocalStorage<KernelEvent[]>();

export function getPendingServerActionEvents(): KernelEvent[] {
    return serverActionSyncStorage.getStore() || [];
}

export function addServerActionEvent(event: KernelEvent): void {
    const store = serverActionSyncStorage.getStore();
    if (store) {
        store.push(event);
    }
}
