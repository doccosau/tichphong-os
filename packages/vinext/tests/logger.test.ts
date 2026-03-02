/**
 * Tests for utils/logger.ts
 *
 * Covers: createLogger, log level filtering, output format.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createLogger } from "../src/utils/logger.js";

describe("createLogger", () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { });
        vi.spyOn(console, "debug").mockImplementation(() => { });
        vi.spyOn(console, "warn").mockImplementation(() => { });
        vi.spyOn(console, "error").mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should create a logger with all methods", () => {
        const log = createLogger("TestModule");
        expect(typeof log.debug).toBe("function");
        expect(typeof log.info).toBe("function");
        expect(typeof log.warn).toBe("function");
        expect(typeof log.error).toBe("function");
    });

    it("should call console.log for info level", () => {
        const log = createLogger("TestModule");
        log.info("Hello world");
        expect(console.log).toHaveBeenCalled();
    });

    it("should call console.warn for warn level", () => {
        const log = createLogger("TestModule");
        log.warn("Something risky");
        expect(console.warn).toHaveBeenCalled();
    });

    it("should call console.error for error level", () => {
        const log = createLogger("TestModule");
        log.error("Something broke");
        expect(console.error).toHaveBeenCalled();
    });

    it("should include module name in output", () => {
        const log = createLogger("MyModule");
        log.info("Test message");
        const output = (console.log as any).mock.calls[0][0] as string;
        expect(output).toContain("MyModule");
    });

    it("should include meta data when provided", () => {
        const log = createLogger("MyModule");
        log.info("Request handled", { path: "/test", status: 200 });
        const output = (console.log as any).mock.calls[0][0] as string;
        expect(output).toContain("/test");
    });
});
