import { TrackMetadata } from "../../../core/types";

export class PlaybackRestoreController {
    private isRestoring: boolean = false;
    private savedTime: number = 0;

    constructor() { }

    /**
     * Mark that we are entering restore mode (e.g. after reload)
     */
    public beginRestore(currentTime: number): void {
        this.isRestoring = true;
        this.savedTime = currentTime;
        console.log(`♻️ [Restore] Mode Active. Saved Time: ${this.savedTime}`);
    }

    /**
     * Apply restored state to element (Silent phase)
     */
    public apply(element: HTMLAudioElement): void {
        if (!this.isRestoring) return;

        // GUARD: Part 5 - CurrentTime Restore Guard
        // MUST NOT set audio.currentTime Until audio.readyState >= 3
        if (element.readyState < 3) {
            console.warn(`⚠️ [Restore] Deferring seek. ReadyState: ${element.readyState} (Need >= 3)`);
            return;
        }

        // Restore time
        if (this.savedTime > 0 && Math.abs(element.currentTime - this.savedTime) > 0.5) {
            try {
                element.currentTime = this.savedTime;
                console.log(`📍 [Restore] Seek applied: ${this.savedTime}`);
            } catch (e) {
                console.error('❌ [Restore] Seek failed:', e);
            }
        }
    }

    /**
     * Signal that restoration is complete (e.g. user clicked play)
     */
    public complete(): void {
        if (this.isRestoring) {
            this.isRestoring = false;
            this.savedTime = 0;
            console.log('✅ [Restore] Complete. Normal playback resumes.');
        }
    }

    public isActive(): boolean {
        return this.isRestoring;
    }
}
