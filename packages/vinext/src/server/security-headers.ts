/**
 * vinext/server/security-headers — Framework-level security headers middleware
 *
 * Applies production security headers to all responses. Configurable via
 * next.config.js or programmatically.
 *
 * Default headers applied:
 * - Strict-Transport-Security (HSTS)
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: SAMEORIGIN
 * - X-XSS-Protection: 0 (deprecated but still expected)
 * - Referrer-Policy: strict-origin-when-cross-origin
 * - Permissions-Policy (camera, microphone, geolocation restrictions)
 * - Content-Security-Policy (configurable)
 *
 * Usage:
 *   import { getSecurityHeaders, type SecurityConfig } from "vinext/server/security-headers";
 *   const headers = getSecurityHeaders({ csp: { directives: { "script-src": ["'self'"] } } });
 */

export interface CSPDirectives {
    "default-src"?: string[];
    "script-src"?: string[];
    "style-src"?: string[];
    "img-src"?: string[];
    "font-src"?: string[];
    "connect-src"?: string[];
    "media-src"?: string[];
    "object-src"?: string[];
    "frame-src"?: string[];
    "frame-ancestors"?: string[];
    "base-uri"?: string[];
    "form-action"?: string[];
    "worker-src"?: string[];
    "manifest-src"?: string[];
    [key: string]: string[] | undefined;
}

export interface SecurityConfig {
    /** Enable HSTS (default: true in production) */
    hsts?: boolean | {
        maxAge?: number;
        includeSubDomains?: boolean;
        preload?: boolean;
    };
    /** X-Frame-Options (default: "SAMEORIGIN") */
    frameOptions?: "DENY" | "SAMEORIGIN" | false;
    /** Content-Security-Policy configuration */
    csp?: {
        directives?: CSPDirectives;
        reportOnly?: boolean;
    } | false;
    /** Referrer-Policy (default: "strict-origin-when-cross-origin") */
    referrerPolicy?: string | false;
    /** Permissions-Policy directives */
    permissionsPolicy?: Record<string, string[]> | false;
    /** X-Content-Type-Options (default: "nosniff") */
    contentTypeOptions?: boolean;
    /** Cross-Origin-Opener-Policy */
    coopPolicy?: string | false;
    /** Cross-Origin-Embedder-Policy */
    coepPolicy?: string | false;
}

const DEFAULT_CSP_DIRECTIVES: CSPDirectives = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "img-src": ["'self'", "data:", "https:", "blob:"],
    "font-src": ["'self'", "https://fonts.gstatic.com"],
    "connect-src": ["'self'", "https:", "wss:"],
    "media-src": ["'self'", "https:", "blob:"],
    "object-src": ["'none'"],
    "frame-ancestors": ["'self'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
};

const DEFAULT_PERMISSIONS_POLICY: Record<string, string[]> = {
    camera: [],
    microphone: [],
    geolocation: [],
    "interest-cohort": [],
};

/**
 * Build a CSP header string from directives.
 */
function buildCSP(directives: CSPDirectives): string {
    return Object.entries(directives)
        .filter(([, values]) => values && values.length > 0)
        .map(([key, values]) => `${key} ${values!.join(" ")}`)
        .join("; ");
}

/**
 * Build a Permissions-Policy header string from directives.
 */
function buildPermissionsPolicy(directives: Record<string, string[]>): string {
    return Object.entries(directives)
        .map(([key, values]) => {
            if (values.length === 0) return `${key}=()`;
            return `${key}=(${values.join(" ")})`;
        })
        .join(", ");
}

/**
 * Generate security headers based on configuration.
 *
 * @returns Record of header name → value to apply to responses
 */
export function getSecurityHeaders(config: SecurityConfig = {}): Record<string, string> {
    const headers: Record<string, string> = {};

    // HSTS
    if (config.hsts !== false) {
        const hsts = typeof config.hsts === "object" ? config.hsts : {};
        const maxAge = hsts.maxAge ?? 31536000; // 1 year
        let value = `max-age=${maxAge}`;
        if (hsts.includeSubDomains !== false) value += "; includeSubDomains";
        if (hsts.preload) value += "; preload";
        headers["Strict-Transport-Security"] = value;
    }

    // X-Content-Type-Options
    if (config.contentTypeOptions !== false) {
        headers["X-Content-Type-Options"] = "nosniff";
    }

    // X-Frame-Options
    if (config.frameOptions !== false) {
        headers["X-Frame-Options"] = config.frameOptions ?? "SAMEORIGIN";
    }

    // Legacy XSS protection (set to 0 to signal reliance on CSP)
    headers["X-XSS-Protection"] = "0";

    // Referrer-Policy
    if (config.referrerPolicy !== false) {
        headers["Referrer-Policy"] = config.referrerPolicy ?? "strict-origin-when-cross-origin";
    }

    // CSP
    if (config.csp !== false) {
        const directives = config.csp?.directives
            ? { ...DEFAULT_CSP_DIRECTIVES, ...config.csp.directives }
            : DEFAULT_CSP_DIRECTIVES;
        const headerName = config.csp?.reportOnly
            ? "Content-Security-Policy-Report-Only"
            : "Content-Security-Policy";
        headers[headerName] = buildCSP(directives);
    }

    // Permissions-Policy
    if (config.permissionsPolicy !== false) {
        const directives = config.permissionsPolicy ?? DEFAULT_PERMISSIONS_POLICY;
        headers["Permissions-Policy"] = buildPermissionsPolicy(directives);
    }

    // COOP
    if (config.coopPolicy !== false && config.coopPolicy) {
        headers["Cross-Origin-Opener-Policy"] = config.coopPolicy;
    }

    // COEP
    if (config.coepPolicy !== false && config.coepPolicy) {
        headers["Cross-Origin-Embedder-Policy"] = config.coepPolicy;
    }

    return headers;
}

/**
 * Apply security headers to a Node.js ServerResponse.
 */
export function applySecurityHeaders(
    res: { setHeader(name: string, value: string): void },
    config?: SecurityConfig,
): void {
    const headers = getSecurityHeaders(config);
    for (const [name, value] of Object.entries(headers)) {
        res.setHeader(name, value);
    }
}
