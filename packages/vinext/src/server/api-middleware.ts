/**
 * vinext/server/api-middleware — Composable API middleware pipeline
 *
 * Provides a framework-level middleware system for API routes.
 * Middlewares are composable functions that wrap handlers.
 *
 * Usage:
 *   import { compose, withCors, withRateLimit, withAuth, withValidation } from "vinext/server/api-middleware";
 *   export default compose(withCors(), withRateLimit(), withAuth(), handler);
 */

/** Standard API handler signature. */
export type ApiHandler = (request: Request, context?: ApiContext) => Promise<Response> | Response;

/** Context passed to handlers through the middleware pipeline. */
export interface ApiContext {
    /** Parsed request params (from URL pattern) */
    params?: Record<string, string>;
    /** Authenticated user (set by withAuth) */
    user?: { id: string; role?: string;[key: string]: unknown };
    /** Additional metadata added by middlewares */
    meta?: Record<string, unknown>;
}

/** Middleware function that wraps a handler. */
export type Middleware = (handler: ApiHandler) => ApiHandler;

// ─── compose ──────────────────────────────────────────────────────────────────

/**
 * Compose multiple middlewares into a single handler.
 * Middlewares execute left-to-right (outermost first).
 *
 * @example
 *   compose(withCors(), withAuth(), handler)
 *   // Execution order: CORS → Auth → handler
 */
export function compose(...fns: (Middleware | ApiHandler)[]): ApiHandler {
    const handler = fns.pop() as ApiHandler;
    if (!handler) throw new Error("compose requires at least one handler");

    const middlewares = fns as Middleware[];
    return middlewares.reduceRight(
        (next, middleware) => middleware(next),
        handler,
    );
}

// ─── withCors ─────────────────────────────────────────────────────────────────

export interface CorsOptions {
    /** Allowed origins (default: "*") */
    origin?: string | string[] | ((origin: string) => boolean);
    /** Allowed methods */
    methods?: string[];
    /** Allowed headers */
    allowedHeaders?: string[];
    /** Exposed headers */
    exposedHeaders?: string[];
    /** Allow credentials */
    credentials?: boolean;
    /** Max age for preflight cache (seconds) */
    maxAge?: number;
}

/**
 * CORS middleware. Handles preflight (OPTIONS) requests and adds
 * appropriate headers to all responses.
 */
export function withCors(options: CorsOptions = {}): Middleware {
    const {
        origin = "*",
        methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders = ["Content-Type", "Authorization", "X-Requested-With"],
        exposedHeaders = [],
        credentials = false,
        maxAge = 86400,
    } = options;

    function resolveOrigin(requestOrigin: string | null): string {
        if (typeof origin === "string") return origin;
        if (Array.isArray(origin)) {
            return requestOrigin && origin.includes(requestOrigin) ? requestOrigin : origin[0];
        }
        if (typeof origin === "function") {
            return requestOrigin && origin(requestOrigin) ? requestOrigin : "";
        }
        return "*";
    }

    return (handler: ApiHandler): ApiHandler => {
        return async (request, context) => {
            const requestOrigin = request.headers.get("Origin");
            const corsHeaders: Record<string, string> = {
                "Access-Control-Allow-Origin": resolveOrigin(requestOrigin),
                "Access-Control-Allow-Methods": methods.join(", "),
                "Access-Control-Allow-Headers": allowedHeaders.join(", "),
            };
            if (exposedHeaders.length) corsHeaders["Access-Control-Expose-Headers"] = exposedHeaders.join(", ");
            if (credentials) corsHeaders["Access-Control-Allow-Credentials"] = "true";
            if (maxAge) corsHeaders["Access-Control-Max-Age"] = String(maxAge);

            // Handle preflight
            if (request.method === "OPTIONS") {
                return new Response(null, { status: 204, headers: corsHeaders });
            }

            const response = await handler(request, context);
            const newHeaders = new Headers(response.headers);
            for (const [k, v] of Object.entries(corsHeaders)) {
                newHeaders.set(k, v);
            }
            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: newHeaders,
            });
        };
    };
}

// ─── withRateLimit ────────────────────────────────────────────────────────────

export interface ApiRateLimitOptions {
    /** Max requests per window */
    maxRequests?: number;
    /** Window in seconds */
    windowSeconds?: number;
    /** Key extractor (default: IP-based) */
    keyExtractor?: (request: Request) => string;
}

/**
 * Rate limiting middleware for API routes.
 * Uses a simple in-memory token bucket.
 */
