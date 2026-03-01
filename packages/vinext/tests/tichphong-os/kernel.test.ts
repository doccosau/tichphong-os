import { describe, it, expect, vi, beforeEach } from "vitest";
import { TichPhongSystemKernel } from "../../src/tichphong-os/core/kernel.js";
import { TichPhongModule, BaseKernel } from "../../src/tichphong-os/core/module.js";
import type { KernelEvent } from "../../src/tichphong-os/core/types.js";

// Mock Kernel
class MockKernel extends BaseKernel {
    public receivedEvents: KernelEvent[] = [];

    async handleEvent(event: KernelEvent): Promise<void> {
        this.receivedEvents.push(event);
    }
}

// Mock Module
class MockModule extends TichPhongModule {
    manifest = {
        name: "test_subsystem",
        version: "1.0.0",
        description: "A mock subsystem for testing"
    };

    kernel = new MockKernel();

    bootstrap = vi.fn().mockResolvedValue(undefined);
    teardown = vi.fn().mockResolvedValue(undefined);
}

describe("TichPhongSystemKernel", () => {
    let systemKernel: TichPhongSystemKernel;

    beforeEach(() => {
        systemKernel = TichPhongSystemKernel.getInstance();
        // Clear private state to prevent test pollution since it's a singleton
        (systemKernel as any).modules.clear();
    });

    it("should register a module successfully", async () => {
        const mockModule = new MockModule();
        await systemKernel.registerModule(mockModule);
        expect(mockModule.bootstrap).toHaveBeenCalled();
    });

    it("should dispatch events to the correct subsystem", async () => {
        const mockModule = new MockModule();
        await systemKernel.registerModule(mockModule);

        // Emit event targeted at "test_subsystem"
        systemKernel.emit("tp:test_subsystem:action", { foo: "bar" }, { lane: "urgent", authoritative: true });

        const kernel = mockModule.kernel as MockKernel;
        expect(kernel.receivedEvents).toHaveLength(1);

        const event = kernel.receivedEvents[0];
        expect(event.subsystem).toBe("test_subsystem");
        expect(event.lane).toBe("urgent");
        expect(event.authority).toBe("server");
        expect(event.payload.foo).toBe("bar");
    });

    it("should drop invalid events that don't match the tp:<subsystem>:<action> format", () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });
        systemKernel.emit("invalid:format", {});
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Lỗi định dạng Sự kiện"));
        consoleSpy.mockRestore();
    });
});
