/**
 * Tests for server/rate-limit.ts
 */
import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, getClientIP, resetRateLimits, type RateLimitConfig } from "../src/server/rate-limit.js";

describe("checkRateLimit", () => {
    const config: RateLimitConfig = { maxRequests: 3, windowMs: 60_000 };

    beforeEach(() => {
        resetRateLimits();
    });

    it("should allow first request", () => {
        const result = checkRateLimit("192.168.1.1", config);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(2);
    });

    it("should decrement remaining tokens", () => {
        checkRateLimit("192.168.1.1", config);
        const result = checkRateLimit("192.168.1.1", config);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(1);
    });

    it("should block after max requests", () => {
        checkRateLimit("192.168.1.1", config);
        checkRateLimit("192.168.1.1", config);
        checkRateLimit("192.168.1.1", config);
        const result = checkRateLimit("192.168.1.1", config);
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
        expect(result.retryAfterMs).toBeGreaterThan(0);
    });

    it("should track IPs independently", () => {
        checkRateLimit("192.168.1.1", config);
        checkRateLimit("192.168.1.1", config);
        checkRateLimit("192.168.1.1", config);

        const result = checkRateLimit("192.168.1.2", config);
        expect(result.allowed).toBe(true);
    });
});

describe("getClientIP", () => {
    it("should prefer CF-Connecting-IP", () => {
        expect(getClientIP({
            "cf-connecting-ip": "1.2.3.4",
            "x-forwarded-for": "5.6.7.8",
        })).toBe("1.2.3.4");
    });

    it("should use X-Forwarded-For when no CF header", () => {
        expect(getClientIP({ "x-forwarded-for": "5.6.7.8, 9.10.11.12" })).toBe("5.6.7.8");
    });

    it("should return 'unknown' when no headers", () => {
        expect(getClientIP({})).toBe("unknown");
    });
});
