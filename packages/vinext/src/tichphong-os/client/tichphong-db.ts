/**
 * TichPhong OS - LocalDB Adapter
 * Lớp trừu tượng quản trị IndexedDB sử dụng Dexie. 
 * Kế thừa triết lý lưu trữ Cache L1 (Bootstrap Cache) từ thư mục `services/db.ts` của Nhạc Quán.
 */
import Dexie, { Table } from 'dexie';

export interface TichPhongCacheEntry {
    id: string;
    data: any;
    timestamp: number;
}

export class TichPhongLocalDB extends Dexie {
    public cache!: Table<TichPhongCacheEntry>;

    constructor(dbName: string = 'TichPhongOS_LocalDB') {
        super(dbName);
        this.version(1).stores({
            cache: 'id' // Primary key
        });
    }

    public async saveCache(id: string, data: any): Promise<void> {
        try {
            await this.cache.put({
                id,
                data,
                timestamp: Date.now()
            });
            console.log(`[TichPhong LocalDB] Đã ghi cache mục: ${id}`);
        } catch (error) {
            console.error(`[TichPhong LocalDB] Lỗi ghi cache ${id}:`, error);
        }
    }

    public async getCache<T = any>(id: string): Promise<T | null> {
        try {
            const entry = await this.cache.get(id);
            if (entry) {
                console.log(`[TichPhong LocalDB] HIT cache mục: ${id}`);
                return entry.data as T;
            }
        } catch (error) {
            console.error(`[TichPhong LocalDB] Lỗi đọc cache ${id}:`, error);
        }
        return null;
    }
}

export const tposDB = new TichPhongLocalDB();
