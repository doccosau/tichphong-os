/**
 * vinext/telemetry — OpenTelemetry integration stub
 *
 * Provides a framework-level abstraction for distributed tracing.
 * Uses OpenTelemetry API when available, falls back to no-op.
 *
 * Usage:
 *   import { tracer, withSpan } from "vinext/telemetry";
 *   const result = await withSpan("my-operation", async (span) => {
 *     span.setAttribute("key", "value");
 *     return doSomething();
 *   });
 */

/** Span status codes */
export type SpanStatus = "ok" | "error" | "unset";

/** Minimal span interface (compatible with OpenTelemetry Span) */
export interface VinextSpan {
    /** Set an attribute on the span */
    setAttribute(key: string, value: string | number | boolean): void;
    /** Record an error event */
    recordException(error: Error): void;
    /** Set the span status */
    setStatus(status: SpanStatus, message?: string): void;
    /** End the span */
    end(): void;
}

/** Span data for no-op and in-memory tracing */
export interface SpanData {
    name: string;
    startTime: number;
    endTime?: number;
    attributes: Record<string, string | number | boolean>;
    status: SpanStatus;
    statusMessage?: string;
    errors: Error[];
}

/** In-memory span implementation for when OpenTelemetry is not installed */
class InMemorySpan implements VinextSpan {
    public data: SpanData;

    constructor(name: string) {
        this.data = {
            name,
            startTime: Date.now(),
            attributes: {},
            status: "unset",
            errors: [],
        };
    }

    setAttribute(key: string, value: string | number | boolean): void {
        this.data.attributes[key] = value;
    }

    recordException(error: Error): void {
        this.data.errors.push(error);
        this.data.status = "error";
        this.data.statusMessage = error.message;
    }

    setStatus(status: SpanStatus, message?: string): void {
        this.data.status = status;
        this.data.statusMessage = message;
    }

    end(): void {
        this.data.endTime = Date.now();
        traceBuffer.push(this.data);
        // Keep buffer bounded
        if (traceBuffer.length > MAX_BUFFER_SIZE) {
            traceBuffer.shift();
        }
    }
}

const MAX_BUFFER_SIZE = 1000;
const traceBuffer: SpanData[] = [];

/**
 * Create a tracer instance.
 * Returns in-memory tracer by default, can be replaced with OpenTelemetry.
 */
export const tracer = {
    /**
     * Start a new span.
     */
    startSpan(name: string): VinextSpan {
        return new InMemorySpan(name);
    },
};

/**
 * Execute a function within a traced span.
 * Automatically handles span lifecycle (start, end, error recording).
 */
export async function withSpan<T>(
    name: string,
    fn: (span: VinextSpan) => Promise<T> | T,
): Promise<T> {
    const span = tracer.startSpan(name);
    try {
        const result = await fn(span);
        span.setStatus("ok");
        return result;
    } catch (error) {
        span.recordException(error as Error);
        throw error;
    } finally {
        span.end();
    }
}

/**
 * Get recent traces from the in-memory buffer.
 */
export function getTraces(limit = 50): SpanData[] {
    return traceBuffer.slice(-limit);
}

/**
 * Clear the trace buffer.
 */
export function clearTraces(): void {
    traceBuffer.length = 0;
}

/**
 * Middleware helper: wrap an API handler with automatic tracing.
 */
export function withTracing(handler: (req: Request) => Promise<Response>): (req: Request) => Promise<Response> {
    return async (req: Request) => {
        const url = new URL(req.url);
        return withSpan(`${req.method} ${url.pathname}`, async (span) => {
            span.setAttribute("http.method", req.method);
            span.setAttribute("http.url", url.pathname);

            const response = await handler(req);

            span.setAttribute("http.status_code", response.status);
            if (response.status >= 400) {
                span.setStatus("error", `HTTP ${response.status}`);
            }

            return response;
        });
    };
}
