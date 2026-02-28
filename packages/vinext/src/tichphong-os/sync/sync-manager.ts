/**
 * TichPhong OS - Backend SyncManager
 * Trái tim điều phối luồng dữ liệu của Server (Môi trường Cloudflare Worker).
 * Thừa hưởng kiến trúc Đồng Bộ D1 (Idempotency, Concurrency Control) từ TichPhong OS v7.0.
 */
import { KernelEvent } from '../core/types';
import { TichPhongSystemKernel } from '../core/kernel';

export interface SyncManagerOptions {
    /** Bật/Tắt log debug */
    debug?: boolean;
}

export interface SyncResult {
    success: boolean;
    acknowledged_sequence: number;
    delta_applied: boolean;
    server_timestamp: number;
    error?: string;
    message?: string;
    validation_status?: 'ok' | 'conflict';
}

export class TichPhongSyncManager {
    private static instance: TichPhongSyncManager;
    private options: SyncManagerOptions;

    private constructor(options: SyncManagerOptions = {}) {
        this.options = options;
    }

    public static getInstance(options?: SyncManagerOptions): TichPhongSyncManager {
        if (!TichPhongSyncManager.instance) {
            TichPhongSyncManager.instance = new TichPhongSyncManager(options);
        }
        return TichPhongSyncManager.instance;
    }

    private log(...args: any[]) {
        if (this.options.debug) console.log('[TP-ServerSync]', ...args);
    }

    private warn(...args: any[]) {
        console.warn('[TP-ServerSync-Warn]', ...args);
    }

