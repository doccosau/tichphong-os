/**
 * Tests for deploy.ts — project detection and config generation.
 *
 * Covers: detectProject, generateWranglerConfig, generateAppRouterWorkerEntry,
 * generatePagesRouterWorkerEntry, buildWranglerDeployArgs.
 */
import { describe, it, expect } from "vitest";
import {
    generateWranglerConfig,
    generateAppRouterWorkerEntry,
    generatePagesRouterWorkerEntry,
    buildWranglerDeployArgs,
    type ProjectInfo,
} from "../src/deploy.js";

function makeProjectInfo(overrides: Partial<ProjectInfo> = {}): ProjectInfo {
    return {
        root: "/tmp/test-project",
        isAppRouter: true,
        isPagesRouter: false,
        hasViteConfig: false,
        hasWranglerConfig: false,
        hasWorkerEntry: false,
        hasCloudflarePlugin: false,
        hasRscPlugin: false,
        hasWrangler: false,
        projectName: "test-project",
        hasISR: false,
        hasTypeModule: true,
        hasMDX: false,
        hasCodeHike: false,
        nativeModulesToStub: [],
        ...overrides,
    };
}

// ─── generateWranglerConfig ───────────────────────────────────────────────────

describe("generateWranglerConfig", () => {
    it("should generate valid JSON with project name", () => {
        const config = generateWranglerConfig(makeProjectInfo());
        const parsed = JSON.parse(config);
        expect(parsed.name).toBe("test-project");
        expect(parsed.compatibility_flags).toContain("nodejs_compat");
        expect(parsed.main).toBe("./worker/index.ts");
    });

    it("should include KV namespace when ISR is detected", () => {
        const config = generateWranglerConfig(makeProjectInfo({ hasISR: true }));
        const parsed = JSON.parse(config);
        expect(parsed.kv_namespaces).toBeDefined();
        expect(parsed.kv_namespaces[0].binding).toBe("VINEXT_CACHE");
    });

    it("should not include KV namespace without ISR", () => {
        const config = generateWranglerConfig(makeProjectInfo({ hasISR: false }));
        const parsed = JSON.parse(config);
        expect(parsed.kv_namespaces).toBeUndefined();
    });

    it("should include images binding", () => {
        const config = generateWranglerConfig(makeProjectInfo());
        const parsed = JSON.parse(config);
        expect(parsed.images).toBeDefined();
        expect(parsed.images.binding).toBe("IMAGES");
    });

    it("should include assets binding", () => {
        const config = generateWranglerConfig(makeProjectInfo());
        const parsed = JSON.parse(config);
        expect(parsed.assets.binding).toBe("ASSETS");
    });
});

// ─── Worker Entry Generation ──────────────────────────────────────────────────

describe("generateAppRouterWorkerEntry", () => {
    it("should generate valid TypeScript", () => {
        const entry = generateAppRouterWorkerEntry();
        expect(entry).toContain("import handler from");
        expect(entry).toContain("handleImageOptimization");
        expect(entry).toContain("export default");
    });

    it("should include cache handler setup", () => {
        const entry = generateAppRouterWorkerEntry();
        expect(entry).toContain("KVCacheHandler");
        expect(entry).toContain("setCacheHandler");
    });
});

describe("generatePagesRouterWorkerEntry", () => {
    it("should generate valid TypeScript", () => {
        const entry = generatePagesRouterWorkerEntry();
        expect(entry).toContain("renderPage");
        expect(entry).toContain("handleApiRoute");
        expect(entry).toContain("handleImageOptimization");
        expect(entry).toContain("export default");
    });
});

// ─── buildWranglerDeployArgs ──────────────────────────────────────────────────

describe("buildWranglerDeployArgs", () => {
    it("should default to production deploy", () => {
        const result = buildWranglerDeployArgs({});
        expect(result.args).toEqual(["deploy"]);
        expect(result.env).toBeUndefined();
    });

    it("should add preview env when preview is true", () => {
        const result = buildWranglerDeployArgs({ preview: true });
        expect(result.args).toContain("--env");
        expect(result.args).toContain("preview");
        expect(result.env).toBe("preview");
    });

    it("should use custom env name", () => {
        const result = buildWranglerDeployArgs({ env: "staging" });
        expect(result.args).toContain("--env");
        expect(result.args).toContain("staging");
        expect(result.env).toBe("staging");
    });

    it("should prefer env over preview", () => {
        const result = buildWranglerDeployArgs({ preview: true, env: "staging" });
        expect(result.env).toBe("staging");
    });
});
