import { describe, it, expect } from "vitest";
import { normalizePath } from "../src/server/normalize-path.js";

describe("normalizePath", () => {
    it("should normalize multiple slashes down to a single slash and preserve trailing", () => {
        expect(normalizePath("///foo//bar/")).toBe("/foo/bar/");
    });

    it("should format paths properly", () => {
        expect(normalizePath("/foo/bar")).toBe("/foo/bar");
    });

    it("should resolve . and .. components safely", () => {
        expect(normalizePath("/foo/./bar/../baz")).toBe("/foo/baz");
    });

    it("should handle root properly", () => {
        expect(normalizePath("/")).toBe("/");
    });

    it("should preserve trailing slashes if present", () => {
        expect(normalizePath("/foo/")).toBe("/foo/");
    });
});
