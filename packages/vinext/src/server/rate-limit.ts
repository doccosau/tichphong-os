/**
 * Simple in-memory rate limiter for the image optimization endpoint.
 *
 * Uses a token bucket algorithm per IP address to prevent abuse.
 * Configurable via environment variables:
 *   VINEXT_IMAGE_RATE_LIMIT  — max requests per window (default: 100)
 *   VINEXT_IMAGE_RATE_WINDOW — window in seconds (default: 60)
 */

export interface RateLimitConfig {
    /** Maximum number of requests per window. */
    maxRequests: number;
    /** Window duration in milliseconds. */
    windowMs: number;
}

interface BucketEntry {
    tokens: number;
    lastRefill: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
    maxRequests: parseInt(process.env.VINEXT_IMAGE_RATE_LIMIT || "100", 10),
    windowMs: parseInt(process.env.VINEXT_IMAGE_RATE_WINDOW || "60", 10) * 1000,
};

/** Map of IP → bucket entry */
const buckets = new Map<string, BucketEntry>();

/** Cleanup interval to prevent unbounded memory growth. */
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start the cleanup timer if not already running.
 * Removes stale entries older than 2x the window.
 */
function ensureCleanup(config: RateLimitConfig): void {
    if (cleanupTimer) return;
    cleanupTimer = setInterval(() => {
        const now = Date.now();
        const staleThreshold = config.windowMs * 2;
        for (const [ip, entry] of buckets) {
            if (now - entry.lastRefill > staleThreshold) {
                buckets.delete(ip);
            }
        }
    }, config.windowMs).unref();
}

/**
 * Check if a request from the given IP is within the rate limit.
 * Returns true if allowed, false if rate-limited.
 */
export function checkRateLimit(
    ip: string,
    config: RateLimitConfig = DEFAULT_CONFIG,
): { allowed: boolean; remaining: number; retryAfterMs: number } {
    ensureCleanup(config);

    const now = Date.now();
    let entry = buckets.get(ip);

    if (!entry) {
        entry = { tokens: config.maxRequests - 1, lastRefill: now };
        buckets.set(ip, entry);
        return { allowed: true, remaining: entry.tokens, retryAfterMs: 0 };
    }

    // Refill tokens based on elapsed time
    const elapsed = now - entry.lastRefill;
    if (elapsed >= config.windowMs) {
        // Full window elapsed — reset
        entry.tokens = config.maxRequests - 1;
        entry.lastRefill = now;
        return { allowed: true, remaining: entry.tokens, retryAfterMs: 0 };
    }

    if (entry.tokens > 0) {
        entry.tokens--;
        return { allowed: true, remaining: entry.tokens, retryAfterMs: 0 };
    }

    // Rate limited
    const retryAfterMs = config.windowMs - elapsed;
    return { allowed: false, remaining: 0, retryAfterMs };
}

/**
 * Extract client IP from a request, supporting X-Forwarded-For
 * and CF-Connecting-IP (Cloudflare).
 */
export function getClientIP(headers: Record<string, string | string[] | undefined>): string {
    // Cloudflare-specific header (most reliable when behind CF)
    const cfIp = headers["cf-connecting-ip"];
    if (cfIp) return String(cfIp).split(",")[0].trim();

    // Standard proxy header
    const xff = headers["x-forwarded-for"];
    if (xff) return String(xff).split(",")[0].trim();

    // Fallback
    return "unknown";
}

/** Reset all rate limit state (for testing). */
export function resetRateLimits(): void {
    buckets.clear();
    if (cleanupTimer) {
        clearInterval(cleanupTimer);
        cleanupTimer = null;
    }
}
