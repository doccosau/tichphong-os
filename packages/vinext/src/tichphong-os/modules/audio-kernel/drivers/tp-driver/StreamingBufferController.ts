import { IStreamingBufferController } from './interfaces';

export class StreamingBufferController implements IStreamingBufferController {
    private element: HTMLAudioElement | null = null;

    public monitor(element: HTMLAudioElement): void {
        this.element = element;
    }

    public getHealth(): number {
        if (!this.element || this.element.duration === Infinity || isNaN(this.element.duration)) {
            return 1.0; // Stream or unknown duration, assume healthy until stalled
        }

        const buffered = this.element.buffered;
        const currentTime = this.element.currentTime;
        const duration = this.element.duration;

        if (buffered.length === 0) return 0.0;

        // Find buffer range covering current time
        let bufferEnd = 0;
        for (let i = 0; i < buffered.length; i++) {
            if (buffered.start(i) <= currentTime && buffered.end(i) >= currentTime) {
                bufferEnd = buffered.end(i);
                break;
            }
        }

        const bufferAhead = bufferEnd - currentTime;

        // Simple health metric: > 20s is 1.0, 0s is 0.0
        return Math.min(Math.max(bufferAhead / 20, 0), 1.0);
    }

    public isStalled(): boolean {
        // This logic is tricky. Browser emits 'stalled', but we can also infer
        // if bufferAhead is very low and we are 'playing' but currentTime isn't moving.
        // For now, relies on TransportEngine emitting 'stalled' event.
        return this.getHealth() < 0.1;
    }

    public reset(): void {
        this.element = null;
    }
}
