import { describe, it, expect } from "vitest";
import { matchRedirect, matchHeaders } from "../src/config/config-matchers.js";

describe("TichPhong OS Config Matchers", () => {
    describe("matchRedirect", () => {
        it("should redirect when source matches perfectly", () => {
            const redirects = [
                { source: "/old-blog", destination: "/blog/new", permanent: true },
            ];

            const result = matchRedirect("/old-blog", redirects);
            expect(result).toBeDefined();
            expect(result?.destination).toBe("/blog/new");
            expect(result?.permanent).toBe(true);
        });

        it("should return null for non-matching URLs", () => {
            const redirects = [
                { source: "/old-blog", destination: "/blog/new", permanent: true },
            ];
            const result = matchRedirect("/blog", redirects);
            expect(result).toBeNull();
        });
    });

    describe("matchHeaders", () => {
        it("should match headers based on path and append the right headers", () => {
            const rules = [
                {
                    source: "/api/:path*",
                    headers: [
                        { key: "x-tichphong-os", value: "active" }
                    ]
                }
            ];

            const matchedHeaders = matchHeaders("/api/v1/users", rules);
            expect(matchedHeaders).toHaveLength(1);
            expect(matchedHeaders[0].key).toBe("x-tichphong-os");
            expect(matchedHeaders[0].value).toBe("active");
        });
    });
});
