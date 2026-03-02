/**
 * vinext/seo/sitemap — Framework-level sitemap.xml generator
 *
 * Generates a sitemap.xml from the framework's route discovery output.
 * Users configure it via next.config.js or vinext.config:
 *
 *   // next.config.js
 *   export default {
 *     seo: {
 *       siteUrl: "https://example.com",
 *       changefreq: "weekly",
 *       priority: 0.7,
 *       exclude: ["/admin/*", "/api/*"],
 *     }
 *   }
 *
 * Or programmatically:
 *   import { generateSitemap } from "vinext/seo/sitemap";
 *   const xml = generateSitemap(routes, { siteUrl: "https://example.com" });
 */

export interface SitemapEntry {
    /** URL path (e.g. "/about", "/blog/my-post") */
    loc: string;
    /** Last modification date (ISO 8601) */
    lastmod?: string;
    /** Change frequency hint for crawlers */
    changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
    /** Priority relative to other pages (0.0 to 1.0) */
    priority?: number;
}

export interface SitemapConfig {
    /** Base URL of the site (required, e.g. "https://example.com") */
    siteUrl: string;
    /** Default change frequency for all pages */
    changefreq?: SitemapEntry["changefreq"];
    /** Default priority for all pages */
    priority?: number;
    /** Glob patterns to exclude from the sitemap */
    exclude?: string[];
    /** Additional entries to include (e.g. for dynamic routes) */
    additionalPaths?: SitemapEntry[];
    /** Whether to include trailing slashes in URLs */
    trailingSlash?: boolean;
}

/**
 * Check if a path matches any of the exclude patterns.
 * Supports simple glob: * matches any segment, ** matches any depth.
 */
function matchesExclude(path: string, patterns: string[]): boolean {
    for (const pattern of patterns) {
        const regex = pattern
            .replace(/\*\*/g, "{{GLOBSTAR}}")
            .replace(/\*/g, "[^/]*")
            .replace(/{{GLOBSTAR}}/g, ".*");
        if (new RegExp(`^${regex}$`).test(path)) {
            return true;
        }
    }
    return false;
}

/**
 * Generate sitemap entries from discovered routes.
 *
 * @param routes - Array of route paths from the framework's route discovery
 * @param config - Sitemap configuration
 * @returns Array of SitemapEntry objects
 */
export function buildSitemapEntries(
    routes: string[],
    config: SitemapConfig,
): SitemapEntry[] {
    const exclude = config.exclude ?? ["/api/*", "/_*"];
    const entries: SitemapEntry[] = [];

    for (const route of routes) {
        // Skip dynamic segments (e.g. [id], [...slug])
        if (route.includes("[")) continue;
        // Skip excluded patterns
        if (matchesExclude(route, exclude)) continue;
        // Skip internal routes
        if (route.startsWith("/_")) continue;

        let loc = route;
        if (config.trailingSlash && !loc.endsWith("/")) {
            loc += "/";
        }

        entries.push({
            loc,
            changefreq: config.changefreq ?? "weekly",
            priority: loc === "/" ? 1.0 : (config.priority ?? 0.7),
            lastmod: new Date().toISOString().split("T")[0],
        });
    }

    // Add additional paths
    if (config.additionalPaths) {
        entries.push(...config.additionalPaths);
    }

    return entries;
}

/**
 * Generate sitemap.xml string from routes.
 */
export function generateSitemap(routes: string[], config: SitemapConfig): string {
    const entries = buildSitemapEntries(routes, config);
    const siteUrl = config.siteUrl.replace(/\/$/, "");

    const urls = entries
        .map((entry) => {
            const parts = [`    <loc>${siteUrl}${entry.loc}</loc>`];
            if (entry.lastmod) parts.push(`    <lastmod>${entry.lastmod}</lastmod>`);
            if (entry.changefreq) parts.push(`    <changefreq>${entry.changefreq}</changefreq>`);
            if (entry.priority !== undefined) parts.push(`    <priority>${entry.priority}</priority>`);
            return `  <url>\n${parts.join("\n")}\n  </url>`;
        })
        .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

/**
 * Generate a sitemap index for multi-sitemap setups.
 */
export function generateSitemapIndex(
    sitemaps: Array<{ loc: string; lastmod?: string }>,
): string {
    const entries = sitemaps
        .map((s) => {
            const parts = [`    <loc>${s.loc}</loc>`];
            if (s.lastmod) parts.push(`    <lastmod>${s.lastmod}</lastmod>`);
            return `  <sitemap>\n${parts.join("\n")}\n  </sitemap>`;
        })
        .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;
}
