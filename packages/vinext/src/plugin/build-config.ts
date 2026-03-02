/**
 * Build configuration utilities for Vite/Rollup.
 *
 * Extracted from index.ts to improve maintainability.
 * Includes: Vite version detection, PostCSS resolver, virtual module IDs,
 * client manual chunks, output config, treeshake config, computeLazyChunks.
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Vite version detection ──────────────────────────────────────────────────

/**
 * Detect Vite major version at runtime by resolving from cwd.
 * The plugin may be installed in a workspace root with Vite 7 but used
 * by a project that has Vite 8 — so we resolve from cwd, not from
 * the plugin's own location.
 */
export function getViteMajorVersion(): number {
    try {
        const require = createRequire(path.join(process.cwd(), "package.json"));
        const vitePkg = require("vite/package.json");
        return parseInt(vitePkg.version, 10);
    } catch {
        return 7; // default to Vite 7
    }
}

// ─── PostCSS config handling ─────────────────────────────────────────────────

/**
 * PostCSS config file names to search for, in priority order.
 * Matches the same search order as postcss-load-config / lilconfig.
 */
export const POSTCSS_CONFIG_FILES = [
    "postcss.config.js",
    "postcss.config.cjs",
    "postcss.config.mjs",
    "postcss.config.ts",
    "postcss.config.cts",
    "postcss.config.mts",
    ".postcssrc",
    ".postcssrc.js",
    ".postcssrc.cjs",
    ".postcssrc.mjs",
    ".postcssrc.ts",
    ".postcssrc.cts",
    ".postcssrc.mts",
    ".postcssrc.json",
    ".postcssrc.yaml",
    ".postcssrc.yml",
];

/**
 * Resolve PostCSS string plugin names in a project's PostCSS config.
 *
 * Next.js (via postcss-load-config) resolves string plugin names in the
 * object form `{ plugins: { "pkg-name": opts } }` but NOT in the array form
 * `{ plugins: ["pkg-name"] }`. Since many Next.js projects use the array
 * form (particularly with Tailwind CSS v4), we detect this case and resolve
 * the string names to actual plugin functions so Vite can use them.
 *
 * Returns the resolved PostCSS config object to inject into Vite's
 * `css.postcss`, or `undefined` if no resolution is needed.
 */
export async function resolvePostcssStringPlugins(
    projectRoot: string,
): Promise<{ plugins: any[] } | undefined> {
    // Find the PostCSS config file
    let configPath: string | null = null;
    for (const name of POSTCSS_CONFIG_FILES) {
        const candidate = path.join(projectRoot, name);
        if (fs.existsSync(candidate)) {
            configPath = candidate;
            break;
        }
    }
    if (!configPath) return undefined;

    // Load the config file
    let config: any;
    try {
        if (configPath.endsWith(".json") || configPath.endsWith(".yaml") || configPath.endsWith(".yml")) {
            // JSON/YAML configs use object form — postcss-load-config handles these fine
            return undefined;
        }
        // For .postcssrc without extension, check if it's JSON
        if (configPath.endsWith(".postcssrc")) {
            const content = fs.readFileSync(configPath, "utf-8").trim();
            if (content.startsWith("{")) {
                // JSON format — postcss-load-config handles object form
                return undefined;
            }
        }
        const mod = await import(pathToFileURL(configPath).href);
        config = mod.default ?? mod;
    } catch {
        // If we can't load the config, let Vite/postcss-load-config handle it
        return undefined;
    }

    // Only process array-form plugins that contain string entries
    // (either bare strings or tuple form ["plugin-name", { options }])
    if (!config || !Array.isArray(config.plugins)) return undefined;
    const hasStringPlugins = config.plugins.some(
        (p: any) =>
            typeof p === "string" ||
            (Array.isArray(p) && typeof p[0] === "string"),
    );
    if (!hasStringPlugins) return undefined;

    // Resolve string plugin names to actual plugin functions
    const req = createRequire(path.join(projectRoot, "package.json"));
    const resolved = await Promise.all(
        config.plugins.filter(Boolean).map(async (plugin: any) => {
            if (typeof plugin === "string") {
                const resolved = req.resolve(plugin);
                const mod = await import(pathToFileURL(resolved).href);
                const fn = mod.default ?? mod;
                // If the export is a function, call it to get the plugin instance
                return typeof fn === "function" ? fn() : fn;
            }
            // Array tuple form: ["plugin-name", { options }]
            if (Array.isArray(plugin) && typeof plugin[0] === "string") {
                const [name, options] = plugin;
                const resolved = req.resolve(name);
                const mod = await import(pathToFileURL(resolved).href);
                const fn = mod.default ?? mod;
                return typeof fn === "function" ? fn(options) : fn;
            }
            // Already a function or plugin object — pass through
            return plugin;
        }),
    );

    return { plugins: resolved };
}

// ─── Virtual module IDs ──────────────────────────────────────────────────────

// Virtual module IDs for Pages Router production build
export const VIRTUAL_SERVER_ENTRY = "virtual:vinext-server-entry";
export const RESOLVED_SERVER_ENTRY = "\0" + VIRTUAL_SERVER_ENTRY;
export const VIRTUAL_CLIENT_ENTRY = "virtual:vinext-client-entry";
export const RESOLVED_CLIENT_ENTRY = "\0" + VIRTUAL_CLIENT_ENTRY;

