/**
 * TichPhong OS - Subsystem Architecture Standard
 * Định nghĩa các Lớp cơ sở (Base Classes) cho việc xây dựng một Phân Hệ (Subsystem).
 * Tuân thủ tuyệt đối Quy Tắc Trách Nhiệm phần 6.1 Hiến Pháp v7.0
 */
import { KernelEvent } from './types';

/**
 * BaseDriver: Chỉ làm nhiệm vụ I/O (Mạng/Phần cứng). KHÔNG chứa logic nghiệp vụ.
 */
export abstract class BaseDriver {
    abstract connect(): Promise<void> | void;
    abstract disconnect(): Promise<void> | void;
}

/**
 * BaseKernel: CHỨA Logic Nghiệp vụ. KHÔNG gọi UI hoặc API bên ngoài trực tiếp.
 * Phải giao tiếp qua Driver và nhận Event.
 */
export abstract class BaseKernel {
    abstract handleEvent(event: KernelEvent): Promise<void> | void;
}

/**
 * BaseService: Chuyển đổi dữ liệu (Transform) & Kiểm tra hợp lệ (Validate). 
 * KHÔNG thay đổi Store trực tiếp.
 */
export abstract class BaseService {
    // Abstract base logic for services
}

/** Siêu dữ liệu khai báo một Phân Hệ */
export interface ModuleManifest {
    name: string;        // ID Phân hệ, ví dụ: 'audio', 'community'
    version: string;
    description: string;
}

/**
 * TichPhongModule: Vỏ bọc (Container) chứa toàn bộ các khối kiến trúc của một phân hệ.
 */
export abstract class TichPhongModule {
    abstract manifest: ModuleManifest;
    abstract kernel: BaseKernel;

    // Siêu dữ liệu cấu trúc CMS (Admin Route, Layout)
    cmsManifest?: any;

    // Tùy chọn, không phải module nào cũng cần driver (VD: Module tính toán rớt đồ thụ động)
    driver?: BaseDriver;
    service?: BaseService;
    store?: any;

    /** Vòng đời: Khởi tạo module */
    async bootstrap(): Promise<void> {
        if (this.driver) {
            await this.driver.connect();
        }
    }

    /** Vòng đời: Dọn dẹp module */
    async teardown(): Promise<void> {
        if (this.driver) {
            await this.driver.disconnect();
        }
    }
}
