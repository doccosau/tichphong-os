import { IDSPNode } from '../IDSPNode';

/**
 * Audiophile dynamics profiles
 */
export interface DynamicsProfile {
    threshold: number;    // dB
    knee: number;         // dB
    ratio: number;        // compression ratio
    attack: number;       // seconds
    release: number;      // seconds
    makeupGain: number;   // dB (applied via output gain)
}

/**
 * DynamicsNode - Compressor/Limiter for "HD Mode" processing
 * 
 * Provides gentle compression to enhance perceived loudness
 * while maintaining dynamic range (audiophile-grade).
 */
export class DynamicsNode implements IDSPNode {
    private context: AudioContext | null = null;
    private inputGain: GainNode | null = null;
    private outputGain: GainNode | null = null;
    private compressor: DynamicsCompressorNode | null = null;
    private isEnabled: boolean = true;
    private currentProfile: DynamicsProfile | null = null;

    public init(context: AudioContext): void {
        this.context = context;

        this.inputGain = context.createGain();
        this.outputGain = context.createGain();
        this.compressor = context.createDynamicsCompressor();

        // Default: Gentle "glue" compression for warmth
        // Or restore saved profile
        if (this.currentProfile) {
            this.setAudiophileProfile(this.currentProfile);
        } else {
            // Defaults
            this.compressor.threshold.value = -24;
            this.compressor.knee.value = 30;
            this.compressor.ratio.value = 2;
            this.compressor.attack.value = 0.003;
            this.compressor.release.value = 0.25;
        }

        // Chain: Input -> Compressor -> Output
        this.reconnect();

        console.log('🎚️ [DynamicsNode] Initialized (Full).');
    }

    public getInput(): AudioNode {
        if (!this.inputGain) throw new Error('[DynamicsNode] Not initialized');
        return this.inputGain;
    }

    public getOutput(): AudioNode {
        if (!this.outputGain) throw new Error('[DynamicsNode] Not initialized');
        return this.outputGain;
    }

    /**
     * Apply an audiophile dynamics profile
     */
    public setAudiophileProfile(profile: DynamicsProfile): void {
        this.currentProfile = profile;

        if (!this.compressor || !this.context || !this.outputGain) return;

        const now = this.context.currentTime;

        try {
            this.compressor.threshold.setValueAtTime(profile.threshold, now);
            this.compressor.knee.setValueAtTime(profile.knee, now);
            this.compressor.ratio.setValueAtTime(profile.ratio, now);
            this.compressor.attack.setValueAtTime(profile.attack, now);
            this.compressor.release.setValueAtTime(profile.release, now);

            // Makeup gain via output
            const makeupLinear = Math.pow(10, profile.makeupGain / 20);
            this.outputGain.gain.setValueAtTime(makeupLinear, now);
        } catch (e) { }
    }

    /**
     * Enable/disable compression (bypass)
     */
    public setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
        this.reconnect();
    }

    private reconnect(): void {
        if (!this.inputGain || !this.compressor || !this.outputGain) return;

        try {
            this.inputGain.disconnect();

            if (this.isEnabled) {
                this.inputGain.connect(this.compressor);
                this.compressor.connect(this.outputGain);
                // Ensure output gain is connected if it was previously? 
                // Wait, loop: input -> compressor -> output
            } else {
                // Bypass: input -> output
                this.inputGain.connect(this.outputGain);
                // We should ensure compressor is disconnected from output to avoid double signal if logic was complex?
                this.compressor.disconnect();
            }
        } catch (e) { }
    }

    public dispose(): void {
        try {
            this.inputGain?.disconnect();
            this.compressor?.disconnect();
            this.outputGain?.disconnect();
        } catch (e) { }
    }
}
