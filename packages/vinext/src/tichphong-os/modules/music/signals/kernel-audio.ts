/**
 * TichPhong Core 5.1.1 - Kernel Audio Controller (Proxy)
 * 
 * Bridges TPAudioKernel state to Preact Signals for UI reactivity.
 * Replaces hybrid logic with a pure Proxy to TPAudioKernel.
 * 
 * FIXES: "Split-Brain" Audio Engine (AudioController vs Kernel)
 */
import { signal, computed } from '@preact/signals-react';
import { audioKernel } from '..//audio-kernel';
import { AudioEvents } from '..//audio-kernel/core/types';

// ============================================
// CORE SIGNALS
// ============================================

export const currentTime = signal(0);
export const duration = signal(0);
export const buffered = signal(0);
export const isSeeking = signal(false);

// ============================================
// COMPUTED VALUES
// ============================================

export const progress = computed(() =>
    duration.value > 0 ? currentTime.value / duration.value : 0
);

export const remainingTime = computed(() =>
    Math.max(0, duration.value - currentTime.value)
);

export const bufferedProgress = computed(() =>
    duration.value > 0 ? buffered.value / duration.value : 0
);

export const formattedCurrentTime = computed(() =>
    formatTime(currentTime.value)
);

export const formattedDuration = computed(() =>
    formatTime(duration.value)
);

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

let bridgeInitialized = false;

const setupKernelBridge = () => {
    if (bridgeInitialized) return;
    bridgeInitialized = true;

    console.log('🔌 [KernelBridge] Initializing Signal Bridge...');

    audioKernel.bus.on(AudioEvents.DURATION_UPDATED, (d: number) => {
        if (duration.value !== d) duration.value = d;
    });

    // BUG 3 FIX: Use TIME_UPDATED from LifecycleManager.tick() for all time/duration.
    // No more duplicate rAF loop.
    audioKernel.bus.on(AudioEvents.TIME_UPDATED, (data: any) => {
        if (data && typeof data.currentTime === 'number') {
            if (Math.abs(currentTime.value - data.currentTime) > 0.01) {
                currentTime.value = data.currentTime;
            }
        }
        if (data && data.duration > 0 && Math.abs(duration.value - data.duration) > 0.5) {
            duration.value = data.duration;
        }
    });

    audioKernel.bus.on(AudioEvents.PLAYBACK_SEEKED, (time: number) => {
        currentTime.value = time;
    });
};

// BUG 3 FIX: Removed startSignalLoop/stopSignalLoop.
// Time is now synced via TIME_UPDATED events from LifecycleManager.tick().


// ============================================
// AUDIO CONTROLLER PROXY (Adapter)
// ============================================

class AudioControllerProxy {
    // Legacy support for accessing .audio property (Mock)
    private _mockAudio = {
        addEventListener: (event: string, cb: Function) => this.mapLegacyEvent(event, cb),
        removeEventListener: () => { },
        pause: () => this.pause(),
        play: () => this.play(),
        get paused() { return !audioKernel.state?.getState().playback.isPlaying; },
        get duration() { return duration.value; },
        get currentTime() { return currentTime.value; },
        set currentTime(v: number) { audioKernel.playback.seek(v); },
        get volume() { return audioKernel.state?.getState().playback.volume ?? 1; },
        set volume(v: number) { audioKernel.playback.setVolume(v); },
        // Mock error state
        error: null,
        networkState: 1,
        readyState: 4
    };

    private initPromise: Promise<void> | null = null;

    constructor() {
        console.log('⚡ [AudioController] Initialized as Kernel Proxy (Hybrid Removed)');
        this.initKernel();
        // Ensure bridge is setup
        setTimeout(setupKernelBridge, 0);
    }

    private initKernel() {
        if (!audioKernel.isReady() && !this.initPromise) {
            console.log('🚀 [AudioControllerProxy] Auto-initializing Kernel...');
            this.initPromise = audioKernel.init().then(() => {
                console.log('✅ [AudioControllerProxy] Kernel initialized automatically');
            }).catch(e => {
                console.error('❌ [AudioControllerProxy] Kernel init failed:', e);
                // Retry?
                this.initPromise = null;
            });
        }
    }

