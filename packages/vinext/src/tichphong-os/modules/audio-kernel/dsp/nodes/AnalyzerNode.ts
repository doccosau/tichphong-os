/**
 * AnalyzerNode - FFT Analyzer for Visualizers
 * 
 * Provides frequency and waveform data for audio visualization.
 */
import { IDSPNode } from '../IDSPNode';

export class AnalyzerNode implements IDSPNode {
    private context: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private inputGain: GainNode | null = null;

    // FFT settings
    private fftSize: number = 2048;
    private smoothingTimeConstant: number = 0.8;

    // Data buffers
    private frequencyData: Uint8Array | null = null;
    private waveformData: Uint8Array | null = null;

    public init(context: AudioContext): void {
        this.context = context;

        // Create analyzer
        this.analyser = context.createAnalyser();
        this.analyser.fftSize = this.fftSize;
        this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;

        // Input gain (pass-through)
        this.inputGain = context.createGain();
        this.inputGain.gain.value = 1.0;

        // Connect: Input → Analyser (for analysis) + Output (pass-through)
        this.inputGain.connect(this.analyser);

        // Initialize data buffers
        this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        this.waveformData = new Uint8Array(this.analyser.fftSize);

        console.log('📊 [AnalyzerNode] Initialized with FFT size:', this.fftSize);
    }

    public getInput(): AudioNode {
        if (!this.inputGain) throw new Error('[AnalyzerNode] Not initialized');
        return this.inputGain;
    }

    public getOutput(): AudioNode {
        // Pass-through: input goes directly to output
        if (!this.inputGain) throw new Error('[AnalyzerNode] Not initialized');
        return this.inputGain;
    }

    /**
     * Get frequency domain data (for bar visualizers)
     */
    public getFrequencyData(): Uint8Array {
        if (!this.analyser || !this.frequencyData) {
            return new Uint8Array(0);
        }
        this.analyser.getByteFrequencyData(this.frequencyData);
        return this.frequencyData;
    }

    /**
     * Get time domain data (for waveform visualizers)
     */
    public getWaveformData(): Uint8Array {
        if (!this.analyser || !this.waveformData) {
            return new Uint8Array(0);
        }
        this.analyser.getByteTimeDomainData(this.waveformData);
        return this.waveformData;
    }

    /**
     * Get frequency bin count (number of frequency bars)
     */
    public getBinCount(): number {
        return this.analyser?.frequencyBinCount || 0;
    }

    /**
     * Set FFT size (must be power of 2: 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768)
     */
    public setFFTSize(size: number): void {
        this.fftSize = size;
        if (this.analyser) {
            this.analyser.fftSize = size;
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
            this.waveformData = new Uint8Array(size);
        }
    }

    /**
     * Set smoothing (0 = no smoothing, 1 = max smoothing)
     */
    public setSmoothing(value: number): void {
        this.smoothingTimeConstant = Math.max(0, Math.min(1, value));
        if (this.analyser) {
            this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;
        }
    }

    /**
     * Get raw AnalyserNode for direct access
     */
    public getAnalyser(): AnalyserNode | null {
        return this.analyser;
    }

    public dispose(): void {
        if (this.inputGain) {
            try { this.inputGain.disconnect(); } catch (e) { }
        }
        if (this.analyser) {
            try { this.analyser.disconnect(); } catch (e) { }
        }
        this.context = null;
        this.analyser = null;
        this.inputGain = null;
        this.frequencyData = null;
        this.waveformData = null;
    }
}
