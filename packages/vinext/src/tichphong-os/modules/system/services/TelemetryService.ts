/**
 * Telemetry Service (Governance Layer)
 * TichPhong OS v6.1.3 Enterprise
 * 
 * Implements Distributed Tracing and Event Lineage.
 * tracks the lifecycle of events from User Space -> Kernel -> Driver -> Cloud.
 */

export interface SpanContext {
    traceId: string;
    spanId: string;
    parentId?: string;
    startTime: number;
}

export interface TelemetryEvent {
    id: string;
    name: string;
    category: 'kernel' | 'network' | 'ui' | 'ghost';
    timestamp: number;
    duration?: number;
    attributes: Record<string, any>;
    context: SpanContext;
}

class TelemetryService {
    private static instance: TelemetryService;
    private buffer: TelemetryEvent[] = [];
    private activeSpans: Map<string, TelemetryEvent> = new Map();

    private constructor() {
        // Init
    }

    public static getInstance(): TelemetryService {
        if (!TelemetryService.instance) {
            TelemetryService.instance = new TelemetryService();
        }
        return TelemetryService.instance;
    }

    /**
     * Start a new Tracing Span
     */
    public startSpan(name: string, parentId?: string, attributes: Record<string, any> = {}): string {
        const spanId = crypto.randomUUID();
        const traceId = parentId ? this.getTraceIdFromSpan(parentId) : crypto.randomUUID();

        const span: TelemetryEvent = {
            id: spanId,
            name,
            category: 'kernel',
            timestamp: Date.now(),
            attributes,
            context: {
                traceId,
                spanId,
                parentId,
                startTime: Date.now()
            }
        };

        this.activeSpans.set(spanId, span);
        return spanId;
    }

    /**
     * End a Tracing Span
     */
    public endSpan(spanId: string, attributes: Record<string, any> = {}) {
        const span = this.activeSpans.get(spanId);
        if (!span) return;

        const duration = Date.now() - span.context.startTime;
        span.duration = duration;
        span.attributes = { ...span.attributes, ...attributes };

        this.activeSpans.delete(spanId);
        this.buffer.push(span);

        // Auto-flush or smart-batching here
        if (this.buffer.length >= 20) {
            this.flush();
        }
    }

    public logEvent(name: string, attributes: Record<string, any> = {}) {
        // One-shot event
        const span = this.startSpan(name, undefined, attributes);
        this.endSpan(span, {});
    }

    private getTraceIdFromSpan(spanId: string): string {
        const span = this.activeSpans.get(spanId);
        return span ? span.context.traceId : crypto.randomUUID();
    }

    private flush() {
        // In a real OS, this sends to OpenTelemetry / Datadog
        // For TichPhong v6.1.3, we log to "System Logs" or a specific debug endpoint
        if (process.env.NODE_ENV === 'development') {
            // console.groupCollapsed(`[Telemetry] Flushed ${this.buffer.length} spans`);
            // console.table(this.buffer.map(s => ({ name: s.name, ms: s.duration, trace: s.context.traceId.slice(0, 6) })));
            // console.groupEnd();
        }

        // Clear buffer
        this.buffer = [];
    }
}

export const telemetry = TelemetryService.getInstance();
