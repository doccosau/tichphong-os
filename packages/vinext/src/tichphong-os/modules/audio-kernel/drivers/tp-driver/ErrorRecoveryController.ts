import { IErrorRecoveryController } from './interfaces';

export class ErrorRecoveryController implements IErrorRecoveryController {
    private retryCount: number = 0;
    private maxRetries: number = 3;
    private lastErrorTime: number = 0;

    public reportError(error: any): void {
        console.error('⚠️ [Recovery] Reported error:', error);

        const now = Date.now();
        // Reset count if error is stale (> 30s)
        if (now - this.lastErrorTime > 30000) {
            this.retryCount = 0;
        }
        this.lastErrorTime = now;
    }

    public async attemptRecovery(): Promise<boolean> {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            const delay = this.retryCount * 1000; // Exponential-ish backoff
            console.log(`🚑 [Recovery] Attempting recovery #${this.retryCount} in ${delay}ms...`);

            await new Promise(resolve => setTimeout(resolve, delay));
            return true; // Signal effectively "Retry approved"
        }

        console.error('❌ [Recovery] Max retries reached. Giving up.');
        return false;
    }

    private watchdogTimer: ReturnType<typeof setInterval> | null = null;
    private transport: import('./interfaces').ITransportEngine | null = null;

    public startMonitoring(transport: import('./interfaces').ITransportEngine): void {
        this.stopMonitoring();
        this.transport = transport;
        // Check every 2 seconds
        this.watchdogTimer = setInterval(() => this.checkPlayback(), 2000);
    }

    public stopMonitoring(): void {
        if (this.watchdogTimer) {
            clearInterval(this.watchdogTimer);
            this.watchdogTimer = null;
        }
        this.transport = null;
    }

    private checkPlayback(): void {
        if (!this.transport) return;
        const el = this.transport.getElement();

        // Only check if supposed to be playing
        if (el.paused || el.ended) return;

        // Check for stuck at end (common issue with some codecs/browsers)
        if (el.duration > 0 && el.currentTime >= el.duration - 0.5) {
            console.warn('🐕 [Watchdog] Detected stuck at end. Emitting ended.');
            // Import dynamically or pass bus? better to import or use transport?
            // Using kernelEventBus directly is cleaner for this "Driver Layer" component
            const { kernelEventBus } = require('../../core/EventBus');
            kernelEventBus.emit('driver:ended');
            this.stopMonitoring();
        }
    }

    public reset(): void {
        this.stopMonitoring();
        this.retryCount = 0;
        this.lastErrorTime = 0;
    }
}
