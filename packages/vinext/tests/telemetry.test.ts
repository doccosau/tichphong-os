/**
 * Tests for telemetry/index.ts
 */
import { describe, it, expect } from "vitest";
import { tracer, withSpan, getTraces, clearTraces, withTracing } from "../src/telemetry/index.js";

describe("tracer", () => {
    it("should create a span", () => {
        const span = tracer.startSpan("test-op");
        span.setAttribute("key", "value");
        span.end();
        expect(span).toBeDefined();
    });
});

describe("withSpan", () => {
    it("should execute function and return result", async () => {
        const result = await withSpan("compute", async () => 42);
        expect(result).toBe(42);
    });

    it("should record errors", async () => {
        await expect(
            withSpan("fail", async () => {
                throw new Error("test error");
            }),
        ).rejects.toThrow("test error");
    });

    it("should store traces in buffer", async () => {
        clearTraces();
        await withSpan("op-1", async () => "a");
        await withSpan("op-2", async () => "b");
        const traces = getTraces();
        expect(traces.length).toBeGreaterThanOrEqual(2);
        expect(traces.some((t) => t.name === "op-1")).toBe(true);
        expect(traces.some((t) => t.name === "op-2")).toBe(true);
    });
});

describe("clearTraces", () => {
    it("should clear the buffer", async () => {
        await withSpan("temp", async () => { });
        clearTraces();
        expect(getTraces().length).toBe(0);
    });
});

describe("withTracing", () => {
    it("should wrap a handler with tracing", async () => {
        const handler = async (req: Request) =>
            new Response("ok", { status: 200 });
        const traced = withTracing(handler);
        const res = await traced(new Request("http://localhost/api/test"));
        expect(res.status).toBe(200);
    });
});
