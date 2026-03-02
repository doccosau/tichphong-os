/**
 * Tests for server/security-headers.ts
 */
import { describe, it, expect } from "vitest";
import { getSecurityHeaders } from "../src/server/security-headers.js";

describe("getSecurityHeaders", () => {
    it("should return default security headers", () => {
        const headers = getSecurityHeaders();
        expect(headers["Strict-Transport-Security"]).toContain("max-age=");
        expect(headers["X-Content-Type-Options"]).toBe("nosniff");
        expect(headers["X-Frame-Options"]).toBe("SAMEORIGIN");
        expect(headers["X-XSS-Protection"]).toBe("0");
        expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
        expect(headers["Content-Security-Policy"]).toContain("default-src");
        expect(headers["Permissions-Policy"]).toContain("camera=()");
    });

    it("should allow disabling HSTS", () => {
        const headers = getSecurityHeaders({ hsts: false });
        expect(headers["Strict-Transport-Security"]).toBeUndefined();
    });

    it("should allow custom HSTS config", () => {
        const headers = getSecurityHeaders({
            hsts: { maxAge: 3600, preload: true },
        });
        expect(headers["Strict-Transport-Security"]).toContain("max-age=3600");
        expect(headers["Strict-Transport-Security"]).toContain("preload");
    });

    it("should allow DENY frame options", () => {
        const headers = getSecurityHeaders({ frameOptions: "DENY" });
        expect(headers["X-Frame-Options"]).toBe("DENY");
    });

    it("should allow disabling CSP", () => {
        const headers = getSecurityHeaders({ csp: false });
        expect(headers["Content-Security-Policy"]).toBeUndefined();
    });

    it("should support CSP report-only mode", () => {
        const headers = getSecurityHeaders({ csp: { reportOnly: true } });
        expect(headers["Content-Security-Policy-Report-Only"]).toBeDefined();
        expect(headers["Content-Security-Policy"]).toBeUndefined();
    });

    it("should merge custom CSP directives with defaults", () => {
        const headers = getSecurityHeaders({
            csp: { directives: { "script-src": ["'self'", "https://cdn.example.com"] } },
        });
        expect(headers["Content-Security-Policy"]).toContain("cdn.example.com");
        expect(headers["Content-Security-Policy"]).toContain("default-src");
    });

    it("should support COOP and COEP", () => {
        const headers = getSecurityHeaders({
            coopPolicy: "same-origin",
            coepPolicy: "require-corp",
        });
        expect(headers["Cross-Origin-Opener-Policy"]).toBe("same-origin");
        expect(headers["Cross-Origin-Embedder-Policy"]).toBe("require-corp");
    });
});
