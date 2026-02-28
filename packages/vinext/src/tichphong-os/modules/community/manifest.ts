/**
 * TichPhong Community Module - Manifest
 * 
 * User-related features: users, comments, requests, user playlists
 */

import { lazy } from 'react';
import type { ModuleManifest } from '../..//core/types';

// Lazy load admin pages
const UserManager = lazy(() => import('@/pages/admin/UserManager'));
const UserPlaylistManager = lazy(() => import('@/pages/admin/UserPlaylistManager'));
const CommentManager = lazy(() => import('@/pages/admin/CommentManager'));
const RequestManager = lazy(() => import('@/pages/admin/RequestManager'));

/**
 * Community Module Manifest
 */
export const communityModuleManifest: ModuleManifest = {
    id: 'community',
    name: 'Cộng Đồng',
    version: '1.0.0',
    description: 'Quản lý người dùng, bình luận, yêu cầu và playlist cá nhân',
    author: 'TichPhong Team',
    type: 'custom',

    // Admin pages
    adminPages: [
        {
            id: 'community-users',
            name: 'Người dùng',
            icon: 'Users',
            path: '/admin/users',
            component: UserManager,
            order: 30,
        },
        {
            id: 'community-user-playlists',
            name: 'Playlist User',
            icon: 'Globe',
            path: '/admin/user-playlists',
            component: UserPlaylistManager,
            order: 31,
        },
        {
            id: 'community-comments',
            name: 'Bình luận',
            icon: 'MessageSquare',
            path: '/admin/comments',
            component: CommentManager,
            order: 32,
        },
        {
            id: 'community-requests',
            name: 'Yêu cầu',
            icon: 'AlertTriangle',
            path: '/admin/requests',
            component: RequestManager,
            order: 33,
        },
    ],

    // Lifecycle
    onEnable: () => {
        console.log('[Community Module] Enabled');
    },
    onDisable: () => {
        console.log('[Community Module] Disabled');
    },
};

export default communityModuleManifest;