export function withRateLimit(options: ApiRateLimitOptions = {}): Middleware {
    const {
        maxRequests = 60,
        windowSeconds = 60,
        keyExtractor = (req) => req.headers.get("CF-Connecting-IP") ?? req.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ?? "unknown",
    } = options;

    const buckets = new Map<string, { tokens: number; lastRefill: number }>();

    return (handler: ApiHandler): ApiHandler => {
        return async (request, context) => {
            const key = keyExtractor(request);
            const now = Date.now();
            let bucket = buckets.get(key);

            if (!bucket || now - bucket.lastRefill >= windowSeconds * 1000) {
                bucket = { tokens: maxRequests - 1, lastRefill: now };
                buckets.set(key, bucket);
                return handler(request, context);
            }

            if (bucket.tokens > 0) {
                bucket.tokens--;
                return handler(request, context);
            }

            const retryAfter = Math.ceil((windowSeconds * 1000 - (now - bucket.lastRefill)) / 1000);
            return new Response(JSON.stringify({ error: "Too many requests" }), {
                status: 429,
                headers: {
                    "Content-Type": "application/json",
                    "Retry-After": String(retryAfter),
                },
            });
        };
    };
}

// ─── withAuth ─────────────────────────────────────────────────────────────────

export interface AuthOptions {
    /** Token verification function */
    verify: (token: string) => Promise<{ id: string; role?: string;[key: string]: unknown } | null>;
    /** Header to extract token from (default: "Authorization") */
    header?: string;
    /** Token prefix to strip (default: "Bearer ") */
    prefix?: string;
    /** Paths that don't require auth (glob patterns) */
    publicPaths?: string[];
}

/**
 * Authentication middleware.
 * Extracts a token from the Authorization header and verifies it.
 */
export function withAuth(options: AuthOptions): Middleware {
    const {
        verify,
        header = "Authorization",
        prefix = "Bearer ",
    } = options;

    return (handler: ApiHandler): ApiHandler => {
        return async (request, context) => {
            const authHeader = request.headers.get(header);
            if (!authHeader || !authHeader.startsWith(prefix)) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), {
                    status: 401,
                    headers: { "Content-Type": "application/json" },
                });
            }

            const token = authHeader.slice(prefix.length);
            const user = await verify(token);
            if (!user) {
                return new Response(JSON.stringify({ error: "Invalid token" }), {
                    status: 401,
                    headers: { "Content-Type": "application/json" },
                });
            }

            const ctx: ApiContext = { ...context, user };
            return handler(request, ctx);
        };
    };
}

// ─── withValidation ───────────────────────────────────────────────────────────

export interface ValidationSchema {
    /** Validate the request body. Return null/undefined for valid, string for error. */
    body?: (data: unknown) => string | null | undefined;
    /** Validate query parameters. */
    query?: (params: URLSearchParams) => string | null | undefined;
}

/**
 * Request validation middleware.
 * Validates body and/or query params before passing to handler.
 */
export function withValidation(schema: ValidationSchema): Middleware {
    return (handler: ApiHandler): ApiHandler => {
        return async (request, context) => {
            // Validate query
            if (schema.query) {
                const url = new URL(request.url);
                const error = schema.query(url.searchParams);
                if (error) {
                    return new Response(JSON.stringify({ error, field: "query" }), {
                        status: 400,
                        headers: { "Content-Type": "application/json" },
                    });
                }
            }

            // Validate body (only for methods with body)
            if (schema.body && ["POST", "PUT", "PATCH"].includes(request.method)) {
                try {
                    const body = await request.clone().json();
                    const error = schema.body(body);
                    if (error) {
                        return new Response(JSON.stringify({ error, field: "body" }), {
                            status: 400,
                            headers: { "Content-Type": "application/json" },
                        });
                    }
                } catch {
                    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
                        status: 400,
                        headers: { "Content-Type": "application/json" },
                    });
                }
            }

            return handler(request, context);
        };
    };
}

// ─── withLogging ──────────────────────────────────────────────────────────────

/**
 * Logging middleware. Logs request method, path, status, and duration.
 */
export function withLogging(): Middleware {
    return (handler: ApiHandler): ApiHandler => {
        return async (request, context) => {
            const start = Date.now();
            const url = new URL(request.url);
            try {
                const response = await handler(request, context);
                const duration = Date.now() - start;
                console.log(`[API] ${request.method} ${url.pathname} → ${response.status} (${duration}ms)`);
                return response;
            } catch (e) {
                const duration = Date.now() - start;
                console.error(`[API] ${request.method} ${url.pathname} → 500 (${duration}ms)`, e);
                throw e;
            }
        };
    };
}
