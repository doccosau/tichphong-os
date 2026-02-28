/**
 * TichPhong OS Framework - Realtime Driver (v7.0 Specification)
 * (Thay thế Supabase Realtime, tương tác trực tiếp qua Cloudflare Durable Objects / WebSocket Hibernation)
 */
import { BaseDriver } from '../core/module';
import { KernelEvent } from '../core/types';
import { TichPhongSystemKernel } from '../core/kernel';

export interface RealtimeConfig {
    wsUrl: string;
    authSessionId?: string;
    maxRetries?: number;
    backoffBase?: number;
}

export class TichPhongRealtimeDriver extends BaseDriver {
    private ws: WebSocket | null = null;
    private config: RealtimeConfig;
    private pendingBuffer: KernelEvent[] = [];

    // Connection State
    private isConnected: boolean = false;
    private retryCount: number = 0;
    private reconnectTimer: any = null;

    constructor(config: RealtimeConfig) {
        super();
        this.config = {
            maxRetries: 5,
            backoffBase: 1000,
            ...config
        };
    }

    /** 
     * Kết nối (Connection Lifecycle)
     */
    public connect(): void {
        if (this.ws || typeof window === 'undefined') return;

        let fullUrl = this.config.wsUrl;
        if (this.config.authSessionId) {
            fullUrl += `?session=${this.config.authSessionId}`;
        }

        console.log(`[TP-Realtime] Connecting to ${fullUrl}...`);
        this.ws = new WebSocket(fullUrl);

        this.ws.onopen = this.handleOpen.bind(this);
        this.ws.onmessage = this.handleMessage.bind(this);
        this.ws.onclose = this.handleClose.bind(this);
        this.ws.onerror = this.handleError.bind(this);
    }

    public disconnect(): void {
        this.isConnected = false;
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        if (this.ws) {
            this.ws.close(1000, 'Client requested disconnect');
            this.ws = null;
        }
    }

    /**
     * Gửi Sự Kiện (Emit) lên Server / Durable Objects
     */
    public send(event: KernelEvent): void {
        if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('[TP-Realtime] Client Offline. Đưa Event vào Pending Buffer.');
            this.pendingBuffer.push(event);
            return;
        }

        try {
            this.ws.send(JSON.stringify(event));
        } catch (e) {
            console.error('[TP-Realtime] Send failed', e);
            this.pendingBuffer.push(event); // Lưu lại chờ gửi bù
        }
    }

    // ==========================================
    // Lifecycle Handlers
    // ==========================================

    private handleOpen(): void {
        console.log('[TP-Realtime] Khớp nối WebSocket thành công (DO Hibernation Ready).');
        this.isConnected = true;
        this.retryCount = 0;

        // Flush buffer
        if (this.pendingBuffer.length > 0) {
            console.log(`[TP-Realtime] Xả ${this.pendingBuffer.length} events tồn đọng.`);
            const eventsToFlush = [...this.pendingBuffer];
            this.pendingBuffer = []; // Clear current buffer

            eventsToFlush.forEach(ev => this.send(ev));
        }

        // Bỏ qua SystemKernel để Dispatch Event "Lên Đảo" (Online)
        TichPhongSystemKernel.getInstance().emit('tp:system:online', { timestamp: Date.now() }, { urgent: true });
    }

    private handleMessage(msg: MessageEvent): void {
        try {
            const event: KernelEvent = JSON.parse(msg.data);

            // Theo Rule v7.0: D1 Override hoặc Broadcast
            // Nhận diện đây là event từ Server đẩy về Client (Server Authority)
            event.authority = 'server';

            // Xả Event vào Kernel để các Phân hệ tự xử lý
            console.log(`[TP-Realtime] [DO -> Client] Nhận Event: ${event.eventType}`);

            // Bắn vào lõi OS
            TichPhongSystemKernel.getInstance().emit(event.eventType, event.payload, {
                traceId: event.traceId,
                lane: event.lane,
                authoritative: true // Nhấn mạnh là lệnh từ Server
            });

        } catch (e) {
            console.error('[TP-Realtime] Parse message lỗi:', e);
        }
    }

    private handleClose(e: CloseEvent): void {
        this.isConnected = false;
        console.warn(`[TP-Realtime] WebSocket Đóng (Code: ${e.code}).`);
        this.ws = null;

        TichPhongSystemKernel.getInstance().emit('tp:system:offline', { reason: 'close' }, { urgent: true });
        this.scheduleReconnect();
    }

    private handleError(e: Event): void {
        console.error('[TP-Realtime] WebSocket Lỗi:', e);
        // Connection sẽ tự bị close
    }

    private scheduleReconnect(): void {
        if (this.retryCount >= (this.config.maxRetries || 5)) {
            console.error('[TP-Realtime] Hủy Reconnect do vượt ngưỡng thử lại.');
            return;
        }

        const base = this.config.backoffBase || 1000;
        const delay = base * Math.pow(2, this.retryCount);
        this.retryCount++;

        console.log(`[TP-Realtime] Thử kết nối lại lần ${this.retryCount} sau ${delay}ms...`);
        this.reconnectTimer = setTimeout(() => {
            if (!this.isConnected) {
                this.connect();
            }
        }, delay);
    }
}
