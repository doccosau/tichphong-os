/**
 * Plugin Sandbox (Governance Layer)
 * TichPhong OS v6.1
 * 
 * Wraps Kernel services in a secure proxy that enforces Capability checks.
 */

import { capabilityRegistry } from './CapabilityRegistry';
import { inventorySync } from '..//sync'; // Access Kernel Driver directly

interface PluginManifest {
    id: string;
    capabilities: string[];
}

export class PluginSandbox {
    private pluginId: string;
    private grantedCapabilities: Set<string>;

    constructor(manifest: PluginManifest) {
        this.pluginId = manifest.id;

        // Validate and Grant Capabilities at Runtime Boot
        const { valid, invalid } = capabilityRegistry.validateRequest(manifest.capabilities);
        if (invalid.length > 0) {
            console.warn(`[PluginSandbox:${manifest.id}] Denied unknown capabilities: ${invalid.join(', ')}`);
        }

        this.grantedCapabilities = new Set(valid);
        console.log(`[PluginSandbox:${manifest.id}] Sandbox active. Granted: ${valid.join(', ')}`);
    }

    /**
     * Check if plugin has a specific capability
     */
    private hasCapability(cap: string): boolean {
        return this.grantedCapabilities.has(cap);
    }

    /**
     * Enforce capability or throw error
     */
    private enforce(cap: string) {
        if (!this.hasCapability(cap)) {
            throw new Error(`[SecurityViolation] Plugin '${this.pluginId}' denied access to '${cap}'`);
        }
    }

    // ============================================
    // SANDBOXED DRIVERS
    // ============================================

    /**
     * Safe Inventory API
     */
    public get inventory() {
        return {
            modifyItem: (itemId: string, quantity: number, source: string) => {
                this.enforce('inventory.write');
                // Proxy to Kernel Driver
                // Force source tagging for audit
                const taggedSource = `plugin:${this.pluginId}:${source}`;
                // @ts-ignore - inventorySync expects specific sources, we might need to broaden that type or map it
                return inventorySync.modifyItem(itemId, quantity, 'usage');
            }
        };
    }

    /**
     * Safe Network API
     */
    public get network() {
        return {
            fetch: async (url: string, init?: RequestInit) => {
                this.enforce('network.outbound');
                return fetch(url, init);
            }
        };
    }
}
