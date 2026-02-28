/**
 * ReverbNode - WebAudio Reverb Effect
 * 
 * Uses ConvolverNode with generated impulse responses
 * to simulate different room sizes (like Android's PresetReverb).
 */
import { IDSPNode } from '../IDSPNode';

export type ReverbPreset =
    | 'NONE'
    | 'SMALL_ROOM'
    | 'MEDIUM_ROOM'
    | 'LARGE_ROOM'
    | 'MEDIUM_HALL'
    | 'LARGE_HALL'
    | 'PLATE';

// Reverb parameters by preset
const REVERB_PARAMS: Record<ReverbPreset, { decay: number; wet: number }> = {
    NONE: { decay: 0, wet: 0 },
    SMALL_ROOM: { decay: 0.3, wet: 0.15 },
    MEDIUM_ROOM: { decay: 0.6, wet: 0.2 },
    LARGE_ROOM: { decay: 1.0, wet: 0.25 },
    MEDIUM_HALL: { decay: 1.5, wet: 0.3 },
    LARGE_HALL: { decay: 2.5, wet: 0.35 },
    PLATE: { decay: 1.8, wet: 0.4 }
};

export class ReverbNode implements IDSPNode {
    private context: AudioContext | null = null;
    private inputGain: GainNode | null = null;
    private outputGain: GainNode | null = null;
    private convolver: ConvolverNode | null = null;
    private dryGain: GainNode | null = null;
    private wetGain: GainNode | null = null;
    private enabled: boolean = true;
    private currentPreset: ReverbPreset = 'NONE';

    constructor() {
        // Late initialization
    }

    public init(context: AudioContext): void {
        this.context = context;

        // Create nodes
        this.inputGain = context.createGain();
        this.outputGain = context.createGain();
        this.convolver = context.createConvolver();
        this.dryGain = context.createGain();
        this.wetGain = context.createGain();

        // Dry/Wet mix default
        this.dryGain.gain.value = 1;
        this.wetGain.gain.value = 0;

        // Parallel routing: Input → Dry + (Convolver → Wet) → Output
        this.inputGain.connect(this.dryGain);
        this.inputGain.connect(this.convolver);
        this.convolver.connect(this.wetGain);

        this.dryGain.connect(this.outputGain);
        this.wetGain.connect(this.outputGain);

        // Initialize with default or saved preset
        this.setPreset(this.currentPreset);
    }

    public getInput(): AudioNode {
        if (!this.inputGain) throw new Error('ReverbNode not initialized');
        return this.inputGain;
    }

    public getOutput(): AudioNode {
        if (!this.outputGain) throw new Error('ReverbNode not initialized');
        return this.outputGain;
    }

    public getInputNode(): AudioNode {
        return this.getInput();
    }

    public getOutputNode(): AudioNode {
        return this.getOutput();
    }

    /**
     * Set reverb preset (Legacy support)
     */
    public setPreset(preset: ReverbPreset): void {
        this.currentPreset = preset;

        if (!this.context || !this.wetGain || !this.convolver) return;

        const params = REVERB_PARAMS[preset];

        if (preset === 'NONE') {
            this.setAmbienceConfig({
                enabled: false,
                reverbType: 'NONE',
                wet: 0,
                decay: 0
            });
        } else {
            this.setAmbienceConfig({
                enabled: true,
                reverbType: preset, // approximate mapping
                wet: params.wet,
                decay: params.decay
            });
        }
    }

    /**
     * Set granular ambience config
     */
    public setAmbienceConfig(config: { enabled: boolean; reverbType: string; wet: number; decay: number }): void {
        this.enabled = config.enabled;

        if (!this.context || !this.wetGain || !this.convolver) return;

        if (!config.enabled) {
            this.wetGain.gain.setTargetAtTime(0, this.context.currentTime, 0.1);
            return;
        }

        const wetAmount = Math.min(1, Math.max(0, config.wet));
        this.wetGain.gain.setTargetAtTime(wetAmount, this.context.currentTime, 0.1);

        // Regenerate Impulse Response if needed (simplified: always regen for now if decay changed)
        // Optimization: Cache IRs or check if decay actually changed significantly
        this.generateImpulseResponse(config.decay, config.decay > 0 ? 0 : 0);
    }

    private generateImpulseResponse(duration: number, decay: number): void {
        if (!this.context || !this.convolver) return;
        if (duration <= 0) return;

        const sampleRate = this.context.sampleRate;
        const length = sampleRate * duration;
        const impulse = this.context.createBuffer(2, length, sampleRate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);

        for (let i = 0; i < length; i++) {
            const n = length - i;
            // Simple exponential decay noise
            const multi = Math.pow(1 - i / length, decay);
            // Wait, logic for decay param usually implicit in duration or explicit power?
            // ReverbNode original implementation used a simple noise decay.
            // Let's use a standard simple impulse generation.

            // Standard decay: (1 - i/length)^decayParameter
            // But here duration is time.

            // Recreating simple noise burst:
            left[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            right[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
        }

        this.convolver.buffer = impulse;
    }

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (!enabled) {
            this.setPreset('NONE');
        } else {
            this.setPreset(this.currentPreset === 'NONE' ? 'MEDIUM_ROOM' : this.currentPreset);
        }
    }

    public isEnabled(): boolean {
        return this.enabled;
    }
}
