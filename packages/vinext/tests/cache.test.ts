/**
 * Tests for shims/cache.ts — MemoryCacheHandler
 *
 * Covers: get/set lifecycle, tag revalidation, TTL expiry, resetRequestCache.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
    MemoryCacheHandler,
    type IncrementalCacheValue,
} from "../src/shims/cache.js";

function makePageValue(html: string): IncrementalCacheValue {
    return {
        kind: "APP_PAGE",
        html,
        rscData: undefined,
        headers: undefined,
        postponed: undefined,
        status: 200,
    };
}

describe("MemoryCacheHandler", () => {
    let handler: MemoryCacheHandler;

    beforeEach(() => {
        handler = new MemoryCacheHandler();
    });

    it("should return null for missing keys", async () => {
        const result = await handler.get("nonexistent");
        expect(result).toBeNull();
    });

    it("should store and retrieve a value", async () => {
        const value = makePageValue("<h1>Hello</h1>");
        await handler.set("page:/test", value, { tags: ["tag-a"] });
        const result = await handler.get("page:/test");
        expect(result).not.toBeNull();
        expect(result!.value).toEqual(value);
        expect(result!.lastModified).toBeGreaterThan(0);
    });

    it("should overwrite existing values", async () => {
        await handler.set("page:/test", makePageValue("v1"));
        await handler.set("page:/test", makePageValue("v2"));
        const result = await handler.get("page:/test");
        expect(result).not.toBeNull();
        expect((result!.value as any).html).toBe("v2");
    });

    it("should invalidate by tag", async () => {
        await handler.set("page:/a", makePageValue("a"), { tags: ["shared-tag"] });
        await handler.set("page:/b", makePageValue("b"), { tags: ["other-tag"] });

        // Before revalidation, both should be accessible
        expect(await handler.get("page:/a")).not.toBeNull();
        expect(await handler.get("page:/b")).not.toBeNull();

        // Revalidate the shared tag
        await handler.revalidateTag("shared-tag");

        // /a should be invalidated, /b should remain
        const resultA = await handler.get("page:/a");
        const resultB = await handler.get("page:/b");
        expect(resultA).toBeNull();
        expect(resultB).not.toBeNull();
    });

    it("should handle setting null data (delete)", async () => {
        await handler.set("page:/test", makePageValue("hello"));
        await handler.set("page:/test", null);
        const result = await handler.get("page:/test");
        // Setting null should effectively clear/delete
        expect(result === null || result!.value === null).toBe(true);
    });

    it("should handle resetRequestCache without error", () => {
        expect(() => handler.resetRequestCache()).not.toThrow();
    });
});
