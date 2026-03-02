/**
 * Tests for tichphong-os/modules/system/services/metrics.ts
 */
import { describe, it, expect, beforeEach } from "vitest";
import { metrics } from "../src/tichphong-os/modules/system/services/metrics.js";

describe("MetricsCollector", () => {
    beforeEach(() => {
        metrics.reset();
    });

    it("should start with zero counts", () => {
        const report = metrics.getReport();
        expect(report.totalRequests).toBe(0);
        expect(report.totalErrors).toBe(0);
        expect(report.avgLatencyMs).toBe(0);
    });

    it("should record requests", () => {
        metrics.recordRequest("/api/test", 200, 50);
        metrics.recordRequest("/api/test", 200, 30);
        const report = metrics.getReport();
        expect(report.totalRequests).toBe(2);
        expect(report.totalErrors).toBe(0);
        expect(report.avgLatencyMs).toBe(40);
    });

    it("should count 5xx errors", () => {
        metrics.recordRequest("/api/fail", 500, 100);
        metrics.recordRequest("/api/ok", 200, 10);
        const report = metrics.getReport();
        expect(report.totalErrors).toBe(1);
    });

    it("should track status breakdown", () => {
        metrics.recordRequest("/a", 200, 10);
        metrics.recordRequest("/b", 201, 10);
        metrics.recordRequest("/c", 404, 10);
        metrics.recordRequest("/d", 500, 10);
        const report = metrics.getReport();
        expect(report.statusBreakdown["2xx"]).toBe(2);
        expect(report.statusBreakdown["4xx"]).toBe(1);
        expect(report.statusBreakdown["5xx"]).toBe(1);
    });

    it("should calculate p95 and p99 latencies", () => {
        for (let i = 1; i <= 100; i++) {
            metrics.recordRequest("/api/bench", 200, i);
        }
        const report = metrics.getReport();
        expect(report.p95LatencyMs).toBeGreaterThanOrEqual(95);
        expect(report.p99LatencyMs).toBeGreaterThanOrEqual(99);
    });

    it("should track top paths", () => {
        for (let i = 0; i < 10; i++) metrics.recordRequest("/popular", 200, 10);
        for (let i = 0; i < 3; i++) metrics.recordRequest("/less", 200, 10);
        const report = metrics.getReport();
        expect(report.topPaths[0].path).toBe("/popular");
        expect(report.topPaths[0].count).toBe(10);
    });

    it("should report memory usage", () => {
        const report = metrics.getReport();
        expect(report.memoryMB.rss).toBeGreaterThan(0);
        expect(report.memoryMB.heapUsed).toBeGreaterThan(0);
    });

    it("should report uptime", () => {
        const report = metrics.getReport();
        expect(report.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });
});
