/**
 * Tests for server/image-optimization.ts
 *
 * Covers: parseImageParams, negotiateImageFormat, isSafeImageContentType,
 * handleImageOptimization (SVG blocking, dangerouslyAllowSVG).
 */
import { describe, it, expect } from "vitest";
import {
    parseImageParams,
    negotiateImageFormat,
    isSafeImageContentType,
    IMAGE_CACHE_CONTROL,
    IMAGE_CONTENT_SECURITY_POLICY,
    DEFAULT_DEVICE_SIZES,
    DEFAULT_IMAGE_SIZES,
    handleImageOptimization,
    type ImageHandlers,
} from "../src/server/image-optimization.js";

// ─── parseImageParams ─────────────────────────────────────────────────────────

describe("parseImageParams", () => {
    function makeUrl(params: string): URL {
        return new URL(`http://localhost/_vinext/image?${params}`);
    }

    it("should parse valid params", () => {
        const result = parseImageParams(makeUrl("url=/img/hero.jpg&w=640&q=80"));
        expect(result).toEqual({ imageUrl: "/img/hero.jpg", width: 640, quality: 80 });
    });

    it("should default quality to 75 and width to 0", () => {
        const result = parseImageParams(makeUrl("url=/img/hero.jpg"));
        expect(result).toEqual({ imageUrl: "/img/hero.jpg", width: 0, quality: 75 });
    });

    it("should return null when url is missing", () => {
        expect(parseImageParams(makeUrl("w=640&q=80"))).toBeNull();
    });

    it("should reject absolute URLs", () => {
        expect(parseImageParams(makeUrl("url=https://evil.com/hack.jpg&w=640"))).toBeNull();
    });

    it("should reject protocol-relative URLs", () => {
        expect(parseImageParams(makeUrl("url=//evil.com/hack.jpg&w=640"))).toBeNull();
    });

    it("should reject backslash-escaped URLs", () => {
        expect(parseImageParams(makeUrl("url=/\\evil.com/hack.jpg&w=640"))).toBeNull();
    });

    it("should reject width above ABSOLUTE_MAX_WIDTH (3840)", () => {
        expect(parseImageParams(makeUrl("url=/img/hero.jpg&w=5000"))).toBeNull();
    });

    it("should reject negative width", () => {
        expect(parseImageParams(makeUrl("url=/img/hero.jpg&w=-1"))).toBeNull();
    });

    it("should reject quality outside 1-100", () => {
        expect(parseImageParams(makeUrl("url=/img/hero.jpg&w=640&q=0"))).toBeNull();
        expect(parseImageParams(makeUrl("url=/img/hero.jpg&w=640&q=101"))).toBeNull();
    });

    it("should enforce allowedWidths when provided", () => {
        const allowed = [640, 1080, 1920];
        expect(parseImageParams(makeUrl("url=/img/hero.jpg&w=640"), allowed)).not.toBeNull();
        expect(parseImageParams(makeUrl("url=/img/hero.jpg&w=800"), allowed)).toBeNull();
        // width=0 (no resize) is always allowed
        expect(parseImageParams(makeUrl("url=/img/hero.jpg&w=0"), allowed)).not.toBeNull();
    });
});

// ─── negotiateImageFormat ─────────────────────────────────────────────────────

describe("negotiateImageFormat", () => {
    it("should return avif when Accept includes image/avif", () => {
        expect(negotiateImageFormat("image/avif,image/webp,*/*")).toBe("image/avif");
    });

    it("should return webp when Accept includes image/webp but not avif", () => {
        expect(negotiateImageFormat("image/webp,*/*")).toBe("image/webp");
    });

    it("should return jpeg when Accept has neither avif nor webp", () => {
        expect(negotiateImageFormat("image/png,*/*")).toBe("image/jpeg");
    });

    it("should return jpeg when Accept is null", () => {
        expect(negotiateImageFormat(null)).toBe("image/jpeg");
    });
});

