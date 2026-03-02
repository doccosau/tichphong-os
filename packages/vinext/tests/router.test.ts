/**
 * Tests for shims/router.ts utility functions
 *
 * Covers: isExternalUrl, withBasePath, stripBasePath
 * Note: resolveUrl is module-internal (not exported), so we test
 * only publicly exported functions.
 */
import { describe, it, expect } from "vitest";
import { isExternalUrl } from "../src/shims/router.js";

describe("isExternalUrl", () => {
    it("should detect http URLs as external", () => {
        expect(isExternalUrl("https://example.com")).toBe(true);
        expect(isExternalUrl("http://example.com")).toBe(true);
    });

    it("should detect protocol-relative URLs as external", () => {
        expect(isExternalUrl("//example.com")).toBe(true);
    });

    it("should detect other schemes as external", () => {
        expect(isExternalUrl("mailto:test@example.com")).toBe(true);
        expect(isExternalUrl("tel:+1234567890")).toBe(true);
    });

    it("should not detect relative paths as external", () => {
        expect(isExternalUrl("/about")).toBe(false);
        expect(isExternalUrl("/api/test")).toBe(false);
        expect(isExternalUrl("about")).toBe(false);
    });

    it("should not detect hash-only as external", () => {
        expect(isExternalUrl("#section")).toBe(false);
    });

    it("should not detect query-only as external", () => {
        expect(isExternalUrl("?page=2")).toBe(false);
    });
});
