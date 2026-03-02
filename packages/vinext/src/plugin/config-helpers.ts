/**
 * Next.js config pattern matching and request helpers.
 *
 * Extracted from index.ts to improve maintainability.
 * Includes: env defines, pattern matching, redirects, rewrites, headers,
 * file finding utilities.
 */
import path from "node:path";
import fs from "node:fs";
import {
    safeRegExp,
    matchRedirect,
    matchRewrite,
    matchHeaders,
    proxyExternalRequest,
    type RequestContext,
} from "../config/config-matchers.js";
import type { NextRedirect, NextRewrite, NextHeader } from "../config/next-config.js";

// ─── Environment defines ─────────────────────────────────────────────────────

/**
 * Collect all NEXT_PUBLIC_* env vars and create Vite define entries
 * so they get inlined into the client bundle.
 */
export function getNextPublicEnvDefines(): Record<string, string> {
    const defines: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
        if (key.startsWith("NEXT_PUBLIC_") && value !== undefined) {
            defines[`process.env.${key}`] = JSON.stringify(value);
        }
    }
    return defines;
}

// ─── Pattern matching ────────────────────────────────────────────────────────

/**
 * If the current position in `str` starts with a parenthesized group, consume
 * it and advance `re.lastIndex` past the closing `)`. Returns the group
 * contents or null if no group is present.
 */
export function extractConstraint(str: string, re: RegExp): string | null {
    if (str[re.lastIndex] !== "(") return null;
    const start = re.lastIndex + 1;
    let depth = 1;
    let i = start;
    while (i < str.length && depth > 0) {
        if (str[i] === "(") depth++;
        else if (str[i] === ")") depth--;
        i++;
    }
    if (depth !== 0) return null;
    re.lastIndex = i;
    return str.slice(start, i - 1);
}

/**
 * Match a Next.js route pattern (e.g. "/blog/:slug", "/docs/:path*") against a pathname.
 * Returns matched params or null.
 *
 * Supports:
 *   :param     — matches a single path segment
 *   :param*    — matches zero or more segments (catch-all)
 *   :param+    — matches one or more segments
 *   (regex)    — inline regex patterns in the source
 */
export function matchConfigPattern(
    pathname: string,
    pattern: string,
): Record<string, string> | null {
    // If the pattern contains regex groups like (\\d+) or (.*), use regex matching.
    if (
        pattern.includes("(") ||
        pattern.includes("\\") ||
        /:[\w-]+[*+][^/]/.test(pattern) ||
        /:[\w-]+\./.test(pattern)
    ) {
        try {
            const paramNames: string[] = [];
            let regexStr = "";
            const tokenRe = /:([\w-]+)|[.]|[^:.]+/g;
            let tok: RegExpExecArray | null;
            while ((tok = tokenRe.exec(pattern)) !== null) {
                if (tok[1] !== undefined) {
                    const name = tok[1];
                    const rest = pattern.slice(tokenRe.lastIndex);
                    if (rest.startsWith("*") || rest.startsWith("+")) {
                        const quantifier = rest[0];
                        tokenRe.lastIndex += 1;
                        const constraint = extractConstraint(pattern, tokenRe);
                        paramNames.push(name);
                        if (constraint !== null) {
                            regexStr += `(${constraint})`;
                        } else {
                            regexStr += quantifier === "*" ? "(.*)" : "(.+)";
                        }
                    } else {
                        const constraint = extractConstraint(pattern, tokenRe);
                        paramNames.push(name);
                        regexStr += constraint !== null ? `(${constraint})` : "([^/]+)";
                    }
                } else if (tok[0] === ".") {
                    regexStr += "\\.";
                } else {
                    regexStr += tok[0];
                }
            }
            const re = safeRegExp("^" + regexStr + "$");
            if (!re) return null;
            const match = re.exec(pathname);
            if (!match) return null;
            const params: Record<string, string> = {};
            for (let i = 0; i < paramNames.length; i++) {
                params[paramNames[i]] = match[i + 1] ?? "";
            }
            return params;
        } catch {
            // Fall through to segment-based matching
        }
    }

    // Check for catch-all patterns
    const catchAllMatch = pattern.match(/:([\w-]+)(\*|\+)$/);
    if (catchAllMatch) {
        const prefix = pattern.slice(0, pattern.lastIndexOf(":"));
        const paramName = catchAllMatch[1];
        const isPlus = catchAllMatch[2] === "+";

        if (!pathname.startsWith(prefix.replace(/\/$/, ""))) return null;

        const rest = pathname.slice(prefix.replace(/\/$/, "").length);
        if (isPlus && (!rest || rest === "/")) return null;
        let restValue = rest.startsWith("/") ? rest.slice(1) : rest;
        return { [paramName]: restValue };
    }

    // Simple segment-based matching
    const parts = pattern.split("/");
    const pathParts = pathname.split("/");

    if (parts.length !== pathParts.length) return null;

    const params: Record<string, string> = {};
    for (let i = 0; i < parts.length; i++) {
        if (parts[i].startsWith(":")) {
            params[parts[i].slice(1)] = pathParts[i];
        } else if (parts[i] !== pathParts[i]) {
            return null;
        }
    }
    return params;
}