// Virtual module IDs for App Router entries
export const VIRTUAL_RSC_ENTRY = "virtual:vinext-rsc-entry";
export const RESOLVED_RSC_ENTRY = "\0" + VIRTUAL_RSC_ENTRY;
export const VIRTUAL_APP_SSR_ENTRY = "virtual:vinext-app-ssr-entry";
export const RESOLVED_APP_SSR_ENTRY = "\0" + VIRTUAL_APP_SSR_ENTRY;
export const VIRTUAL_APP_BROWSER_ENTRY = "virtual:vinext-app-browser-entry";
export const RESOLVED_APP_BROWSER_ENTRY = "\0" + VIRTUAL_APP_BROWSER_ENTRY;

/** Image file extensions handled by the vinext:image-imports plugin.
 *  Shared between the Rolldown hook filter and the transform handler regex. */
export const IMAGE_EXTS = "png|jpe?g|gif|webp|avif|svg|ico|bmp|tiff?";

// ─── Package name extraction ─────────────────────────────────────────────────

/**
 * Extract the npm package name from a module ID (file path).
 * Returns null if not in node_modules.
 *
 * Handles scoped packages (@org/pkg) and pnpm-style paths
 * (node_modules/.pnpm/pkg@ver/node_modules/pkg).
 */
export function getPackageName(id: string): string | null {
    const nmIdx = id.lastIndexOf("node_modules/");
    if (nmIdx === -1) return null;
    const rest = id.slice(nmIdx + "node_modules/".length);
    if (rest.startsWith("@")) {
        // Scoped package: @org/pkg
        const parts = rest.split("/");
        return parts.length >= 2 ? parts[0] + "/" + parts[1] : null;
    }
    return rest.split("/")[0] || null;
}

// ─── Client build splitting ──────────────────────────────────────────────────

/** Absolute path to vinext's shims directory, used by clientManualChunks. */
const _shimsDir = path.resolve(__dirname, "..", "shims") + "/";

/**
 * manualChunks function for client builds.
 *
 * Splits the client bundle into:
 * - "framework" — React, ReactDOM, and scheduler (loaded on every page)
 * - "vinext"    — vinext shims (router, head, link, etc.)
 *
 * All other vendor code is left to Rollup's default chunk-splitting
 * algorithm.
 */
export function clientManualChunks(id: string): string | undefined {
    if (id.includes("node_modules")) {
        const pkg = getPackageName(id);
        if (!pkg) return undefined;
        if (
            pkg === "react" ||
            pkg === "react-dom" ||
            pkg === "scheduler"
        ) {
            return "framework";
        }
        return undefined;
    }

    if (id.startsWith(_shimsDir)) {
        return "vinext";
    }

    return undefined;
}

/**
 * Rollup output config with manualChunks for client code-splitting.
 */
export const clientOutputConfig = {
    manualChunks: clientManualChunks,
    experimentalMinChunkSize: 10_000,
};

/**
 * Rollup treeshake configuration for production client builds.
 */
export const clientTreeshakeConfig = {
    preset: "recommended" as const,
    moduleSideEffects: "no-external" as const,
};

// ─── Lazy chunk computation ──────────────────────────────────────────────────

/**
 * Compute the set of chunk filenames that are ONLY reachable through dynamic
 * imports (i.e. behind React.lazy(), next/dynamic, or manual import()).
 *
 * These chunks should NOT be modulepreloaded in the HTML — they will be
 * fetched on demand when the dynamic import executes.
 */
export function computeLazyChunks(
    buildManifest: Record<string, {
        file: string;
        isEntry?: boolean;
        isDynamicEntry?: boolean;
        imports?: string[];
        dynamicImports?: string[];
        css?: string[];
    }>
): string[] {
    // Collect all chunk files that are statically reachable from entries
    const eagerFiles = new Set<string>();
    const visited = new Set<string>();
    const queue: string[] = [];

    // Start BFS from all entry chunks
    for (const key of Object.keys(buildManifest)) {
        const chunk = buildManifest[key];
        if (chunk.isEntry) {
            queue.push(key);
        }
    }

    while (queue.length > 0) {
        const key = queue.shift()!;
        if (visited.has(key)) continue;
        visited.add(key);

        const chunk = buildManifest[key];
        if (!chunk) continue;

        // Mark this chunk's file as eager
        eagerFiles.add(chunk.file);

        // Also mark its CSS as eager
        if (chunk.css) {
            for (const cssFile of chunk.css) {
                eagerFiles.add(cssFile);
            }
        }

        // Follow only static imports — NOT dynamicImports
        if (chunk.imports) {
            for (const imp of chunk.imports) {
                if (!visited.has(imp)) {
                    queue.push(imp);
                }
            }
        }
    }

    // Any JS file in the manifest that's NOT in eagerFiles is a lazy chunk
    const lazyChunks: string[] = [];
    const allFiles = new Set<string>();
    for (const key of Object.keys(buildManifest)) {
        const chunk = buildManifest[key];
        if (chunk.file && !allFiles.has(chunk.file)) {
            allFiles.add(chunk.file);
            if (!eagerFiles.has(chunk.file) && chunk.file.endsWith(".js")) {
                lazyChunks.push(chunk.file);
            }
        }
    }

    return lazyChunks;
}
