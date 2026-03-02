/**
 * Structured logger for TichPhong OS / Vinext.
 *
 * In development: colored, human-readable console output.
 * In production: JSON structured logs for machine parsing.
 *
 * Usage:
 *   import { logger } from "../utils/logger.js";
 *   logger.info("Server started", { port: 3000 });
 *   logger.error("Request failed", { url: "/api/test", error: err.message });
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
    level: LogLevel;
    timestamp: string;
    module: string;
    message: string;
    meta?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const LEVEL_COLORS: Record<LogLevel, string> = {
    debug: "\x1b[90m",   // gray
    info: "\x1b[36m",    // cyan
    warn: "\x1b[33m",    // yellow
    error: "\x1b[31m",   // red
};

const RESET = "\x1b[0m";

const isProd = process.env.NODE_ENV === "production";
const minLevel = LOG_LEVELS[(process.env.VINEXT_LOG_LEVEL as LogLevel) ?? (isProd ? "info" : "debug")];

/**
 * Format a log entry for dev (colored human-readable) or prod (JSON).
 */
function formatEntry(entry: LogEntry): string {
    if (isProd) {
        return JSON.stringify(entry);
    }
    const color = LEVEL_COLORS[entry.level];
    const level = entry.level.toUpperCase().padEnd(5);
    const meta = entry.meta && Object.keys(entry.meta).length > 0
        ? ` ${JSON.stringify(entry.meta)}`
        : "";
    return `${color}[${entry.module}]${RESET} ${level} ${entry.message}${meta}`;
}

/**
 * Create a logger instance scoped to a module name.
 */
export function createLogger(module: string) {
    function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
        if (LOG_LEVELS[level] < minLevel) return;

        const entry: LogEntry = {
            level,
            timestamp: new Date().toISOString(),
            module,
            message,
            ...(meta && Object.keys(meta).length > 0 ? { meta } : {}),
        };

        const output = formatEntry(entry);

        switch (level) {
            case "debug":
                console.debug(output);
                break;
            case "info":
                console.log(output);
                break;
            case "warn":
                console.warn(output);
                break;
            case "error":
                console.error(output);
                break;
        }
    }

    return {
        debug: (message: string, meta?: Record<string, unknown>) => log("debug", message, meta),
        info: (message: string, meta?: Record<string, unknown>) => log("info", message, meta),
        warn: (message: string, meta?: Record<string, unknown>) => log("warn", message, meta),
        error: (message: string, meta?: Record<string, unknown>) => log("error", message, meta),
    };
}

/** Default logger for the TichPhong OS module. */
export const logger = createLogger("TichPhong OS");
