/**
 * TichPhong OS - System Hook & Module Registry
 * Sổ bộ lưu trữ các Manifest và thực thi Hooks theo vòng đời.
 */
import type { ModuleManifest, PluginManifest, HookMap, HookCallback } from './types.js';

export class TichPhongCMSRegistry {
    private static instance: TichPhongCMSRegistry;

    private hooks: HookMap = {};
    private modules: Map<string, ModuleManifest> = new Map();
    private plugins: Map<string, PluginManifest> = new Map();

    private constructor() { }

    public static getInstance(): TichPhongCMSRegistry {
        if (!TichPhongCMSRegistry.instance) {
            TichPhongCMSRegistry.instance = new TichPhongCMSRegistry();
        }
        return TichPhongCMSRegistry.instance;
    }

    // ==========================================
    // MODULE MANAGEMENT
    // ==========================================
    public async registerModule(manifest: ModuleManifest): Promise<void> {
        if (this.modules.has(manifest.id)) {
            console.warn(`[TichPhong CMS] Module ${manifest.id} đã được đăng ký!`);
            return;
        }
        this.modules.set(manifest.id, manifest);
        console.log(`\x1b[36m[TichPhong CMS]\x1b[0m + Module: ${manifest.name} (v${manifest.version})`);

        if (manifest.onInstall) await manifest.onInstall();
        if (manifest.onEnable) await manifest.onEnable();
    }

    public getActiveModules(): ModuleManifest[] {
        return Array.from(this.modules.values());
    }

    public getAdminPages() {
        return this.getActiveModules()
            .flatMap(m => m.adminPages || [])
            .sort((a, b) => (a.order || 99) - (b.order || 99));
    }

    // ==========================================
    // HOOK MANAGEMENT
    // ==========================================
    public addHook(hookName: string, id: string, callback: HookCallback, priority: number = 10) {
        if (!this.hooks[hookName]) {
            this.hooks[hookName] = [];
        }
        this.hooks[hookName].push({ id, callback, priority });
        this.hooks[hookName].sort((a, b) => a.priority - b.priority);
    }

    public async executeHook<T>(hookName: string, data: T, ...args: any[]): Promise<T> {
        const registered = this.hooks[hookName] || [];
        let currentData = data;
        for (const hook of registered) {
            try {
                const result = await hook.callback(currentData, ...args);
                if (result !== undefined) {
                    currentData = result as T;
                }
            } catch (err) {
                console.error(`[TichPhong CMS] Lỗi thực thi Hook ${hookName} tại ${hook.id}:`, err);
            }
        }
        return currentData;
    }
}
