/**
 * TichPhong OS - System Store (L1 Cache)
 * Bọc Zustand để gắn kết chặt chẽ vào Lõi Hệ Điều Hành.
 * Gợi cảm hứng từ LibraryStore / PlaybackStore của Nhạc Quán.
 * Mọi thao tác setState() đều có thể tự động Emit Event lên Server (SyncManager).
 */
import { create, StateCreator, StoreApi, UseBoundStore } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';
import { TichPhongSystemKernel } from './kernel';

export interface TichPhongStoreOptions<T> {
    name: string;        // Tên của Store (Ví dụ: 'library', 'auth')
    persist?: boolean;   // Có lưu LocalStorage không?
    persistKey?: string;
}

/**
 * Hàm khởi tạo Store chuẩn HĐH Tích Phong.
 * Framework sẽ bọc Zustand, hỗ trợ cơ chế dispatch KernelEvent tự động.
 */
export function createTichPhongStore<T extends object>(
    options: TichPhongStoreOptions<T>,
    initializer: StateCreator<T>
): UseBoundStore<StoreApi<T>> {

    // Hàm gọi middleware Persist nếu cần
    let storeCreator: any = initializer;

    if (options.persist && options.persistKey) {
        storeCreator = persist(initializer, {
            name: options.persistKey
        });
    }

    // Khởi tạo Zustand nguyên bản
    const useStore = create<T>()(storeCreator);

    // [Ma thuật của TichPhong OS]
    // Gắn thêm Hook đặc quyền: Để lập trình viên có thể Sync dữ liệu bằng cách gọi OS thay vì SyncManager trực tiếp
    // Cách sử dụng (bên App React): 
    // const tuVi = useLibraryStore(s => s.tuVi);
    // TichPhongSystemKernel.getInstance().emit('tp:library:addTuVi', { amount: 10 })
    // -> Sau đó Lõi sẽ gửi về API Server, API Server update DB, xong trả Event về OS, OS cập nhật ngược lại tuVi.

    return useStore;
}

/**
 * BaseStore thuần túy dành cho Module phi-React (Worker/Node)
 */
export abstract class BaseStore<TState> {
    protected state: TState;

    constructor(initialState: TState) {
        this.state = initialState;
    }

    public getState(): TState {
        return this.state;
    }

    public setState(partial: Partial<TState>): void {
        this.state = { ...this.state, ...partial };
        this.onStateChanged(partial);
    }

    /** Hook để override khi State thay đổi (VD: báo cho SystemKernel) */
    protected onStateChanged(partial: Partial<TState>): void {
        TichPhongSystemKernel.getInstance().emit(`tp:store:${this.constructor.name.toLowerCase()}:sync`, partial, { lane: 'background' });
    }
}
