/**
 * Font loading and caching utilities.
 *
 * Extracted from index.ts to improve maintainability.
 * Handles Google Fonts CSS fetching, .woff2 downloading and local caching.
 */
import path from "node:path";
import fs from "node:fs";

/**
 * Fetch Google Fonts CSS, download .woff2 files, cache locally, and return
 * @font-face CSS with local file references.
 *
 * Cache dir structure: .vinext/fonts/<family-hash>/
 *   - style.css (the rewritten @font-face CSS)
 *   - *.woff2 (downloaded font files)
 */
export async function fetchAndCacheFont(
    cssUrl: string,
    family: string,
    cacheDir: string,
): Promise<string> {
    // Use a hash of the URL for the cache key
    const { createHash } = await import("node:crypto");
    const urlHash = createHash("md5").update(cssUrl).digest("hex").slice(0, 12);
    const fontDir = path.join(cacheDir, `${family.toLowerCase().replace(/\s+/g, "-")}-${urlHash}`);

    // Check if already cached
    const cachedCSSPath = path.join(fontDir, "style.css");
    if (fs.existsSync(cachedCSSPath)) {
        return fs.readFileSync(cachedCSSPath, "utf-8");
    }

    // Fetch CSS from Google Fonts (woff2 user-agent gives woff2 URLs)
    const cssResponse = await fetch(cssUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        },
    });
    if (!cssResponse.ok) {
        throw new Error(`Failed to fetch Google Fonts CSS: ${cssResponse.status}`);
    }
    let css = await cssResponse.text();

    // Extract all font file URLs
    const urlRe = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g;
    const urls = new Map<string, string>(); // original URL -> local filename
    let urlMatch;
    while ((urlMatch = urlRe.exec(css)) !== null) {
        const fontUrl = urlMatch[1];
        if (!urls.has(fontUrl)) {
            const ext = fontUrl.includes(".woff2") ? ".woff2" : fontUrl.includes(".woff") ? ".woff" : ".ttf";
            const fileHash = createHash("md5").update(fontUrl).digest("hex").slice(0, 8);
            urls.set(fontUrl, `${family.toLowerCase().replace(/\s+/g, "-")}-${fileHash}${ext}`);
        }
    }

    // Download font files
    fs.mkdirSync(fontDir, { recursive: true });
    for (const [fontUrl, filename] of urls) {
        const filePath = path.join(fontDir, filename);
        if (!fs.existsSync(filePath)) {
            const fontResponse = await fetch(fontUrl);
            if (fontResponse.ok) {
                const buffer = Buffer.from(await fontResponse.arrayBuffer());
                fs.writeFileSync(filePath, buffer);
            }
        }
        // Rewrite CSS to use relative path (Vite will resolve /@fs/ for dev, or asset for build)
        css = css.split(fontUrl).join(filePath);
    }

    // Cache the rewritten CSS
    fs.writeFileSync(cachedCSSPath, css);
    return css;
}
