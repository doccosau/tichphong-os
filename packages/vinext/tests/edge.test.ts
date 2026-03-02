/**
 * Tests for edge/index.ts
 */
import { describe, it, expect } from "vitest";
import {
    detectRuntime,
    getRuntimeCapabilities,
    createEdgeHandler,
    edgeConfig,
} from "../src/edge/index.js";

describe("detectRuntime", () => {
    it("should detect node runtime in test env", () => {
        const runtime = detectRuntime();
        expect(runtime).toBe("node");
    });
});

describe("getRuntimeCapabilities", () => {
    it("should return node capabilities", () => {
        const caps = getRuntimeCapabilities("node");
        expect(caps.nodeAPIs).toBe(true);
        expect(caps.webCrypto).toBe(true);
        expect(caps.maxExecutionTime).toBe(0);
        expect(caps.maxMemory).toBe(0);
    });

    it("should return workerd capabilities", () => {
        const caps = getRuntimeCapabilities("workerd");
        expect(caps.nodeAPIs).toBe(false);
        expect(caps.maxExecutionTime).toBe(30_000);
        expect(caps.maxMemory).toBe(128);
    });

    it("should return deno capabilities", () => {
        const caps = getRuntimeCapabilities("deno");
        expect(caps.nodeAPIs).toBe(true);
    });

    it("should return bun capabilities", () => {
        const caps = getRuntimeCapabilities("bun");
        expect(caps.nodeAPIs).toBe(true);
    });
});

describe("createEdgeHandler", () => {
    it("should wrap handler with runtime info", async () => {
        const handler = async () => new Response("ok");
        const edgeHandler = createEdgeHandler(handler);
        const res = await edgeHandler(new Request("http://localhost/test"));
        expect(res.status).toBe(200);
        expect(res.headers.get("X-Runtime")).toBe("node");
    });

    it("should handle errors gracefully", async () => {
        const handler = async () => {
            throw new Error("boom");
        };
        const edgeHandler = createEdgeHandler(handler);
        const res = await edgeHandler(new Request("http://localhost/test"));
        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error).toBe("Internal Server Error");
    });
});

describe("edgeConfig", () => {
    it("should return edge config", () => {
        const config = edgeConfig({ regions: ["iad1"] });
        expect(config.runtime).toBe("edge");
        expect(config.regions).toEqual(["iad1"]);
    });

    it("should work with no options", () => {
        const config = edgeConfig();
        expect(config.runtime).toBe("edge");
    });
});
