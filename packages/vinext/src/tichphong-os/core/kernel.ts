/**
 * TichPhong OS - System Kernel
 * Hạt nhân trung tâm điều phối toàn bộ Hệ Điều Hành.
 * (Routing, Tracing, Dispatch theo các Làn Urgent/Interactive/Background)
 */
import { KernelEvent, EmitOptions, EventLane } from './types.js';
import { TichPhongModule } from './module.js';
import { TichPhongCMSRegistry } from '../cms/registry.js';
import type { ModuleManifest } from '../cms/types.js';

export class TichPhongSystemKernel {
    private static instance: TichPhongSystemKernel;
    private modules: Map<string, TichPhongModule> = new Map();
    public cms: TichPhongCMSRegistry;

    private constructor() {
        // Singleton private constructor
        this.cms = TichPhongCMSRegistry.getInstance();
    }

    public static getInstance(): TichPhongSystemKernel {
        if (!TichPhongSystemKernel.instance) {
            TichPhongSystemKernel.instance = new TichPhongSystemKernel();
        }
        return TichPhongSystemKernel.instance;
    }

    /**
     * Nạp một Phân hệ (Subsystem) vào Nhân hệ thống
     */
    public async registerModule(mod: TichPhongModule): Promise<void> {
        const name = mod.manifest.name;
        if (this.modules.has(name)) {
            console.warn(`[TP-OS] Module ${name} đã được đăng ký!`);
            return;
        }
        this.modules.set(name, mod);

        // Đăng ký cho CMS nếu có CMS Manifest hợp lệ
        if (mod.cmsManifest) {
            await this.cms.registerModule(mod.cmsManifest);
        }

        await mod.bootstrap();
        console.log(`[TP-OS] Đã nạp Module: ${name} (v${mod.manifest.version})`);
    }

    /**
     * Dành cho việc load CMS riêng lẻ qua manifest
     */
    public async loadCMSModule(manifest: ModuleManifest): Promise<void> {
        await this.cms.registerModule(manifest);
    }

    /**
     * Phát (Emit) một Sự Kiện vào Cổng Điều Phối (Dispatch Portal)
     */
    public emit(
        eventType: string,
        payload: any,
        options: EmitOptions = {}
    ): void {
        // Parse event type: tp:<subsystem>:<action>
        const parts = eventType.split(':');
        if (parts.length < 3 || parts[0] !== 'tp') {
            console.error(`[TP-OS] Lỗi định dạng Sự kiện. Yêu cầu: tp:<subsystem>:<action>, nhận được: ${eventType}`);
            return;
        }

        const subsystem = parts[1];

        // Xác định Làn (Lane) ưu tiên
        let lane: EventLane = options.lane || 'interactive';
        if (options.urgent) lane = 'urgent';

        // Khởi tạo Event Envelope chuẩn
        const event: KernelEvent = {
            traceId: options.traceId || this.generateTraceId(),
            eventType,
            subsystem,
            authority: options.authoritative ? 'server' : 'client',
            lane,
            payload,
            timestamp: Date.now(),
            version: '1.0'
        };

        // Capture authoritative server-emitted events if inside a Server Action scope
        if (event.authority === 'server') {
            import('../sync/server-action-context.js')
                .then(m => m.addServerActionEvent(event))
                .catch(err => console.error('[TP-OS] Failed to capture Server Action event:', err));
        }

        // Phân phối sự kiện
        this.dispatch(event);
    }

    /**
     * Điều hướng Sự Kiện (Routing & Dispatching)
     * Gửi Event đến Kernel của phân hệ tương ứng
     */
    private dispatch(event: KernelEvent): void {
        const targetModule = this.modules.get(event.subsystem);

        if (!targetModule) {
            console.warn(`[TP-OS] Không tìm thấy Phân hệ (Subsystem) cho: ${event.subsystem}`);
            return;
        }

        // Lập lịch xử lý tùy theo Lane (Mô phỏng đơn giản)
        // Làn khẩn cấp (Urgent) thì chạy ưu tiên nhất
        if (event.lane === 'urgent') {
            // Xử lý đồng bộ / ưu tiên
            targetModule.kernel.handleEvent(event);
        } else if (event.lane === 'background') {
            // Nền (Batched/Idle)
            // Trong môi trường Worker, có thể dùng ctx.waitUntil
            // Trong trình duyệt, có thể dùng requestIdleCallback
            setTimeout(() => targetModule.kernel.handleEvent(event), 100);
        } else {
            // Tương tác (Interactive) - mặc định
            targetModule.kernel.handleEvent(event);
        }
    }

    // Helper: Tạo TraceId siêu nhẹ
    private generateTraceId(): string {
        return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    }
}