    /**
     * Dành cho API Route POST /api/sync/checkpoint gọi vào.
     * @param events Danh sách KernelEvent từ Client truyền lên (Event Envelope)
     * @param ctx Đối tượng Context chứa DB, UserID, TraceID
     */
    public async processCheckpoint(
        events: KernelEvent[],
        ctx: {
            db: any; // D1 Database Instance (Drizzle ORM)
            userId: string;
            traceId?: string;
            // Các config liên quan đến bảng schema của dự án cụ thể (như bảng users, processedEvents)
            schema: {
                usersTable: any;
                processedEventsTable: any;
                userIdField: any;
            }
        }
    ): Promise<SyncResult> {
        const { db, userId, traceId, schema } = ctx;
        const now = Date.now();

        this.log(`Processing Batch cho User ${userId} (Count: ${events?.length || 0}, Trace: ${traceId})`);

        if (!events || events.length === 0) {
            return {
                success: true,
                acknowledged_sequence: 0,
                server_timestamp: now,
                delta_applied: false
            };
        }

        try {
            // Sắp xếp các sự kiện theo Sequence để xử lý theo đúng trình tự thời gian
            const sortedEvents = [...events].sort((a: any, b: any) => (a.seq || 0) - (b.seq || 0));

            // ============================================================
            // 1. LẤY TRẠNG THÁI HIỆN TẠI (STATE & SEQUENCE)
            // ============================================================
            // Giả định schema có dạng: eq(schema.usersTable[schema.userIdField], userId)
            // Tuy nhiên vì ORM không xác định, ta nên dùng query raw hoặc abstract adapter.
            // Để tổng quát hóa: Yêu cầu Core App truyền hàm `getCurrentSequence` vào ctx
            // --- OPTIMISTIC CONCURRENCY ---
            let currentSeq = 0;
            // (Thực tế sẽ gọi DB: SELECT lastEventSeq FROM users WHERE uid = userId)
            // Fake code để logic rõ ràng:
            if (ctx.db && typeof ctx.db.getCurrentSequence === 'function') {
                currentSeq = await ctx.db.getCurrentSequence(userId);
            } else {
                this.warn(`Chưa setup DB Adapter cho getCurrentSequence. Giả định seq = 0.`);
            }

            // ============================================================
            // 2. SÀNG LỌC SỰ KIỆN (SMART IDEMPOTENCY & CONFLICT)
            // ============================================================
            const eventsToProcess: KernelEvent[] = [];

            for (const event of sortedEvents) {
                const eventSeq = (event as any).seq || 0;
                const eventId = (event as any).id || event.traceId;

                if (eventSeq <= currentSeq) {
                    // Sự kiện nằm ở quá khứ: Có thể Duplicate Hoặc Conflict Sequence
                    let isProcessed = false;

                    if (ctx.db && typeof ctx.db.checkEventProcessed === 'function') {
                        isProcessed = await ctx.db.checkEventProcessed(eventId);
                    }

                    if (isProcessed) {
                        // True Duplicate (Idempotent) - Client gửi lại event cũ do rớt mạng -> Bỏ qua an toàn
                        this.log(`Bỏ qua event Duplicate ID: ${eventId}`);
                        continue;
                    } else {
                        // Conflict! Sequence này đã bị event khác chiếm chỗ (Ví dụ mở 2 tab)
                        this.warn(`Xung đột Sequence: Cố dùng Seq ${eventSeq} trong khi DB đã lên ${currentSeq}. User: ${userId}`);
                        return {
                            success: false,
                            error: 'SEQUENCE_CONFLICT',
                            message: 'Sequence number already used',
                            acknowledged_sequence: currentSeq, // Trả về seq đúng để client Sync lại
                            server_timestamp: now,
                            validation_status: 'conflict',
                            delta_applied: false
                        };
                    }
                } else {
                    // Sự kiện mới hoàn toàn
                    eventsToProcess.push(event);
                }
            }

            if (eventsToProcess.length === 0) {
                // Toàn bộ là Duplicate
                this.log(`Idempotency OK: Tất cả ${events.length} event đã được bỏ qua. Seq hiện tại: ${currentSeq}`);
                return {
                    success: true,
                    acknowledged_sequence: currentSeq,
                    server_timestamp: now,
                    validation_status: 'ok',
                    delta_applied: false
                };
            }

            // ============================================================
            // 3. VÒNG LẶP ĐIỀU PHỐI (DISPATCH LOOP)
            // ============================================================
            const kernel = TichPhongSystemKernel.getInstance();
            let lastProcessedSeq = currentSeq;

            for (const event of eventsToProcess) {
                try {
                    // Thay vì Hardcode hàng ngàn dòng switch/case như ALCHEMY, CULTIVATE trong SyncController cũ.
                    // TichPhong OS sẽ bắn Event này vào SystemKernel để tự tìm Phân hệ (Module) xử lý.
                    await kernel.emit(event.eventType, event.payload, {
                        traceId: event.traceId,
                        lane: event.lane,
                        authoritative: true // Nhấn mạnh là luồng Server Auth
                    });

                    // Đánh dấu event đã xử lý xuống processed_events
                    if (ctx.db && typeof ctx.db.markEventProcessed === 'function') {
                        const eventId = (event as any).id || event.traceId;
                        await ctx.db.markEventProcessed({ id: eventId, userId, type: event.eventType });
                    }

                } catch (err) {
                    console.error(`[TP-ServerSync] Lỗi Kernel xử lý event ${event.eventType}:`, err);
                }

                lastProcessedSeq = (event as any).seq || lastProcessedSeq;
            }

            // ============================================================
            // 4. LƯU SEQUENCE MỚI XUỐNG D1
            // ============================================================
            if (ctx.db && typeof ctx.db.updateUserSequence === 'function') {
                await ctx.db.updateUserSequence(userId, lastProcessedSeq);
            }

            this.log(`Checkpoint vòng lặp thành công. Seq hiện tại lên mốc: ${lastProcessedSeq}`);

            return {
                success: true,
                acknowledged_sequence: lastProcessedSeq,
                server_timestamp: Date.now(),
                validation_status: 'ok',
                delta_applied: true
            };

        } catch (e: any) {
            console.error(`[TP-ServerSync] Processing CRASH cho User ${userId}:`, e);
            throw e;
        }
    }
}
