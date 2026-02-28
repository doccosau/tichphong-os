import { IClockEngine } from './interfaces';

export class ClockEngine implements IClockEngine {
    private offset: number = 0;
    private lastTransportTime: number = 0;
    private lastUpdateTime: number = 0;
    private playbackRate: number = 1.0;
    private isRunning: boolean = false;

    public synchronize(transportTime: number): void {
        this.lastTransportTime = transportTime;
        this.lastUpdateTime = performance.now();

        // Simple smoothing could go here if transportTime is jittery
        // For now, we trust the transport's latest report as truth anchor
    }

    public start(): void {
        this.isRunning = true;
        this.lastUpdateTime = performance.now();
    }

    public stop(): void {
        this.isRunning = false;
    }

    public getCorrectedTime(): number {
        if (!this.isRunning) {
            return this.lastTransportTime;
        }

        const now = performance.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000; // ms to seconds

        // Extrapolate time based on last sync and playback rate
        return this.lastTransportTime + (deltaTime * this.playbackRate);
    }

    public reset(): void {
        this.offset = 0;
        this.lastTransportTime = 0;
        this.lastUpdateTime = 0;
        this.isRunning = false;
    }

    public setPlaybackRate(rate: number): void {
        // If we change rate, we should re-anchor to prevent jump
        if (this.isRunning) {
            const now = performance.now();
            const currentExtrapolated = this.lastTransportTime + ((now - this.lastUpdateTime) / 1000 * this.playbackRate);
            this.lastTransportTime = currentExtrapolated;
            this.lastUpdateTime = now;
        }
        this.playbackRate = rate;
    }
}
