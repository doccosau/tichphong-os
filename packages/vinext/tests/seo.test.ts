/**
 * Tests for seo/sitemap.ts, seo/robots.ts, seo/meta.ts
 */
import { describe, it, expect } from "vitest";
import { generateSitemap, buildSitemapEntries, generateSitemapIndex } from "../src/seo/sitemap.js";
import { generateRobotsTxt } from "../src/seo/robots.js";
import { generateMetaTags, renderMetaTagsToHTML } from "../src/seo/meta.js";

// ─── Sitemap ────────────────────────────────────────────────────────────────

describe("generateSitemap", () => {
    const routes = ["/", "/about", "/blog", "/blog/[slug]", "/api/test", "/_admin"];
    const config = { siteUrl: "https://example.com" };

    it("should generate valid XML", () => {
        const xml = generateSitemap(routes, config);
        expect(xml).toContain('<?xml version="1.0"');
        expect(xml).toContain("<urlset");
        expect(xml).toContain("</urlset>");
    });

    it("should include static routes", () => {
        const xml = generateSitemap(routes, config);
        expect(xml).toContain("<loc>https://example.com/</loc>");
        expect(xml).toContain("<loc>https://example.com/about</loc>");
        expect(xml).toContain("<loc>https://example.com/blog</loc>");
    });

    it("should exclude dynamic routes with brackets", () => {
        const xml = generateSitemap(routes, config);
        expect(xml).not.toContain("[slug]");
    });

    it("should exclude API routes by default", () => {
        const xml = generateSitemap(routes, config);
        expect(xml).not.toContain("/api/test");
    });

    it("should exclude internal routes", () => {
        const xml = generateSitemap(routes, config);
        expect(xml).not.toContain("/_admin");
    });

    it("should set homepage priority to 1.0", () => {
        const entries = buildSitemapEntries(routes, config);
        const home = entries.find((e) => e.loc === "/");
        expect(home?.priority).toBe(1.0);
    });

    it("should support trailingSlash", () => {
        const xml = generateSitemap(routes, { ...config, trailingSlash: true });
        expect(xml).toContain("<loc>https://example.com/about/</loc>");
    });

    it("should support custom exclude patterns", () => {
        const xml = generateSitemap(routes, { ...config, exclude: ["/blog*"] });
        expect(xml).not.toContain("/blog");
    });
});

describe("generateSitemapIndex", () => {
    it("should generate valid index XML", () => {
        const xml = generateSitemapIndex([
            { loc: "https://example.com/sitemap-1.xml", lastmod: "2024-01-01" },
        ]);
        expect(xml).toContain("<sitemapindex");
        expect(xml).toContain("sitemap-1.xml");
    });
});

// ─── Robots ─────────────────────────────────────────────────────────────────

describe("generateRobotsTxt", () => {
    it("should generate default rules", () => {
        const txt = generateRobotsTxt();
        expect(txt).toContain("User-agent: *");
        expect(txt).toContain("Allow: /");
        expect(txt).toContain("Disallow: /api/");
    });

    it("should include sitemap reference", () => {
        const txt = generateRobotsTxt({ siteUrl: "https://example.com" });
        expect(txt).toContain("Sitemap: https://example.com/sitemap.xml");
    });

    it("should support custom rules", () => {
        const txt = generateRobotsTxt({
            rules: [{ userAgent: "Googlebot", allow: ["/"], disallow: ["/private"] }],
        });
        expect(txt).toContain("User-agent: Googlebot");
        expect(txt).toContain("Disallow: /private");
    });

    it("should support crawl delay", () => {
        const txt = generateRobotsTxt({
            rules: [{ userAgent: "*", crawlDelay: 10 }],
        });
        expect(txt).toContain("Crawl-delay: 10");
    });
});

// ─── Meta Tags ──────────────────────────────────────────────────────────────

describe("generateMetaTags", () => {
    it("should generate title tag", () => {
        const tags = generateMetaTags({ title: "My Page" });
        const titleTag = tags.find((t) => t.tag === "title");
        expect(titleTag?.content).toBe("My Page");
    });

    it("should apply title template", () => {
        const tags = generateMetaTags({ title: "About", titleTemplate: "%s | MySite" });
        const titleTag = tags.find((t) => t.tag === "title");
        expect(titleTag?.content).toBe("About | MySite");
    });

    it("should generate Open Graph tags", () => {
        const tags = generateMetaTags({
            title: "Test",
            openGraph: { type: "website", siteName: "MySite" },
        });
        const ogType = tags.find((t) => t.attributes.property === "og:type");
        expect(ogType?.attributes.content).toBe("website");
    });

    it("should generate Twitter Card tags", () => {
        const tags = generateMetaTags({
            twitter: { card: "summary_large_image", site: "@mysite" },
        });
        const twCard = tags.find((t) => t.attributes.name === "twitter:card");
        expect(twCard?.attributes.content).toBe("summary_large_image");
    });

    it("should include generator tag", () => {
        const tags = generateMetaTags({});
        const gen = tags.find((t) => t.attributes.name === "generator");
        expect(gen?.attributes.content).toContain("Vinext");
    });
});

describe("renderMetaTagsToHTML", () => {
    it("should render HTML string", () => {
        const html = renderMetaTagsToHTML({ title: "Test", description: "A test page" });
        expect(html).toContain("<title>Test</title>");
        expect(html).toContain('name="description"');
    });
});
