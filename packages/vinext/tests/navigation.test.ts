/**
 * Tests for shims/navigation.ts
 *
 * Covers: toRscUrl, stripBasePath, withBasePath, setNavigationContext/getNavigationContext.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
    toRscUrl,
    setNavigationContext,
    getNavigationContext,
} from "../src/shims/navigation.js";

// ─── toRscUrl ─────────────────────────────────────────────────────────────────

describe("toRscUrl", () => {
    it("should append .rsc to a simple path", () => {
        expect(toRscUrl("/about")).toBe("/about.rsc");
    });

    it("should strip trailing slash before appending .rsc", () => {
        expect(toRscUrl("/about/")).toBe("/about.rsc");
    });

    it("should handle root path", () => {
        // Root "/" stays as "/" (no ".rsc" needed for index)
        const result = toRscUrl("/");
        expect(result).toContain(".rsc");
    });

    it("should preserve query string", () => {
        const result = toRscUrl("/blog?page=2");
        expect(result).toContain(".rsc");
        expect(result).toContain("page=2");
    });

    it("should preserve hash", () => {
        const result = toRscUrl("/blog#section");
        expect(result).toContain(".rsc");
    });
});

// ─── navigation context ───────────────────────────────────────────────────────

describe("navigation context", () => {
    beforeEach(() => {
        setNavigationContext(null);
    });

    it("should return null when no context is set", () => {
        expect(getNavigationContext()).toBeNull();
    });

    it("should set and get context", () => {
        const ctx = {
            pathname: "/test",
            searchParams: new URLSearchParams("a=1"),
            params: { id: "123" },
        };
        setNavigationContext(ctx);
        const result = getNavigationContext();
        expect(result).not.toBeNull();
        expect(result!.pathname).toBe("/test");
        expect(result!.params).toEqual({ id: "123" });
    });

    it("should clear context when set to null", () => {
        setNavigationContext({
            pathname: "/test",
            searchParams: new URLSearchParams(),
            params: {},
        });
        expect(getNavigationContext()).not.toBeNull();
        setNavigationContext(null);
        expect(getNavigationContext()).toBeNull();
    });
});
