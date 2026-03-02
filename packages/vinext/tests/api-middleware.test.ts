/**
 * Tests for server/api-middleware.ts
 */
import { describe, it, expect } from "vitest";
import { compose, withCors, withRateLimit, withValidation, withLogging, type ApiHandler } from "../src/server/api-middleware.js";

const jsonHandler: ApiHandler = async (req) => {
    return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
};

describe("compose", () => {
    it("should pass request through to handler", async () => {
        const handler = compose(jsonHandler);
        const res = await handler(new Request("http://localhost/api/test"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ ok: true });
    });

    it("should apply middlewares left-to-right", async () => {
        const handler = compose(withCors(), jsonHandler);
        const res = await handler(new Request("http://localhost/api/test"));
        expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });
});

describe("withCors", () => {
    it("should handle OPTIONS preflight", async () => {
        const handler = compose(withCors(), jsonHandler);
        const res = await handler(new Request("http://localhost/api/test", { method: "OPTIONS" }));
        expect(res.status).toBe(204);
        expect(res.headers.get("Access-Control-Allow-Methods")).toContain("GET");
    });

    it("should add CORS headers to all responses", async () => {
        const handler = compose(withCors(), jsonHandler);
        const res = await handler(new Request("http://localhost/api/test"));
        expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });

    it("should support specific origins", async () => {
        const handler = compose(
            withCors({ origin: ["https://example.com", "https://app.example.com"] }),
            jsonHandler,
        );
        const res = await handler(
            new Request("http://localhost/api/test", {
                headers: { Origin: "https://example.com" },
            }),
        );
        expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://example.com");
    });

    it("should support credentials", async () => {
        const handler = compose(withCors({ credentials: true }), jsonHandler);
        const res = await handler(new Request("http://localhost/api/test"));
        expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
    });
});

describe("withRateLimit", () => {
    it("should allow requests under limit", async () => {
        const handler = compose(withRateLimit({ maxRequests: 5 }), jsonHandler);
        const res = await handler(new Request("http://localhost/api/test"));
        expect(res.status).toBe(200);
    });

    it("should block after limit exceeded", async () => {
        const handler = compose(
            withRateLimit({ maxRequests: 2, windowSeconds: 60 }),
            jsonHandler,
        );
        await handler(new Request("http://localhost/api/test"));
        await handler(new Request("http://localhost/api/test"));
        const res = await handler(new Request("http://localhost/api/test"));
        expect(res.status).toBe(429);
        const body = await res.json();
        expect(body.error).toContain("Too many");
    });
});

describe("withValidation", () => {
    it("should pass valid requests", async () => {
        const handler = compose(
            withValidation({
                query: (params) => params.has("page") ? null : "Missing page",
            }),
            jsonHandler,
        );
        const res = await handler(new Request("http://localhost/api/test?page=1"));
        expect(res.status).toBe(200);
    });

    it("should reject invalid queries", async () => {
        const handler = compose(
            withValidation({
                query: (params) => params.has("page") ? null : "Missing page param",
            }),
            jsonHandler,
        );
        const res = await handler(new Request("http://localhost/api/test"));
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toContain("Missing page");
    });

    it("should reject invalid JSON body", async () => {
        const handler = compose(
            withValidation({
                body: (data: any) => data.name ? null : "Name required",
            }),
            jsonHandler,
        );
        const res = await handler(
            new Request("http://localhost/api/test", {
                method: "POST",
                body: "not json",
                headers: { "Content-Type": "application/json" },
            }),
        );
        expect(res.status).toBe(400);
    });
});
