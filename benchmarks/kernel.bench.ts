import { bench, describe } from 'vitest';
import { TichPhongSystemKernel } from '../packages/vinext/src/tichphong-os/core/kernel';
import { TichPhongModule, BaseKernel } from '../packages/vinext/src/tichphong-os/core/module';
import type { KernelEvent } from '../packages/vinext/src/tichphong-os/core/types';

class MockKernel extends BaseKernel {
    handleEvent(_event: KernelEvent) { }
}

class MockModule extends TichPhongModule {
    manifest = {
        name: `perf-module-${Math.random()}`,
        version: '1.0.0',
        description: 'Module for benchmarking'
    };
    kernel = new MockKernel();
}

describe('TichPhong OS Core Benchmarks', () => {
    bench('1. Boot System Kernel (Singleton)', () => {
        // Đo thời gian Hệ Điều Hành khởi động
        TichPhongSystemKernel.getInstance();
    });

    bench('2. Hot-plug Module Registration', () => {
        const kernel = TichPhongSystemKernel.getInstance();
        const mockModule = new MockModule();
        // Đo thời gian cắm nóng (đăng ký) một phân hệ vào lồng ấp Kernel
        kernel.registerModule(mockModule);
    });
});
