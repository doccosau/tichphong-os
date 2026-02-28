/**
 * TichPhong System Module - Manifest
 * 
 * Core system features: dashboard, settings, backup, diagnostics
 */

import { lazy } from 'react';
import type { ModuleManifest } from '../..//core/types';

// Lazy load admin pages
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
const Settings = lazy(() => import('@/pages/admin/Settings'));
const BackupManager = lazy(() => import('@/pages/admin/BackupManager'));
const SystemDiagnostics = lazy(() => import('@/pages/admin/SystemDiagnostics'));
const AudioChecker = lazy(() => import('@/pages/admin/AudioChecker'));
const FrameworkInfo = lazy(() => import('@/pages/admin/FrameworkInfo'));
const Architecture = lazy(() => import('@/pages/admin/Architecture'));
const APIDocs = lazy(() => import('@/pages/admin/APIDocs'));
const ChangeLog = lazy(() => import('@/pages/admin/ChangeLog'));

/**
 * System Module Manifest
 */
export const systemModuleManifest: ModuleManifest = {
    id: 'system',
    name: 'Hệ Thống',
    version: '6.1.0',
    description: 'Quản lý cấu hình, sao lưu, chẩn đoán và tài liệu hệ thống',
    author: 'TichPhong Team',
    type: 'custom',

    // Admin pages
    adminPages: [
        {
            id: 'system-dashboard',
            name: 'Tổng quan',
            icon: 'LayoutDashboard',
            path: '/admin/dashboard',
            component: Dashboard,
            order: 1,
        },
        {
            id: 'system-settings',
            name: 'Cấu hình',
            icon: 'Settings',
            path: '/admin/settings',
            component: Settings,
            order: 2,
        },
        {
            id: 'system-backup',
            name: 'Sao lưu',
            icon: 'Database',
            path: '/admin/backup',
            component: BackupManager,
            order: 3,
        },
        {
            id: 'system-diagnostics',
            name: 'Kiểm tra vận hành',
            icon: 'Activity',
            path: '/admin/system-check',
            component: SystemDiagnostics,
            order: 4,
        },
        {
            id: 'system-audio-check',
            name: 'Quét lỗi audio',
            icon: 'AlertTriangle',
            path: '/admin/audio-check',
            component: AudioChecker,
            order: 5,
        },
        {
            id: 'system-framework',
            name: 'Giới thiệu',
            icon: 'Cpu',
            path: '/admin/framework',
            component: FrameworkInfo,
            order: 50,
        },
        {
            id: 'system-architecture',
            name: 'Kiến trúc',
            icon: 'Globe',
            path: '/admin/architecture',
            component: Architecture,
            order: 51,
        },
        {
            id: 'system-api-docs',
            name: 'API Reference',
            icon: 'Code',
            path: '/admin/api-docs',
            component: APIDocs,
            order: 52,
        },
        {
            id: 'system-changelog',
            name: 'Change Log',
            icon: 'GitBranch',
            path: '/admin/changelog',
            component: ChangeLog,
            order: 53,
        },
    ],

    // Lifecycle
    onEnable: () => {
        console.log('[System Module] Enabled');
    },
    onDisable: () => {
        console.log('[System Module] Disabled');
    },
};

export default systemModuleManifest;
