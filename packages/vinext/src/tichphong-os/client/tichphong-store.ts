/**
 * TichPhong OS - BaseStore Factory
 * Trừu tượng hóa cách khởi tạo Zustand Store kèm theo Persist (Lưu trạng thái Offline).
 * Triết lý rút ra từ `src/modules/.../playback.ts` của Nhạc Quán.
 */
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

export function createTichPhongStore<T>(
    name: string,
    initializer: any, // Bỏ qua Type Check phức tạp của Middleware
    persistOptions: any = {}
): import('zustand').UseBoundStore<import('zustand').StoreApi<T>> {
    return create<T>()(
        subscribeWithSelector(
            persist(initializer, {
                name: `tp-os-${name}`,
                ...persistOptions
            })
        )
    ) as any;
}
