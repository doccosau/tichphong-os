
export class TransportWarmupController {
    private element: HTMLAudioElement;
    private minBufferThreshold: number = 2; // seconds
    private checkInterval: ReturnType<typeof setInterval> | null = null; // Fix: ReturnType

    constructor(element: HTMLAudioElement) {
        this.element = element;
    }

    /**
     * Set custom buffer threshold (e.g. higher for high latency)
     */
    public setThreshold(seconds: number): void {
        this.minBufferThreshold = seconds;
    }

    /**
     * Wait until the media is ready to play without stalling immediately.
     */
    public async waitReady(timeout: number = 10000): Promise<void> {
        if (this.isReady()) {
            return;
        }

        console.log(`⏳ [Warmup] Waiting for buffer... (Threshold: ${this.minBufferThreshold}s)`);

        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            const check = () => {
                if (this.isReady()) {
                    cleanup();
                    resolve();
                    return;
                }

                if (Date.now() - startTime > timeout) {
                    cleanup();
                    // Resolve anyway to prevent blocking forever, but warn
                    console.warn(`⚠️ [Warmup] Timeout (${timeout}ms). Buffer might be insufficient.`);
                    resolve();
                }
            };

            this.checkInterval = setInterval(check, 100);

            // Also listen to events to trigger faster
            const onCanPlay = () => check();
            this.element.addEventListener('canplay', onCanPlay);
            this.element.addEventListener('canplaythrough', onCanPlay);
            this.element.addEventListener('progress', onCanPlay);

            const cleanup = () => {
                if (this.checkInterval) clearInterval(this.checkInterval);
                this.checkInterval = null;
                this.element.removeEventListener('canplay', onCanPlay);
                this.element.removeEventListener('canplaythrough', onCanPlay);
                this.element.removeEventListener('progress', onCanPlay);
            };
        });
    }

    private isReady(): boolean {
        // 1. Basic Readiness
        if (this.element.readyState < 3) return false; // HAVE_FUTURE_DATA

        // 2. Buffer Check (for streaming)
        // If duration is infinite (livestream) or very long, we check buffered ahead.
        const currentTime = this.element.currentTime;
        const buffered = this.element.buffered;

        if (buffered.length === 0) return false;

        // Find buffer range containing current time
        for (let i = 0; i < buffered.length; i++) {
            if (buffered.start(i) <= currentTime && buffered.end(i) >= currentTime) {
                const ahead = buffered.end(i) - currentTime;
                // Ready if we have enough buffer OR we are at the end
                if (ahead >= this.minBufferThreshold || (this.element.duration > 0 && currentTime >= this.element.duration - 0.5)) {
                    return true;
                }
            }
        }

        return false;
    }

    public cancel(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
}
