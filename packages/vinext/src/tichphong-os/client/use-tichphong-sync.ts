/**
 * TichPhong OS - Native Sync Hook 
 * Đóng vai trò là Terminal nội bộ kết nối Frontend tới SyncManager trên Edge.
 * Mô phỏng lại chính xác luồng hoạt động của `useSyncManager.ts` trên Nhạc Quán.
 */
import { useEffect, useState, useCallback } from 'react';

export interface SyncSession {
    userId: string;
    token?: string;
}

export function useTichPhongSync(session: SyncSession | null) {
    const [status, setStatus] = useState<'online' | 'offline' | 'syncing'>('offline');
    const [pendingEvents, setPendingEvents] = useState(0);

    useEffect(() => {
        if (!session?.userId) {
            setStatus('offline');
            return;
        }
        setStatus('online');
        // Logic phục hồi Connection sẽ nằm tại đây (WebSocket/Polling).
        return () => {
            setStatus('offline');
        };
    }, [session?.userId]);

    const emit = useCallback((eventType: string, payload: any, urgent: boolean = false) => {
        if (!session?.userId) {
            console.warn('[TP-Sync] Không thể emit khi chưa có User Session');
            return;
        }

        const traceId = Math.random().toString(36).substring(2, 10);
        const eventEnvelope = {
            traceId,
            eventType,
            payload,
            lane: urgent ? 'urgent' : 'interactive',
            timestamp: Date.now()
        };

        setPendingEvents(p => p + 1);

        // Bypass Next.js REST bằng Content-Type đặc biệt để chạm đến OS Kernel Server
        fetch('/api/sync/checkpoint', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/tichphong-event',
                'X-User-Id': session.userId
            },
            body: JSON.stringify([eventEnvelope])
        })
            .then(res => res.json())
            .then(data => {
                setPendingEvents(p => Math.max(0, p - 1));
                // Kiểm tra trạng thái đồng bộ
                if (data.success) {
                    console.log(`[TP-Sync] Event ${eventType} acknowledged (Seq: ${data.acknowledged_sequence})`);
                } else {
                    console.warn(`[TP-Sync] Sync conflict:`, data.message);
                }
            })
            .catch(err => {
                console.error(`[TP-Sync] Lỗi mạng khi emit ${eventType}:`, err);
                setStatus('offline');
                // TODO: Fallback vào LocalDB queue (tposDB)
            });
    }, [session?.userId]);

    return {
        status,
        pendingEvents,
        emit
    };
}
