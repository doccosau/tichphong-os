/**
 * TichPhong OS - System Scheduler
 * Bộ Lập Lịch xử lý các Tác Vụ Nền (Cron Jobs) và Hàng Đợi (Queues) trên Cloudflare Workers.
 * Nhờ sức mạnh này, Hệ Điều Hành có thể làm sạch dữ liệu ngầm mà không làm phiền trải nghiệm Interactive của người dùng.
 */
import { TichPhongSystemKernel } from "./kernel.js";

export class TichPhongScheduler {
    private static instance: TichPhongScheduler;

    private constructor() { }

    public static getInstance(): TichPhongScheduler {
        if (!TichPhongScheduler.instance) {
            TichPhongScheduler.instance = new TichPhongScheduler();
        }
        return TichPhongScheduler.instance;
    }

    /**
     * Dành cho Export `scheduled` trong Cloudflare Worker
     * Luân chuyển sự kiện Cron trực tiếp vào System Kernel ở luồng Background
     */
    public async handleScheduled(event: any, env: any, ctx: any): Promise<void> {
        console.log(`\x1b[36m[TichPhong OS]\x1b[0m Background Cron triggered: ${event.cron}`);
        const kernel = TichPhongSystemKernel.getInstance();

        kernel.emit('tp:system:cron', { event, env, ctx }, {
            lane: 'background',
            authoritative: true
        });
    }

    /**
     * Dành cho Export `queue` trong Cloudflare Worker
     * Luân chuyển sự kiện Hàng Đợi vào System Kernel
     */
    public async handleQueue(batch: any, env: any, ctx: any): Promise<void> {
        console.log(`\x1b[36m[TichPhong OS]\x1b[0m Background Queue received (Size: ${batch.messages?.length || 0})`);
        const kernel = TichPhongSystemKernel.getInstance();

        kernel.emit('tp:system:queue', { batch, env, ctx }, {
            lane: 'background',
            authoritative: true
        });
    }
}
