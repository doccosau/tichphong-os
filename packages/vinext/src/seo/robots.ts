/**
 * vinext/seo/robots — Framework-level robots.txt generator
 *
 * Generates a robots.txt from configuration. Supports multiple user-agents,
 * allow/disallow rules, crawl-delay, and auto-links to sitemap.
 *
 * Usage:
 *   import { generateRobotsTxt } from "vinext/seo/robots";
 *   const txt = generateRobotsTxt({
 *     siteUrl: "https://example.com",
 *     rules: [{ userAgent: "*", allow: ["/"], disallow: ["/admin"] }],
 *   });
 */

export interface RobotsRule {
    /** User agent string (e.g. "*", "Googlebot", "Bingbot") */
    userAgent: string;
    /** Paths to allow */
    allow?: string[];
    /** Paths to disallow */
    disallow?: string[];
    /** Crawl delay in seconds */
    crawlDelay?: number;
}

export interface RobotsConfig {
    /** Base URL for the Sitemap directive (e.g. "https://example.com") */
    siteUrl?: string;
    /** Array of rules for different user agents */
    rules?: RobotsRule[];
    /** Additional Sitemap URLs to include */
    additionalSitemaps?: string[];
    /** Whether to include the default sitemap reference */
    sitemap?: boolean;
}

/**
 * Generate a robots.txt string from configuration.
 *
 * Default behavior (no config):
 * - Allow all crawlers
 * - Disallow /api/, /_next/, /_vinext/
 * - Include sitemap reference
 */
export function generateRobotsTxt(config: RobotsConfig = {}): string {
    const rules: RobotsRule[] = config.rules ?? [
        {
            userAgent: "*",
            allow: ["/"],
            disallow: ["/api/", "/_next/", "/_vinext/", "/_admin/"],
        },
    ];

    const lines: string[] = [];

    for (const rule of rules) {
        lines.push(`User-agent: ${rule.userAgent}`);
        if (rule.allow) {
            for (const path of rule.allow) {
                lines.push(`Allow: ${path}`);
            }
        }
        if (rule.disallow) {
            for (const path of rule.disallow) {
                lines.push(`Disallow: ${path}`);
            }
        }
        if (rule.crawlDelay !== undefined) {
            lines.push(`Crawl-delay: ${rule.crawlDelay}`);
        }
        lines.push("");
    }

    // Sitemap references
    const includeSitemap = config.sitemap !== false;
    if (includeSitemap && config.siteUrl) {
        const siteUrl = config.siteUrl.replace(/\/$/, "");
        lines.push(`Sitemap: ${siteUrl}/sitemap.xml`);
    }
    if (config.additionalSitemaps) {
        for (const sitemap of config.additionalSitemaps) {
            lines.push(`Sitemap: ${sitemap}`);
        }
    }

    return lines.join("\n").trim() + "\n";
}