    private async ensureReady(): Promise<void> {
        if (audioKernel.isReady()) return;
        if (!this.initPromise) this.initKernel();
        if (this.initPromise) await this.initPromise;
    }

    // C4 FIX: All methods now route through kernel intents
    async play(): Promise<void> {
        await this.ensureReady();
        return audioKernel.intentResume();
    }

    pause(): void {
        if (audioKernel.isReady()) audioKernel.intentPause();
    }

    stop(): void {
        if (audioKernel.isReady()) {
            audioKernel.intentPause();
            audioKernel.intentSeek(0);
        }
    }

    seek(time: number): void {
        if (!audioKernel.isReady()) return;

        audioKernel.intentSeek(time);
        currentTime.value = time; // Optimistic update
        isSeeking.value = true;
        setTimeout(() => isSeeking.value = false, 100);
    }

    setVolume(vol: number): void {
        if (audioKernel.isReady()) audioKernel.playback.setVolume(vol);
    }

    setLoop(loop: boolean): void {
        if (audioKernel.isReady()) audioKernel.intentLoop(loop);
    }

    getVolume(): number {
        return audioKernel.state?.getState().playback.volume ?? 1;
    }

    load(src: string): void {
        // Legacy compatibility — use intentPlay for full authority
        this.ensureReady().then(() => {
            const id = 'legacy_' + Math.random().toString(36).substr(2, 9);
            audioKernel.intentPlay({ id, src });
        });
    }

    preload(src: string): void {
        if (audioKernel.isReady()) audioKernel.playback.preload(src);
    }

    // =================================
    // Legacy / Extra API Support
    // =================================

    // Crossfade (Handled by Kernel/Howler usually, but here is a simple implementation)
    async fadeVolume(from: number, to: number, durationMs: number = 500): Promise<void> {
        // Simple interval based fade
        return new Promise((resolve) => {
            const steps = 10;
            const interval = durationMs / steps;
            const diff = to - from;
            let currentStep = 0;

            const timer = setInterval(() => {
                currentStep++;
                const v = from + (diff * (currentStep / steps));
                this.setVolume(v);

                if (currentStep >= steps) {
                    clearInterval(timer);
                    this.setVolume(to);
                    resolve();
                }
            }, interval);
        });
    }

    enableEQ(): void {
        console.log('🎛️ [AudioControllerProxy] enableEQ called (Managed by Kernel ThemeManager)');
        // Kernel manages EQ automatically via ThemeManager
    }

    resumeAudioContext(): void {
        // Usually handled by Kernel's PlaybackManager, but explicit call logic for UI buttons
        audioKernel.context?.resume().catch(console.warn);
    }

    // Event handlers (Deprecated style)
    onEnded(cb: any) { this.mapLegacyEvent(AudioEvents.PLAYBACK_ENDED, cb); }
    onError(cb: any) { /* Not fully mapped */ }

    // Helpers
    private mapLegacyEvent(event: string, cb: Function) {
        // Map legacy event names if needed
        let kernelEvent = event;
        if (event === 'ended') kernelEvent = AudioEvents.PLAYBACK_ENDED;
        if (event === 'play') kernelEvent = AudioEvents.PLAYBACK_STARTED;
        if (event === 'pause') kernelEvent = AudioEvents.PLAYBACK_PAUSED;
        if (event === 'timeupdate') {
            // Special case: we don't bind timeupdate to bus, handled by signals
            // Just warn
            // console.warn('Legacy timeupdate listener ignored');
            return;
        }

        audioKernel.bus.on(kernelEvent, (payload) => cb(payload));
    }

    // Getters
    get element() {
        return this._mockAudio as any;
    }

    get isPaused(): boolean {
        return !audioKernel.state?.getState().playback.isPlaying;
    }

    get readyState(): number {
        return 4; // ALWAYS READY (Mock)
    }
}

export const audioController = new AudioControllerProxy();
