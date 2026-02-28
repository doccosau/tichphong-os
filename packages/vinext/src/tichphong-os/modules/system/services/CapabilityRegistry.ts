/**
 * Capability Registry (Governance Layer)
 * TichPhong OS v6.1 Enterprise
 * 
 * Defines and tracks all available capabilities within the OS.
 * Plugins must request these capabilities in their manifest to access Kernel resources.
 */

export type CapabilityScope = 'system' | 'user' | 'network' | 'inventory' | 'file';
export type CapabilityLevel = 'read' | 'write' | 'admin';

export interface CapabilityDef {
    id: string;
    scope: CapabilityScope;
    level: CapabilityLevel;
    description: string;
    risk: 'low' | 'medium' | 'high' | 'critical';
}

const SYSTEM_CAPABILITIES: Record<string, CapabilityDef> = {
    'inventory.read': {
        id: 'inventory.read',
        scope: 'inventory',
        level: 'read',
        description: 'Read user inventory and item details',
        risk: 'low'
    },
    'inventory.write': {
        id: 'inventory.write',
        scope: 'inventory',
        level: 'write',
        description: 'Modify user inventory (add/remove items)',
        risk: 'high'
    },
    'quest.write': {
        id: 'quest.write',
        scope: 'user',
        level: 'write',
        description: 'Update quest progress and claim rewards',
        risk: 'medium'
    },
    'network.outbound': {
        id: 'network.outbound',
        scope: 'network',
        level: 'write',
        description: 'Make external API calls',
        risk: 'high'
    },
    'system.admin': {
        id: 'system.admin',
        scope: 'system',
        level: 'admin',
        description: 'Full system access (Kernel only)',
        risk: 'critical'
    }
};

class CapabilityRegistry {
    private static instance: CapabilityRegistry;
    private capabilities: Map<string, CapabilityDef> = new Map();

    private constructor() {
        // Bootstrap system capabilities
        Object.values(SYSTEM_CAPABILITIES).forEach(cap => {
            this.capabilities.set(cap.id, cap);
        });
    }

    public static getInstance(): CapabilityRegistry {
        if (!CapabilityRegistry.instance) {
            CapabilityRegistry.instance = new CapabilityRegistry();
        }
        return CapabilityRegistry.instance;
    }

    public getCapability(id: string): CapabilityDef | undefined {
        return this.capabilities.get(id);
    }

    public getAllCapabilities(): CapabilityDef[] {
        return Array.from(this.capabilities.values());
    }

    public registerCapability(def: CapabilityDef): void {
        if (this.capabilities.has(def.id)) {
            console.warn(`[CapabilityRegistry] Overwriting capability: ${def.id}`);
        }
        this.capabilities.set(def.id, def);
    }

    /**
     * Validate a list of requested capabilities against known definitions
     */
    public validateRequest(requestedCaps: string[]): { valid: string[], invalid: string[] } {
        const valid: string[] = [];
        const invalid: string[] = [];

        requestedCaps.forEach(capId => {
            if (this.capabilities.has(capId)) {
                valid.push(capId);
            } else {
                invalid.push(capId);
            }
        });

        return { valid, invalid };
    }
}

export const capabilityRegistry = CapabilityRegistry.getInstance();
