import { IDSPNode } from '../IDSPNode';

/**
 * EQ Band Frequencies (Hz) - 10-band parametric EQ
 */
const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

/**
 * ParametricEQNode - 10-band parametric equalizer
 * 
 * Uses BiquadFilterNodes for each frequency band.
 */
export class ParametricEQNode implements IDSPNode {
    private context: AudioContext | null = null;
    private inputGain: GainNode | null = null;
    private outputGain: GainNode | null = null;
    private filters: BiquadFilterNode[] = [];

    private currentGains: number[] = new Array(10).fill(0);

    constructor() {
        // Ensure gains are always initialized
        this.currentGains = new Array(10).fill(0);
    }

    public init(context: AudioContext): void {
        this.context = context;

        // Create I/O gains
        this.inputGain = context.createGain();
        this.outputGain = context.createGain();

        // Ensure gains are open
        this.inputGain.gain.value = 1.0;
        this.outputGain.gain.value = 1.0;

        // Create filter for each frequency band
        this.filters = EQ_FREQUENCIES.map((freq, i) => {
            const filter = context.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.setValueAtTime(freq, context.currentTime);
            filter.Q.value = 1.4; // Standard Q for parametric EQ

            // Debugging
            if (!Number.isFinite(this.currentGains[i])) {
                console.error(`[EQNode] Gain at index ${i} is non-finite:`, this.currentGains[i]);
                this.currentGains[i] = 0;
            }

            filter.gain.value = this.currentGains[i]; // Apply saved gain
            return filter;
        });

        // Chain: Input -> Filter1 -> Filter2 -> ... -> Output
        let current: AudioNode = this.inputGain;
        for (const filter of this.filters) {
            current.connect(filter);
            current = filter;
        }
        current.connect(this.outputGain);

        console.log('🎚️ [ParametricEQNode] Initialized with 10 bands (Restored).');
    }

    public getInput(): AudioNode {
        if (!this.inputGain) throw new Error('[EQNode] Not initialized');
        return this.inputGain;
    }

    public getOutput(): AudioNode {
        if (!this.outputGain) throw new Error('[EQNode] Not initialized');
        return this.outputGain;
    }

    /**
     * Set all band gains at once
     * @param gains Array of 10 gain values in dB
     */
    /**
     * Set all band gains at once
     * Handles 5-band (Legacy/Mobile) to 10-band (DSP) conversion
     * @param gains Array of gain values in dB
     */
    public setGains(gains: number[]): void {
        let targetGains: number[] = new Array(10).fill(0);

        // Handle 5-band preset (Mobile Compatibility)
        // Mobile: 60, 250, 1k, 4k, 16k
        // DSP:    32, 64,  125, 250, 500, 1k, 2k, 4k, 8k, 16k
        if (gains.length === 5) {
            targetGains[0] = gains[0]; // 32 < 60
            targetGains[1] = gains[0]; // 64 ~ 60
            targetGains[2] = (gains[0] + gains[1]) / 2; // 125 interpolation
            targetGains[3] = gains[1]; // 250
            targetGains[4] = (gains[1] + gains[2]) / 2; // 500
            targetGains[5] = gains[2]; // 1k
            targetGains[6] = (gains[2] + gains[3]) / 2; // 2k
            targetGains[7] = gains[3]; // 4k
            targetGains[8] = (gains[3] + gains[4]) / 2; // 8k
            targetGains[9] = gains[4]; // 16k
        } else {
            // Standard 10-band or map what we have
            for (let i = 0; i < 10; i++) {
                if (i < gains.length) targetGains[i] = gains[i];
            }
        }

        this.currentGains = targetGains.map(g => Number.isFinite(g) ? g : 0);

        if (!this.context) return;

        const now = this.context.currentTime;
        this.currentGains.forEach((gain, i) => {
            if (this.filters[i]) {
                // Smooth transition to prevent zipper noise/clicks
                try {
                    const safeGain = Number.isFinite(gain) ? gain : 0;
                    this.filters[i].gain.cancelScheduledValues(now);
                    this.filters[i].gain.setValueAtTime(this.filters[i].gain.value, now);
                    this.filters[i].gain.linearRampToValueAtTime(safeGain, now + 0.1); // 100ms ramp
                } catch (e) { /* ignore timing errors */ }
            }
        });
    }

    /**
     * Set a single band's gain
     */
    public setBandGain(bandIndex: number, gain: number): void {
        const safeGain = Number.isFinite(gain) ? gain : 0;

        if (bandIndex >= 0 && bandIndex < this.currentGains.length) {
            this.currentGains[bandIndex] = safeGain;
        }

        if (this.filters[bandIndex] && this.context) {
            const now = this.context.currentTime;
            const param = this.filters[bandIndex].gain;

            try {
                param.cancelScheduledValues(now);
                param.setValueAtTime(param.value, now);
                param.linearRampToValueAtTime(safeGain, now + 0.1);
            } catch (e) { }
        }
    }

    /**
     * Get current gains
     */
    public getGains(): number[] {
        return [...this.currentGains];
    }

    public dispose(): void {
        try {
            this.filters.forEach(f => {
                try { f.disconnect(); } catch (e) { }
            });
            this.inputGain?.disconnect();
            this.outputGain?.disconnect();
        } catch (e) { }
    }
}
