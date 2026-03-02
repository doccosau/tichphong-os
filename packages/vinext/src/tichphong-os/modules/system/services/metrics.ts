/**
 * TichPhong OS — System Metrics Service
 *
 * Lightweight, in-memory metrics collector for request/response tracking.
 * Designed to be extended with external backends (Prometheus, Cloudflare
 * Analytics Engine, etc.) in the future.
 *
 * Usage:
 *   import { metrics } from "vinext/tichphong-os/modules/system/services/metrics";
 *   metrics.recordRequest("/api/test", 200, 42);
 *   const report = metrics.getReport();
 */

export interface RequestMetric {
    path: string;
    status: number;
    durationMs: number;
    timestamp: number;
}

export interface MetricsReport {
    totalRequests: number;
    totalErrors: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
    p99LatencyMs: number;
    uptimeSeconds: number;
    memoryMB: {
        rss: number;
        heapUsed: number;
        heapTotal: number;
    };
    statusBreakdown: Record<string, number>;
    topPaths: Array<{ path: string; count: number; avgMs: number }>;
}

/** Maximum number of recent metrics to keep in memory. */
const MAX_BUFFER_SIZE = 10_000;

class MetricsCollector {
    private buffer: RequestMetric[] = [];
    private startTime = Date.now();
    private totalRequests = 0;
    private totalErrors = 0;
    private statusCounts: Record<string, number> = {};
    private pathStats = new Map<string, { count: number; totalMs: number }>();

    /**
     * Record a completed request.
     */
    recordRequest(path: string, status: number, durationMs: number): void {
        this.totalRequests++;
        if (status >= 500) this.totalErrors++;

        const statusGroup = `${Math.floor(status / 100)}xx`;
        this.statusCounts[statusGroup] = (this.statusCounts[statusGroup] || 0) + 1;

        // Track per-path stats
        let pathStat = this.pathStats.get(path);
        if (!pathStat) {
            pathStat = { count: 0, totalMs: 0 };
            this.pathStats.set(path, pathStat);
        }
        pathStat.count++;
        pathStat.totalMs += durationMs;

        // Buffer for percentile calculation
        if (this.buffer.length >= MAX_BUFFER_SIZE) {
            this.buffer.shift();
        }
        this.buffer.push({ path, status, durationMs, timestamp: Date.now() });
    }

    /**
     * Generate a full metrics report.
     */
    getReport(): MetricsReport {
        const durations = this.buffer.map((m) => m.durationMs).sort((a, b) => a - b);
        const avg = durations.length > 0
            ? durations.reduce((a, b) => a + b, 0) / durations.length
            : 0;
        const p95 = durations.length > 0
            ? durations[Math.floor(durations.length * 0.95)] ?? durations[durations.length - 1]
            : 0;
        const p99 = durations.length > 0
            ? durations[Math.floor(durations.length * 0.99)] ?? durations[durations.length - 1]
            : 0;

        const mem = process.memoryUsage();

        // Top 10 paths by request count
        const topPaths = [...this.pathStats.entries()]
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10)
            .map(([path, stat]) => ({
                path,
                count: stat.count,
                avgMs: Math.round(stat.totalMs / stat.count),
            }));

        return {
            totalRequests: this.totalRequests,
            totalErrors: this.totalErrors,
            avgLatencyMs: Math.round(avg * 100) / 100,
            p95LatencyMs: Math.round(p95 * 100) / 100,
            p99LatencyMs: Math.round(p99 * 100) / 100,
            uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
            memoryMB: {
                rss: Math.round(mem.rss / 1024 / 1024),
                heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
                heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
            },
            statusBreakdown: { ...this.statusCounts },
            topPaths,
        };
    }

    /**
     * Reset all metrics (for testing).
     */
    reset(): void {
        this.buffer = [];
        this.totalRequests = 0;
        this.totalErrors = 0;
        this.statusCounts = {};
        this.pathStats.clear();
        this.startTime = Date.now();
    }
}

/** Singleton metrics instance. */
export const metrics = new MetricsCollector();
