/**
 * TichPhong OS - CMS Engine Types
 * Định nghĩa kiến trúc phân hệ động (Modules, Plugins, Hooks)
 */

export type HookCallback<T = any> = (data: T, ...args: any[]) => T | void | Promise<T | void>;

export interface HookRegistration {
    id: string;
    callback: HookCallback;
    priority: number;
}

export interface HookMap {
    [hookName: string]: HookRegistration[];
}

export interface RouteConfig {
    path: string;
    component: any; // React Component
    exact?: boolean;
    protected?: boolean;
}

export interface AdminPageConfig {
    id: string;
    name: string;
    icon: string;
    path: string;
    component: any; // React Component
    order?: number;
}

export interface ModuleManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    type: 'music' | 'blog' | 'shop' | 'cms' | 'core' | 'custom';

    routes?: RouteConfig[];
    adminPages?: AdminPageConfig[];
    dependencies?: string[];

    onInstall?: () => void | Promise<void>;
    onEnable?: () => void | Promise<void>;
    onDisable?: () => void | Promise<void>;
}

export interface PluginSetting {
    key: string;
    type: 'string' | 'number' | 'boolean' | 'select';
    label: string;
    defaultValue: any;
    options?: { label: string; value: any }[];
}

export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    defaultEnabled?: boolean;
    hooks?: string[];
    settings?: PluginSetting[];
    dependencies?: string[];

    onInstall?: () => void | Promise<void>;
    onEnable?: () => void | Promise<void>;
    onDisable?: () => void | Promise<void>;
    onUninstall?: () => void | Promise<void>;
}
