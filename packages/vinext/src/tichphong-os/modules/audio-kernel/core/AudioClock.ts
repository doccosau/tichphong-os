/**
 * AudioClock - High-precision time keeper using AudioContext.currentTime
 * 
 * Tracks playback position accurately, handling pauses, seeks, and drift.
 * Supports offset adjustment for sync scenarios.
 */
export class AudioClock {
    private audioContext: AudioContext;
    private startContextTime: number = 0;      // AudioContext.currentTime when playback started
    private accumulatedTime: number = 0;       // Time accumulated before pauses
    private isRunning: boolean = false;
    private offset: number = 0;                // External offset (for sync)
    private driftCorrection: number = 0;       // Drift correction factor
    private driftSamples: number[] = [];         // BUG 4 FIX: Missing property
    private readonly MAX_DRIFT_SAMPLES = 10;     // BUG 4 FIX: Missing constant

    // For drift detection
    private lastExternalTime: number = 0;
    private lastInternalTime: number = 0;
    private playbackRate: number = 1.0;

    constructor(context: AudioContext) {
        this.audioContext = context;
    }



    /**
     * Set playback rate scaling
     */
    public setPlaybackRate(rate: number): void {
        if (this.playbackRate === rate) return;

        // Snapshot current time properly before changing rate
        if (this.isRunning) {
            this.accumulatedTime = this.getCurrentTime();
            this.startContextTime = this.audioContext.currentTime;
        }
        this.playbackRate = rate;
    }

    /**
     * Get current playback time in seconds (with offset and drift correction)
     */
    public getCurrentTime(): number {
        let time: number;
        if (!this.isRunning) {
            time = this.accumulatedTime;
        } else {
            const elapsed = this.audioContext.currentTime - this.startContextTime;
            time = this.accumulatedTime + (elapsed * this.playbackRate);
        }
        return time + this.offset + this.driftCorrection;
    }

    /**
     * Get raw time without offset/drift (for internal use)
     */
    public getRawTime(): number {
        if (!this.isRunning) {
            return this.accumulatedTime;
        }
        return this.accumulatedTime + (this.audioContext.currentTime - this.startContextTime);
    }

    /**
     * Start/resume the clock
     */
    public resume(): void {
        if (this.isRunning) return;
        this.startContextTime = this.audioContext.currentTime;
        this.isRunning = true;
    }

    /**
     * Pause the clock
     */
    public suspend(): void {
        if (!this.isRunning) return;
        this.accumulatedTime = this.getRawTime();
        this.isRunning = false;
    }

    /**
     * Set time to a specific position (seek/adjustTime)
     */
    public setTime(time: number): void {
        this.accumulatedTime = time;
        if (this.isRunning) {
            this.startContextTime = this.audioContext.currentTime;
        }
    }

    /**
     * Alias for setTime (architecture compatibility)
     */
    public adjustTime(time: number): void {
        this.setTime(time);
    }

    /**
     * Set external offset (for sync scenarios)
     * Positive = clock runs ahead, Negative = clock runs behind
     */
    public setOffset(offsetSeconds: number): void {
        this.offset = offsetSeconds;
    }

    /**
     * Get current offset
     */
    public getOffset(): number {
        return this.offset;
    }

    /**
     * Correct drift based on external time source
     * 
     * Call this periodically with the known "correct" time from an external source
     * (e.g., server time, host's playback position)
     */
    public correctDrift(externalTime: number): void {
        const internalTime = this.getCurrentTime();
        const drift = externalTime - internalTime;

        this.driftSamples.push(drift);
        if (this.driftSamples.length > this.MAX_DRIFT_SAMPLES) {
            this.driftSamples.shift();
        }

        // Use median for stable correction
        const sorted = [...this.driftSamples].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];

        // Apply gradual correction (avoid sudden jumps)
        const correctionRate = 0.1;  // 10% per call
        this.driftCorrection += (median - this.driftCorrection) * correctionRate;

        this.lastExternalTime = externalTime;
        this.lastInternalTime = internalTime;
    }

    /**
     * Get current drift correction value
     */
    public getDriftCorrection(): number {
        return this.driftCorrection;
    }

    /**
     * Reset clock to zero
     */
    public reset(): void {
        this.accumulatedTime = 0;
        this.startContextTime = this.audioContext.currentTime;
        this.offset = 0;
        this.driftCorrection = 0;
        this.driftSamples = [];
    }

    /**
     * Check if clock is running
     */
    public isPlaying(): boolean {
        return this.isRunning;
    }

    /**
     * Get AudioContext sample rate
     */
    public getSampleRate(): number {
        return this.audioContext.sampleRate;
    }
}
