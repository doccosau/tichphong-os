/**
 * Tests for prod-server utility functions.
 *
 * Covers: negotiateEncoding, sendCompressed behavior, COMPRESSIBLE_TYPES,
 * resolveHost (trusted hosts), COMPRESS_THRESHOLD.
 */
import { describe, it, expect } from "vitest";
import {
    negotiateEncoding,
    COMPRESSIBLE_TYPES,
    COMPRESS_THRESHOLD,
    resolveHost,
    trustedHosts,
    trustProxy,
} from "../src/server/prod-server.js";
import type { IncomingMessage } from "node:http";

// Helper to create a minimal mock IncomingMessage
function mockReq(headers: Record<string, string | undefined> = {}): IncomingMessage {
    return { headers } as unknown as IncomingMessage;
}

describe("negotiateEncoding", () => {
    it("should prefer brotli when available", () => {
        const req = mockReq({ "accept-encoding": "gzip, deflate, br" });
        expect(negotiateEncoding(req)).toBe("br");
    });

    it("should fall back to gzip when no brotli", () => {
        const req = mockReq({ "accept-encoding": "gzip, deflate" });
        expect(negotiateEncoding(req)).toBe("gzip");
    });

    it("should fall back to deflate when no gzip/brotli", () => {
        const req = mockReq({ "accept-encoding": "deflate" });
        expect(negotiateEncoding(req)).toBe("deflate");
    });

    it("should return null when no encoding accepted", () => {
        const req = mockReq({ "accept-encoding": "identity" });
        expect(negotiateEncoding(req)).toBeNull();
    });

    it("should return null when header is missing", () => {
        const req = mockReq({});
        expect(negotiateEncoding(req)).toBeNull();
    });
});

describe("COMPRESSIBLE_TYPES", () => {
    it("should include common text types", () => {
        expect(COMPRESSIBLE_TYPES.has("text/html")).toBe(true);
        expect(COMPRESSIBLE_TYPES.has("text/css")).toBe(true);
        expect(COMPRESSIBLE_TYPES.has("application/javascript")).toBe(true);
        expect(COMPRESSIBLE_TYPES.has("application/json")).toBe(true);
    });

    it("should include SVG", () => {
        expect(COMPRESSIBLE_TYPES.has("image/svg+xml")).toBe(true);
    });

    it("should not include binary image types", () => {
        expect(COMPRESSIBLE_TYPES.has("image/png")).toBeFalsy();
        expect(COMPRESSIBLE_TYPES.has("image/jpeg")).toBeFalsy();
    });
});

describe("COMPRESS_THRESHOLD", () => {
    it("should be a reasonable minimum size", () => {
        expect(COMPRESS_THRESHOLD).toBeGreaterThanOrEqual(512);
        expect(COMPRESS_THRESHOLD).toBeLessThanOrEqual(4096);
    });
});

describe("resolveHost", () => {
    it("should return host header when present", () => {
        const req = mockReq({ host: "example.com" });
        expect(resolveHost(req, "fallback.com")).toBe("example.com");
    });

    it("should return fallback when no host header", () => {
        const req = mockReq({});
        expect(resolveHost(req, "fallback.com:3000")).toBe("fallback.com:3000");
    });
});
