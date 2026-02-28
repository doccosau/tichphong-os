/**
 * BassBoostNode - WebAudio Bass Enhancement
 * 
 * Uses a lowshelf BiquadFilter to boost low frequencies.
 * Similar to Android's BassBoost AudioFX.
 */
// BassBoostNode - Standalone effect node for SpatialManager

export class BassBoostNode {
    private context: AudioContext;
    private filter: BiquadFilterNode;
    private enabled: boolean = true;

    constructor(context: AudioContext) {
        this.context = context;
        this.filter = context.createBiquadFilter();
        this.filter.type = 'lowshelf';
        this.filter.frequency.value = 150;  // Bass cutoff frequency
        this.filter.gain.value = 0;  // Default: no boost
    }

    public getInputNode(): AudioNode {
        return this.filter;
    }

    public getOutputNode(): AudioNode {
        return this.filter;
    }

    /**
     * Set bass boost strength
     * @param strength 0-1000 (Android format) or 0-1 normalized
     */
    public setStrength(strength: number): void {
        // Normalize if Android format (0-1000)
        const normalized = strength > 1 ? strength / 1000 : strength;

        // Convert to gain in dB (0 to +15dB)
        const gainDb = normalized * 15;
        this.filter.gain.value = gainDb;
    }

    /**
     * Enable/disable bass boost
     */
    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        this.filter.gain.value = enabled ? this.filter.gain.value : 0;
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    public update(params: { strength?: number }): void {
        if (params.strength !== undefined) {
            this.setStrength(params.strength);
        }
    }

    public dispose(): void {
        this.filter.disconnect();
    }
}
