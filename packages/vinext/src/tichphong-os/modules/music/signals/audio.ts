/**
 * TichPhong Core 5.1.1 - Audio Signals (Kernel Bridge)
 * 
 * Bridges TPAudioKernel state to Preact Signals for UI reactivity.
 * Replaces legacy AudioController with a proxy to Kernel.
 */
import { signal, computed } from '@preact/signals-react';
import { audioKernel } from '../../audio-kernel/core/Kernel';
import { AudioEvents } from '../../audio-kernel/core/types';

// ============================================
// CORE SIGNALS (update every frame/event)
// ============================================

/** Current playback position in seconds */
export const currentTime = signal(0);

/** Total track duration in seconds */
export const duration = signal(0);

/** Buffered amount in seconds */
export const buffered = signal(0);

/** Whether audio is currently seeking */
export const isSeeking = signal(false);

// ============================================
// COMPUTED VALUES (derived automatically)
// ============================================

/** Progress as 0-1 ratio */
export const progress = computed(() =>
    duration.value > 0 ? currentTime.value / duration.value : 0
);

/** Remaining time in seconds */
export const remainingTime = computed(() =>
    Math.max(0, duration.value - currentTime.value)
);

/** Buffered progress as 0-1 ratio */
export const bufferedProgress = computed(() =>
    duration.value > 0 ? buffered.value / duration.value : 0
);

/** Formatted current time (mm:ss) */
export const formattedCurrentTime = computed(() =>
    formatTime(currentTime.value)
);

/** Formatted duration (mm:ss) */
export const formattedDuration = computed(() =>
    formatTime(duration.value)
);

/** Formatted remaining time (mm:ss) */
export const formattedRemainingTime = computed(() =>
    formatTime(remainingTime.value)
);

// ============================================
// HELPERS
// ============================================

function formatTime(seconds: number): string {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================
// KERNEL BRIDGE (Syncs Kernel Events -> Signals)
// ============================================

const setupKernelBridge = () => {
    // Time Update (Throttle? Kernel events likely throttled or rAF driven)
    // AudioClock updates usually happen on rAF in UI, but Kernel might emit events.
    // Ideally we poll clock in useFrame or something, but for now let's rely on events if available.
    // Actually, Kernel doesn't emit TIME_UPDATED regularly yet? 
    // PlayerContext used to check audio.currentTime. 
    // Let's set up a loop if playing.

    // Sync Duration
    audioKernel.bus.on(AudioEvents.DURATION_UPDATED, (d: number) => {
        if (duration.value !== d) duration.value = d;
    });

    // Sync Playback State
    audioKernel.bus.on(AudioEvents.PLAYBACK_STARTED, () => {
        startSignalLoop();
    });

    audioKernel.bus.on(AudioEvents.PLAYBACK_PAUSED, () => {
        stopSignalLoop();
    });

    audioKernel.bus.on(AudioEvents.PLAYBACK_ENDED, () => {
        stopSignalLoop();
        currentTime.value = 0; // Reset
    });

    audioKernel.bus.on(AudioEvents.PLAYBACK_SEEKED, (time: number) => {
        currentTime.value = time;
    });

    // Determine initial state
    if (audioKernel.state?.getState().playback.isPlaying) {
        startSignalLoop();
    }
};

let rafId: number | null = null;

const startSignalLoop = () => {
    if (rafId) return;
    const loop = () => {
        if (audioKernel.playback) {
            const time = audioKernel.playback.getPosition();
            if (Math.abs(currentTime.value - time) > 0.05) { // Update if changed > 50ms
                currentTime.value = time;
            }
            // Also sync duration if drift
            const dur = audioKernel.playback.getDuration();
            if (Math.abs(duration.value - dur) > 0.1) {
                duration.value = dur;
            }
        }
        rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
};

const stopSignalLoop = () => {
    if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
};

// Initialize Bridge
// We defer lightly to ensure Kernel module is loaded
setTimeout(setupKernelBridge, 0);


// ============================================
// AUDIO CONTROLLER PROXY (Adapter)
// ============================================

class AudioControllerProxy {
    // Legacy support
    private audio = {
        addEventListener: () => console.warn('[AudioController] Listeners deprecated. Use Kernel EventBus.'),
        removeEventListener: () => { },
        pause: () => audioKernel.playback.pause(),
        play: () => audioKernel.playback.play()
    };

    constructor() {
        console.log('⚡ [AudioController] Initialized as Kernel Proxy');
    }

    async play(): Promise<void> {
        return audioKernel.playback.play();
    }

    pause(): void {
        audioKernel.playback.pause();
    }

    stop(): void {
        audioKernel.playback.pause();
        audioKernel.playback.seek(0);
    }

    seek(time: number): void {
        audioKernel.playback.seek(time);
        currentTime.value = time; // Optimistic update
    }

    setVolume(vol: number): void {
        audioKernel.playback.setVolume(vol);
    }

    setLoop(loop: boolean): void {
        audioKernel.playback.setLoop(loop);
    }

    getVolume(): number {
        // We'd need to fetch from state
        return audioKernel.state?.getState().playback.volume ?? 1;
    }

    load(src: string): void {
        // Generate a pseudo-ID if none provided (Controller usage usually assumes single track)
        // Ideally PlayerContext should call with ID.
        // For legacy load(src), we use src as ID.
        const id = 'legacy_' + Math.random().toString(36).substr(2, 9);
        audioKernel.playback.load(id, src);
    }

    preload(src: string): void {
        audioKernel.playback.preload(src);
    }

    // Helpers
    sanitizeUrl(url: string): string {
        if (!url) return '';
        try {
            return new URL(url).href;
        } catch {
            return url;
        }
    }

    // Listeners (Deprecated but kept for safety)
    onEnded(cb: any) { this.legacyListener(AudioEvents.PLAYBACK_ENDED, cb); }
    onError(cb: any) { /* Not fully mapped yet */ }

    private legacyListener(event: string, cb: Function) {
        audioKernel.bus.on(event, (payload) => cb(payload));
    }

    // Getters
    get element() {
        console.warn('[AudioController] element Access is deprecated!');
        return this.audio as any;
    }
}

export const audioController = new AudioControllerProxy();
