/**
 * Server-only Cloudflare context backed by AsyncLocalStorage.
 * 
 * Provides access to the Cloudflare Worker `env` (bindings like D1, KV, R2)
 * and `ctx` (e.g. `waitUntil`) anywhere in the React Server Component tree
 * or API routes during both development and production.
 */
import { AsyncLocalStorage } from "node:async_hooks";

export interface CloudflareContext {
    env: Record<string, any>;
    ctx?: {
        waitUntil(promise: Promise<any>): void;
        passThroughOnException(): void;
    };
}

// Store the ALS instance on globalThis to prevent multiple instances from being
// tracking isolation during hot-reloads and multi-environment setup.
const _g = globalThis as any;
const _ALS_KEY = Symbol.for("vinext.cloudflare_contextALS");

const _als = (_g[_ALS_KEY] ??= new AsyncLocalStorage<CloudflareContext>()) as AsyncLocalStorage<CloudflareContext>;

/**
 * Access the Cloudflare environment bindings and execution context for the current request.
 * MUST be called from a React Server Component, API Route, or during SSR.
 * 
 * Returns `{ env, ctx }`. If called outside a request context, it warns and returns empty objects.
 */
export function getCloudflareContext(): CloudflareContext {
    const store = _als.getStore();
    if (!store) {
        if (process.env.NODE_ENV !== "production") {
            console.warn(
                "⚠️ [\x1b[36mTichPhong OS\x1b[0m] getCloudflareContext() was called outside the request scope.",
                "Ensure you are calling it inside a Server Component or API handler."
            );
        }
        return { env: {} };
    }
    return store;
}

/**
 * Executes a callback within the provided Cloudflare context.
 * Used internally by Vinext routing logic.
 */
export function runWithCloudflareContext<T>(
    context: CloudflareContext,
    callback: () => T
): T {
    return _als.run(context, callback);
}
