import { IPerformanceMonitor } from './interfaces';

export class PerformanceMonitor implements IPerformanceMonitor {
    private isRunning: boolean = false;
    private score: number = 100;
    private frameDrops: number = 0;
    private lastFrameTime: number = 0;
    private jitterBuffer: number[] = [];
    private monitorInterval: ReturnType<typeof setInterval> | null = null;

    // Thresholds
    private readonly JITTER_THRESHOLD_MS = 30; // >30ms variance is bad
    private readonly SCORE_DECAY = 5; // Points lost per bad event
    private readonly SCORE_RECOVERY = 1; // Points gained per clean cycle

    public start(): void {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.frameDrops = 0;
        this.score = 100;
        this.jitterBuffer = [];

        this.monitorLoop();

        // Periodic cleanup and scoring update
        this.monitorInterval = setInterval(() => {
            this.updateScore();
        }, 2000);
    }

    public stop(): void {
        this.isRunning = false;
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
    }

    public reportFrameDrop(): void {
        this.frameDrops++;
        this.score = Math.max(0, this.score - this.SCORE_DECAY);
    }

    public reportJitter(variance: number): void {
        this.jitterBuffer.push(variance);
        if (this.jitterBuffer.length > 10) this.jitterBuffer.shift();

        if (variance > this.JITTER_THRESHOLD_MS) {
            this.score = Math.max(0, this.score - (this.SCORE_DECAY * 0.5));
        }
    }

    public getScore(): number {
        return this.score;
    }

    public isHealthy(): boolean {
        return this.score > 60;
    }

    private monitorLoop(): void {
        if (!this.isRunning) return;

        requestAnimationFrame(() => {
            const now = performance.now();
            const delta = now - this.lastFrameTime;

            // Expected ~16.6ms (60fps)
            // If delta > 34ms (approx dropped frame or heavy lag), penalize
            if (delta > 34) {
                // Don't punish too hard for background tabs, but track it
                if (document.visibilityState === 'visible') {
                    this.reportFrameDrop();
                }
            }

            this.lastFrameTime = now;
            this.monitorLoop();
        });
    }

    private updateScore(): void {
        // Recovery logic: if recent history is clean, recover score
        if (this.frameDrops === 0) {
            this.score = Math.min(100, this.score + this.SCORE_RECOVERY);
        }
        // Reset counters for next interval
        this.frameDrops = 0;
    }
}