// ─── isSafeImageContentType ───────────────────────────────────────────────────

describe("isSafeImageContentType", () => {
    it("should accept standard image types", () => {
        expect(isSafeImageContentType("image/jpeg")).toBe(true);
        expect(isSafeImageContentType("image/png")).toBe(true);
        expect(isSafeImageContentType("image/gif")).toBe(true);
        expect(isSafeImageContentType("image/webp")).toBe(true);
        expect(isSafeImageContentType("image/avif")).toBe(true);
    });

    it("should reject SVG (potentially dangerous)", () => {
        expect(isSafeImageContentType("image/svg+xml")).toBe(false);
    });

    it("should reject HTML and text types", () => {
        expect(isSafeImageContentType("text/html")).toBe(false);
        expect(isSafeImageContentType("text/plain")).toBe(false);
    });

    it("should reject null content type", () => {
        expect(isSafeImageContentType(null)).toBe(false);
    });

    it("should ignore charset parameters", () => {
        expect(isSafeImageContentType("image/jpeg; charset=utf-8")).toBe(true);
    });
});

// ─── handleImageOptimization ──────────────────────────────────────────────────

describe("handleImageOptimization", () => {
    function makeRequest(url: string, accept = "*/*"): Request {
        return new Request(`http://localhost${url}`, {
            headers: { Accept: accept },
        });
    }

    function makeHandlers(contentType = "image/jpeg", body = "fake-image"): ImageHandlers {
        return {
            fetchAsset: async () =>
                new Response(body, {
                    status: 200,
                    headers: { "Content-Type": contentType },
                }),
        };
    }

    it("should return 400 for invalid params", async () => {
        const response = await handleImageOptimization(
            makeRequest("/_vinext/image"),
            makeHandlers(),
        );
        expect(response.status).toBe(400);
    });

    it("should return 404 when source image not found", async () => {
        const handlers: ImageHandlers = {
            fetchAsset: async () => new Response(null, { status: 404 }),
        };
        const response = await handleImageOptimization(
            makeRequest("/_vinext/image?url=/img/missing.jpg&w=640"),
            handlers,
        );
        expect(response.status).toBe(404);
    });

    it("should block SVG by default", async () => {
        const response = await handleImageOptimization(
            makeRequest("/_vinext/image?url=/img/icon.svg&w=0"),
            makeHandlers("image/svg+xml", "<svg></svg>"),
        );
        expect(response.status).toBe(400);
        expect(await response.text()).toContain("SVG");
    });

    it("should allow SVG when dangerouslyAllowSVG is true", async () => {
        const response = await handleImageOptimization(
            makeRequest("/_vinext/image?url=/img/icon.svg&w=0"),
            makeHandlers("image/svg+xml", "<svg></svg>"),
            undefined,
            { dangerouslyAllowSVG: true },
        );
        expect(response.status).toBe(200);
        expect(response.headers.get("Content-Security-Policy")).toBeTruthy();
        expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    });

    it("should serve a valid image with cache headers", async () => {
        const response = await handleImageOptimization(
            makeRequest("/_vinext/image?url=/img/photo.jpg&w=640&q=80"),
            makeHandlers("image/jpeg", "fake-jpeg-data"),
        );
        expect(response.status).toBe(200);
        expect(response.headers.get("Cache-Control")).toBe(IMAGE_CACHE_CONTROL);
        expect(response.headers.get("Content-Security-Policy")).toBeTruthy();
    });
});

// ─── Constants ────────────────────────────────────────────────────────────────

describe("image optimization constants", () => {
    it("should have correct default device sizes", () => {
        expect(DEFAULT_DEVICE_SIZES).toEqual([640, 750, 828, 1080, 1200, 1920, 2048, 3840]);
    });

    it("should have correct default image sizes", () => {
        expect(DEFAULT_IMAGE_SIZES).toEqual([16, 32, 48, 64, 96, 128, 256, 384]);
    });
});
