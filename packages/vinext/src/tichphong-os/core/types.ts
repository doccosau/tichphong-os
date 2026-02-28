/**
 * TichPhong OS Framework - Core Types (v7.0 Specification)
 */

export type EventLane = 'urgent' | 'interactive' | 'background';
export type AuthoritySource = 'client' | 'server' | 'realtime' | 'worker';

/**
 * Cấu trúc Sự kiện chuẩn (Event Envelope) theo Hiến Pháp v7.0.
 * Mọi giao tiếp giữa các phân hệ (Audio, Tu Tiên, Chat...) đều qua Event này.
 */
export interface KernelEvent<TPayload = any> {
    traceId: string;       // ID Truy vết (Bắt buộc để debug và observability)
    eventType: string;     // Định dạng: tp:<subsystem>:<action>
    subsystem: string;     // ID của phân hệ: ví dụ "audio", "cultivation"
    authority: AuthoritySource; // Nguồn sự thật: client, server, realtime...
    lane: EventLane;       // Làn xử lý: urgent (ngay lập tức) | interactive (thời gian thực) | background (chạy nền)
    payload: TPayload;     // Dữ liệu đi kèm hành động
    timestamp: number;     // Thời gian khởi tạo sự kiện
    version: string;       // Phiên bản schema của sự kiện
}

export interface EmitOptions {
    urgent?: boolean;
    authoritative?: boolean;
    traceId?: string;
    lane?: EventLane;
}
