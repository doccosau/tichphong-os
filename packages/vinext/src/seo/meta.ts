/**
 * vinext/seo/meta — Framework-level meta tag helpers
 *
 * Provides utilities for generating Open Graph, Twitter Card, and
 * standard meta tags for SSR/RSC rendering. Framework-level so any
 * Vinext project can use them.
 *
 * Usage:
 *   import { generateMetaTags, type MetaConfig } from "vinext/seo/meta";
 *   const tags = generateMetaTags({ title: "My Page", description: "..." });
 */

export interface MetaConfig {
    /** Page title */
    title?: string;
    /** Title template (e.g. "%s | My Site") */
    titleTemplate?: string;
    /** Meta description */
    description?: string;
    /** Canonical URL */
    canonical?: string;
    /** Open Graph config */
    openGraph?: {
        type?: string;
        title?: string;
        description?: string;
        url?: string;
        siteName?: string;
        images?: Array<{ url: string; width?: number; height?: number; alt?: string }>;
        locale?: string;
    };
    /** Twitter Card config */
    twitter?: {
        card?: "summary" | "summary_large_image" | "app" | "player";
        site?: string;
        creator?: string;
        title?: string;
        description?: string;
        image?: string;
    };
    /** Additional custom meta tags */
    additionalTags?: Array<{ name?: string; property?: string; content: string }>;
    /** Robots directive */
    robots?: string;
    /** Generator name */
    generator?: string;
}

export interface MetaTag {
    tag: "title" | "meta" | "link";
    attributes: Record<string, string>;
    content?: string;
}

/**
 * Generate an array of meta tag descriptors from configuration.
 * Can be rendered to HTML string or used in React components.
 */
export function generateMetaTags(config: MetaConfig): MetaTag[] {
    const tags: MetaTag[] = [];

    // Title
    const title = config.titleTemplate && config.title
        ? config.titleTemplate.replace("%s", config.title)
        : config.title;
    if (title) {
        tags.push({ tag: "title", attributes: {}, content: title });
    }

    // Description
    if (config.description) {
        tags.push({
            tag: "meta",
            attributes: { name: "description", content: config.description },
        });
    }

    // Canonical
    if (config.canonical) {
        tags.push({
            tag: "link",
            attributes: { rel: "canonical", href: config.canonical },
        });
    }

    // Robots
    if (config.robots) {
        tags.push({
            tag: "meta",
            attributes: { name: "robots", content: config.robots },
        });
    }

    // Generator
    tags.push({
        tag: "meta",
        attributes: { name: "generator", content: config.generator ?? "Vinext (TichPhong OS)" },
    });

    // Open Graph
    if (config.openGraph) {
        const og = config.openGraph;
        if (og.type) tags.push({ tag: "meta", attributes: { property: "og:type", content: og.type } });
        if (og.title || title) tags.push({ tag: "meta", attributes: { property: "og:title", content: og.title ?? title ?? "" } });
        if (og.description || config.description) tags.push({ tag: "meta", attributes: { property: "og:description", content: og.description ?? config.description ?? "" } });
        if (og.url) tags.push({ tag: "meta", attributes: { property: "og:url", content: og.url } });
        if (og.siteName) tags.push({ tag: "meta", attributes: { property: "og:site_name", content: og.siteName } });
        if (og.locale) tags.push({ tag: "meta", attributes: { property: "og:locale", content: og.locale } });
        if (og.images) {
            for (const img of og.images) {
                tags.push({ tag: "meta", attributes: { property: "og:image", content: img.url } });
                if (img.width) tags.push({ tag: "meta", attributes: { property: "og:image:width", content: String(img.width) } });
                if (img.height) tags.push({ tag: "meta", attributes: { property: "og:image:height", content: String(img.height) } });
                if (img.alt) tags.push({ tag: "meta", attributes: { property: "og:image:alt", content: img.alt } });
            }
        }
    }

    // Twitter Card
    if (config.twitter) {
        const tw = config.twitter;
        tags.push({ tag: "meta", attributes: { name: "twitter:card", content: tw.card ?? "summary_large_image" } });
        if (tw.site) tags.push({ tag: "meta", attributes: { name: "twitter:site", content: tw.site } });
        if (tw.creator) tags.push({ tag: "meta", attributes: { name: "twitter:creator", content: tw.creator } });
        if (tw.title || title) tags.push({ tag: "meta", attributes: { name: "twitter:title", content: tw.title ?? title ?? "" } });
        if (tw.description || config.description) tags.push({ tag: "meta", attributes: { name: "twitter:description", content: tw.description ?? config.description ?? "" } });
        if (tw.image) tags.push({ tag: "meta", attributes: { name: "twitter:image", content: tw.image } });
    }

    // Additional custom tags
    if (config.additionalTags) {
        for (const tag of config.additionalTags) {
            const attrs: Record<string, string> = { content: tag.content };
            if (tag.name) attrs.name = tag.name;
            if (tag.property) attrs.property = tag.property;
            tags.push({ tag: "meta", attributes: attrs });
        }
    }

    return tags;
}

/**
 * Render meta tags to an HTML string for injection into <head>.
 */
export function renderMetaTagsToHTML(config: MetaConfig): string {
    const tags = generateMetaTags(config);
    return tags
        .map((tag) => {
            if (tag.tag === "title") {
                return `<title>${escapeHtml(tag.content ?? "")}</title>`;
            }
            if (tag.tag === "link") {
                const attrs = Object.entries(tag.attributes)
                    .map(([k, v]) => `${k}="${escapeHtml(v)}"`)
                    .join(" ");
                return `<link ${attrs} />`;
            }
            const attrs = Object.entries(tag.attributes)
                .map(([k, v]) => `${k}="${escapeHtml(v)}"`)
                .join(" ");
            return `<meta ${attrs} />`;
        })
        .join("\n");
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
