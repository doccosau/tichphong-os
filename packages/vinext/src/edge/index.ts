/**
 * vinext/edge — Edge Runtime support module
 *
 * Provides utilities for running API routes and middleware on edge runtimes
 * (Cloudflare Workers, Deno Deploy, Vercel Edge).
 *
 * In Vinext, edge runtime detection is automatic — when deployed to
 * Cloudflare Workers, routes are already running on the edge. This module
 * provides explicit annotations and helpers for edge-specific features.
 *
 * Usage:
 *   import { EdgeRuntime, createEdgeHandler, detectRuntime } from "vinext/edge";
 */

/** Supported runtime environments */
export type RuntimeEnvironment = "node" | "edge" | "workerd" | "deno" | "bun" | "unknown";

/**
 * Detect the current runtime environment.
 */
export function detectRuntime(): RuntimeEnvironment {
    // Cloudflare Workers
    if (typeof (globalThis as any).caches !== "undefined" && typeof (globalThis as any).HTMLRewriter !== "undefined") {
        return "workerd";
    }
    // Deno
    if (typeof (globalThis as any).Deno !== "undefined") {
        return "deno";
    }
    // Bun
    if (typeof (globalThis as any).Bun !== "undefined") {
        return "bun";
    }
    // Node.js
    if (typeof process !== "undefined" && process.versions?.node) {
        return "node";
    }
    // Generic edge (Web APIs available)
    if (typeof (globalThis as any).addEventListener === "function" &&
        typeof (globalThis as any).Response !== "undefined") {
        return "edge";
    }
    return "unknown";
}

/**
 * Runtime capabilities based on the detected environment.
 */
export interface RuntimeCapabilities {
    /** Whether the runtime supports Node.js APIs (fs, path, etc.) */
    nodeAPIs: boolean;
    /** Whether the runtime supports Web Crypto API */
    webCrypto: boolean;
    /** Whether the runtime supports Web Streams */
    webStreams: boolean;
    /** Whether the runtime supports dynamic import */
    dynamicImport: boolean;
    /** Maximum execution time (ms), 0 = unlimited */
    maxExecutionTime: number;
    /** Maximum memory (MB), 0 = unlimited */
    maxMemory: number;
}

/**
 * Get capabilities for the current or specified runtime.
 */
export function getRuntimeCapabilities(runtime?: RuntimeEnvironment): RuntimeCapabilities {
    const rt = runtime ?? detectRuntime();

    switch (rt) {
        case "node":
            return {
                nodeAPIs: true,
                webCrypto: true,
                webStreams: true,
                dynamicImport: true,
                maxExecutionTime: 0,
                maxMemory: 0,
            };
        case "workerd":
            return {
                nodeAPIs: false,
                webCrypto: true,
                webStreams: true,
                dynamicImport: true,
                maxExecutionTime: 30_000,
                maxMemory: 128,
            };
        case "deno":
            return {
                nodeAPIs: true, // via compat layer
                webCrypto: true,
                webStreams: true,
                dynamicImport: true,
                maxExecutionTime: 0,
                maxMemory: 0,
            };
        case "bun":
            return {
                nodeAPIs: true,
                webCrypto: true,
                webStreams: true,
                dynamicImport: true,
                maxExecutionTime: 0,
                maxMemory: 0,
            };
        default:
            return {
                nodeAPIs: false,
                webCrypto: typeof crypto !== "undefined",
                webStreams: typeof ReadableStream !== "undefined",
                dynamicImport: true,
                maxExecutionTime: 30_000,
                maxMemory: 128,
            };
    }
}

/** Edge handler type — standard Web API signature */
export type EdgeHandler = (request: Request, env?: Record<string, unknown>) => Promise<Response> | Response;

/**
 * Create an edge-compatible handler with automatic runtime detection
 * and error handling.
 */
export function createEdgeHandler(handler: EdgeHandler): EdgeHandler {
    return async (request: Request, env?: Record<string, unknown>) => {
        const runtime = detectRuntime();
        const capabilities = getRuntimeCapabilities(runtime);

        try {
            // Apply execution time limit for constrained runtimes
            if (capabilities.maxExecutionTime > 0) {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), capabilities.maxExecutionTime);

                try {
                    const response = await handler(request, env);
                    clearTimeout(timeout);
                    // Add runtime info header
                    const headers = new Headers(response.headers);
                    headers.set("X-Runtime", runtime);
                    return new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers,
                    });
                } catch (e) {
                    clearTimeout(timeout);
                    throw e;
                }
            }

            const response = await handler(request, env);
            const headers = new Headers(response.headers);
            headers.set("X-Runtime", runtime);
            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers,
            });
        } catch (error) {
            console.error(`[Edge Runtime] Error in ${runtime}:`, error);
            return new Response(
                JSON.stringify({ error: "Internal Server Error", runtime }),
                { status: 500, headers: { "Content-Type": "application/json" } },
            );
        }
    };
}

/**
 * Route configuration for edge runtime annotation.
 * Use in route files to opt into edge runtime.
 *
 * @example
 *   export const config = edgeConfig({ regions: ["iad1", "sfo1"] });
 */
export function edgeConfig(options: {
    /** Preferred edge regions */
    regions?: string[];
    /** Maximum execution duration (seconds) */
    maxDuration?: number;
} = {}): { runtime: "edge"; regions?: string[]; maxDuration?: number } {
    return {
        runtime: "edge",
        ...options,
    };
}
