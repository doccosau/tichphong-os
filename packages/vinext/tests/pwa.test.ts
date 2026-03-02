/**
 * Tests for pwa/index.ts
 */
import { describe, it, expect } from "vitest";
import { generateManifest, generateServiceWorker } from "../src/pwa/index.js";

describe("generateManifest", () => {
    it("should generate valid JSON", () => {
        const json = generateManifest({ name: "My App" });
        const parsed = JSON.parse(json);
        expect(parsed.name).toBe("My App");
        expect(parsed.start_url).toBe("/");
        expect(parsed.display).toBe("standalone");
    });

    it("should use shortName fallback to name", () => {
        const parsed = JSON.parse(generateManifest({ name: "My App" }));
        expect(parsed.short_name).toBe("My App");
    });

    it("should apply custom config", () => {
        const parsed = JSON.parse(generateManifest({
            name: "My App",
            shortName: "MA",
            themeColor: "#ff0000",
            backgroundColor: "#0000ff",
            display: "fullscreen",
            description: "A great app",
        }));
        expect(parsed.short_name).toBe("MA");
        expect(parsed.theme_color).toBe("#ff0000");
        expect(parsed.background_color).toBe("#0000ff");
        expect(parsed.display).toBe("fullscreen");
        expect(parsed.description).toBe("A great app");
    });

    it("should include icons", () => {
        const parsed = JSON.parse(generateManifest({
            name: "App",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }],
        }));
        expect(parsed.icons).toHaveLength(1);
        expect(parsed.icons[0].src).toBe("/icon-192.png");
        expect(parsed.icons[0].type).toBe("image/png");
    });

    it("should include shortcuts", () => {
        const parsed = JSON.parse(generateManifest({
            name: "App",
            shortcuts: [{ name: "New Post", url: "/new" }],
        }));
        expect(parsed.shortcuts).toHaveLength(1);
        expect(parsed.shortcuts[0].url).toBe("/new");
    });
});

describe("generateServiceWorker", () => {
    it("should generate valid JavaScript", () => {
        const sw = generateServiceWorker();
        expect(sw).toContain("self.addEventListener");
        expect(sw).toContain("install");
        expect(sw).toContain("fetch");
        expect(sw).toContain("activate");
    });

    it("should use custom cache name", () => {
        const sw = generateServiceWorker({ cacheName: "my-cache-v2" });
        expect(sw).toContain("my-cache-v2");
    });

    it("should include precache URLs", () => {
        const sw = generateServiceWorker({ precache: ["/", "/about"] });
        expect(sw).toContain('"/about"');
    });
});
