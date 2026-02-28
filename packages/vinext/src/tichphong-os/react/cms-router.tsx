/**
 * TichPhong OS - CMS Dynamic Router
 * Trái tim giao diện Admin. Đọc tuyến đường (Routes) đã đăng ký từ Kernel và Render.
 */
import React, { Suspense, useMemo } from 'react';
import { TichPhongCMSRegistry } from '../cms/registry.js';
import type { AdminPageConfig } from '../cms/types.js';

interface CMSRouterProps {
    currentPath: string;    // Chuỗi đường dẫn hiện tại đang truy cập (VD: /admin/music)
    basePath?: string;      // Tiền tố mốc CMS (Mặc định: /admin)
    layout?: React.ComponentType<{ children: React.ReactNode, menuItems: AdminPageConfig[] }>;
    fallback?: React.ReactNode;
}

export function TichPhongCMSRouter({
    currentPath,
    basePath = '/admin',
    layout: Layout,
    fallback = React.createElement('div', null, 'Đang tải Module...')
}: CMSRouterProps) {
    const adminPages = useMemo(() => {
        return TichPhongCMSRegistry.getInstance().getAdminPages();
    }, []);

    // Tìm trang có path khớp chính xác, hoặc fallback trang đầu tiên
    const activePage = useMemo(() => {
        if (!adminPages.length) return null;
        const matched = adminPages.find(p => p.path === currentPath);
        return matched || adminPages[0];
    }, [adminPages, currentPath]);

    if (!activePage) {
        return React.createElement('div', { className: 'tp-cms-empty' }, 'Chưa có Module CMS nào được đăng ký.');
    }

    const Component = activePage.component;

    // Nếu User truyền vào một CMS Layout chung (để tự vẽ Sidebar), ta sẽ đùm nó lại
    if (Layout) {
        return React.createElement(
            Layout,
            {
                menuItems: adminPages,
                children: React.createElement(
                    Suspense,
                    { fallback },
                    React.createElement(Component, null)
                )
            }
        );
    }

    // Nếu không có Layout (No-core), render trực tiếp màn hình
    return React.createElement(
        Suspense,
        { fallback },
        React.createElement(Component, null)
    );
}

/**
 * Một Hook nhỏ dùng cho các Navbar/Sidebar tùy chỉnh bên ngoài (Lấy danh sách Admin Links)
 */
export function useTichPhongAdminMenu(): AdminPageConfig[] {
    return useMemo(() => {
        return TichPhongCMSRegistry.getInstance().getAdminPages();
    }, []);
}