// ─── URL sanitization ────────────────────────────────────────────────────────

/**
 * Sanitize a redirect/rewrite destination by collapsing leading slashes and
 * backslashes to a single "/" for non-external URLs.
 */
export function sanitizeDestinationLocal(dest: string): string {
    if (dest.startsWith("http://") || dest.startsWith("https://")) return dest;
    dest = dest.replace(/^[\\/]+/, "/");
    return dest;
}

// ─── Redirect/Rewrite/Header application ─────────────────────────────────────

/**
 * Apply redirect rules from next.config.js.
 * Returns true if a redirect was applied.
 */
export function applyRedirects(
    pathname: string,
    res: any,
    redirects: NextRedirect[],
    ctx: RequestContext,
): boolean {
    const result = matchRedirect(pathname, redirects, ctx);
    if (result) {
        const dest = sanitizeDestinationLocal(result.destination);
        res.writeHead(result.permanent ? 308 : 307, { Location: dest });
        res.end();
        return true;
    }
    return false;
}

/**
 * Proxy an external rewrite in the Node.js dev server context.
 */
export async function proxyExternalRewriteNode(
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
    externalUrl: string,
): Promise<void> {
    try {
        const proto = "http";
        const host = req.headers.host || "localhost";
        const origin = `${proto}://${host}`;
        const method = req.method ?? "GET";
        const hasBody = method !== "GET" && method !== "HEAD";
        const init: RequestInit & { duplex?: string } = {
            method,
            headers: Object.fromEntries(
                Object.entries(req.headers)
                    .filter(([, v]) => v !== undefined)
                    .map(([k, v]) => [k, Array.isArray(v) ? v.join(", ") : String(v)]),
            ),
        };
        if (hasBody) {
            const { Readable } = await import("node:stream");
            init.body = Readable.toWeb(req) as unknown as ReadableStream;
            init.duplex = "half";
        }
        const webRequest = new Request(new URL(req.url ?? "/", origin), init);
        const proxyResponse = await proxyExternalRequest(webRequest, externalUrl);

        const nodeHeaders: Record<string, string | string[]> = {};
        proxyResponse.headers.forEach((value, key) => {
            const existing = nodeHeaders[key];
            if (existing !== undefined) {
                nodeHeaders[key] = Array.isArray(existing)
                    ? [...existing, value]
                    : [existing, value];
            } else {
                nodeHeaders[key] = value;
            }
        });
        res.writeHead(proxyResponse.status, nodeHeaders);

        if (proxyResponse.body) {
            const { Readable: ReadableImport } = await import("node:stream");
            const nodeStream = ReadableImport.fromWeb(proxyResponse.body as unknown as import("stream/web").ReadableStream);
            nodeStream.pipe(res);
        } else {
            res.end();
        }
    } catch (e) {
        console.error("[vinext] External rewrite proxy error:", e);
        if (!res.headersSent) {
            res.writeHead(502);
            res.end("Bad Gateway");
        }
    }
}

/**
 * Apply rewrite rules from next.config.js.
 * Returns the rewritten URL or null if no rewrite matched.
 */
export function applyRewrites(
    pathname: string,
    rewrites: NextRewrite[],
    ctx: RequestContext,
): string | null {
    const dest = matchRewrite(pathname, rewrites, ctx);
    if (dest) {
        return sanitizeDestinationLocal(dest);
    }
    return null;
}

/**
 * Apply custom header rules from next.config.js.
 */
export function applyHeaders(
    pathname: string,
    res: any,
    headers: NextHeader[],
    ctx: RequestContext,
): void {
    const matched = matchHeaders(pathname, headers, ctx);
    for (const header of matched) {
        res.setHeader(header.key, header.value);
    }
}

// ─── File utilities ──────────────────────────────────────────────────────────

/**
 * Find a file by name (without extension) in a directory.
 * Checks .tsx, .ts, .jsx, .js extensions.
 */
export function findFileWithExts(dir: string, name: string): string | null {
    const extensions = [".tsx", ".ts", ".jsx", ".js"];
    for (const ext of extensions) {
        const filePath = path.join(dir, name + ext);
        if (fs.existsSync(filePath)) return filePath;
    }
    return null;
}

/**
 * Check if the project has .mdx files in app/ or pages/ directories.
 */
export function hasMdxFiles(root: string, appDir: string | null, pagesDir: string | null): boolean {
    const dirs = [appDir, pagesDir].filter(Boolean) as string[];
    for (const dir of dirs) {
        if (fs.existsSync(dir) && scanDirForMdx(dir)) return true;
    }
    return false;
}

function scanDirForMdx(dir: string): boolean {
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (scanDirForMdx(full)) return true;
            } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
                return true;
            }
        }
    } catch {
        // ignore unreadable dirs
    }
    return false;
}
