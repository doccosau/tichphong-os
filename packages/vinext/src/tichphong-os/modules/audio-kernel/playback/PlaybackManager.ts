import { IPlaybackDriver } from '../drivers/interfaces';

import { TPDriver } from '../drivers/tp-driver/TPDriver';
import { StateManager } from '../core/StateManager';
import { AudioClock } from '../core/AudioClock';
import { kernelEventBus } from '../core/EventBus';
import { DSPGraph } from '../dsp/DSPGraph';
import { TrackMetadata, AudioEvents } from '../core/types';

/**
 * PlaybackManager - High-level playback controller
 * 
 * ARCHITECTURE:
 * - Manages TPDriver for playback (Native-Inspired Architecture)
 * - Syncs state with StateManager
 * - Syncs time with AudioClock
 * - DSP routing can be enabled/disabled
 */
export class PlaybackManager {
    private driver: IPlaybackDriver;
    private stateManager: StateManager;
    private audioClock: AudioClock | null;
    private dspGraph: DSPGraph;
    private useDSP: boolean = false;
    private watchdogId: ReturnType<typeof setInterval> | null = null;  // H5 FIX

    constructor(
        stateManager: StateManager,
        clock: AudioClock | null,
        dspGraph: DSPGraph,
        enableDSP: boolean = false
    ) {
        this.stateManager = stateManager;
        this.audioClock = clock;
        this.dspGraph = dspGraph;
        this.useDSP = enableDSP;

        // TPDriver Implementation (Native-Inpired Architecture)
        // DSP Enabled -> CORS 'anonymous' (Strict)
        // DSP Disabled -> No CORS (Safe Mode)
        console.log(`🚀 [PlaybackManager] Using TPDriver (DSP: ${this.useDSP}, CORS: ${this.useDSP})`);
        this.driver = new TPDriver(this.useDSP);

        this.setupEventListeners();
    }

    public setClock(clock: AudioClock): void {
        this.audioClock = clock;
        console.log('⏰ [PlaybackManager] AudioClock injected');
    }

    private setupEventListeners(): void {
        kernelEventBus.on('driver:loaded', (payload: any) => {
            console.log('💿 [PlaybackManager] Track loaded', payload);

            // BUG 6 FIX: Propagate duration from driver to StateManager
            const driverDuration = this.driver.getDuration();
            if (driverDuration > 0) {
                this.stateManager.setDuration(driverDuration);
            }

            // DSP Routing
            if (this.useDSP) {
                try {
                    // BUG FIX: Must attach driver to AudioContext to create MediaElementSource
                    const context = this.dspGraph.getContext();
                    if (context) {
                        this.driver.attach(context);
                        this.driver.connect(this.dspGraph.getInputNode());
                        console.log('🎛️ [PlaybackManager] DSP routing enabled (Source Attached)');
                    } else {
                        console.warn('⚠️ [PlaybackManager] DSP enabled but Context is null');
                    }
                } catch (e) {
                    console.warn('[PlaybackManager] DSP routing failed, using direct output:', e);
                }
            } else {
                console.log('🔊 [PlaybackManager] DSP bypassed (Safe Mode)');
            }

            this.stateManager.setPlaybackState({
                isStopped: true, isPlaying: false, isPaused: false
            });
        });

        kernelEventBus.on('driver:playing', () => {
            console.log('🐞 [PlaybackManager] Received driver:playing -> Setting State');
            this.stateManager.setPlaybackState({
                isPlaying: true, isPaused: false, isStopped: false
            });
            this.audioClock?.resume();
        });

        kernelEventBus.on('driver:paused', () => {
            this.stateManager.setPlaybackState({
                isPaused: true, isPlaying: false, isStopped: false
            });
            this.audioClock?.suspend();
        });

        // BUG: TPDriver emits 'driver:audio-context-ready' when unlocked, but nobody was listening!
        // FIX: Relay this to Kernel so it can init DSP nodes.
        kernelEventBus.on('driver:audio-context-ready', (payload: { context: AudioContext }) => {
            const context = payload.context;
            console.log('🔄 [PlaybackManager] Relaying context to Kernel:', context.state);
            // We emit a new event that Kernel listens to
            kernelEventBus.emit('kernel:context-ready', { context });
        });

        kernelEventBus.on('driver:ended', () => {
            this.stateManager.setPlaybackState({
                isStopped: true, isPlaying: false, isPaused: false
            });
            this.audioClock?.suspend();
            kernelEventBus.emit('playback:ended');
        });

        // BUG: Time update relay
        kernelEventBus.on('driver:timeupdate', (payload: { currentTime: number }) => {
            // Update AudioClock for reference (optional, keeps it in sync)
            this.audioClock?.setTime(payload.currentTime);

            // Emit standardized event for UI
            kernelEventBus.emit(AudioEvents.TIME_UPDATED, {
                currentTime: payload.currentTime,
                duration: this.driver.getDuration()
            });
        });

        // BUG FIX: Handle dynamic duration updates (e.g. metadata loaded late)
        kernelEventBus.on('driver:durationchange', (payload: { duration: number }) => {
            console.log('⏱️ [PlaybackManager] Propagating duration:', payload.duration);
            this.stateManager.setDuration(payload.duration);
        });

        // --- LAZY CONTEXT INJECTION FROM TPDriver ---
        kernelEventBus.on('driver:audio-context-ready', (payload: { context: AudioContext }) => {
            console.log('🔌 [PlaybackManager] Received AudioContext from Driver -> Injecting to Kernel');
            // Relay to Kernel (Kernel listens to this same event or needs a direct method?)
            // Relay to Kernel (Kernel listens to this same event or needs a direct method?)
            // Actually Kernel.ts doesn't listen to this event yet.
            // But we can add a listener in `Kernel.ts` OR we can assume `LifecycleManager` is a singleton we can import?
            // `AudioKernel.getInstance().lifecycle.injectContext()`?
            // `AudioKernel` is in `../core/Kernel`. Using `getInstance` is circular dependency risk.

            // Best approach: Emit a KERNEL level event that Kernel listens to?
            // `kernelEventBus` is shared.
            // If we emit `kernel:inject-context`, Kernel can listen.

            kernelEventBus.emit('kernel:inject-context', { context: payload.context });

            // CRITICAL FIX: Late DSP Injection
            // If DSP is enabled but was skipped during load because context was missing, 
            // we must attach it NOW.
            if (this.useDSP) {
                try {
                    console.log('🔌 [PlaybackManager] Late DSP Injection triggered by context-ready');
                    this.driver.attach(payload.context);
                    if (this.dspGraph && this.dspGraph.getInputNode()) {
                        this.driver.connect(this.dspGraph.getInputNode());
                        console.log('✅ [PlaybackManager] Late DSP routing successful');
                    }
                } catch (e) {
                    console.warn('⚠️ [PlaybackManager] Late DSP injection failed:', e);
                }
            }
        });

        // Mode Change relay
        kernelEventBus.on('driver:mode', (payload: { mode: string }) => {
            console.log(`🔄 [PlaybackManager] Mode changed: ${payload.mode}`);
            kernelEventBus.emit(AudioEvents.MODE_CHANGED, { mode: payload.mode });
        });
    }

    /**
     * Get current driver mode
     */
    public getMode(): string {
        return this.driver.getMode();
    }

    /**
     * Load a track by URL
     */
    public async load(trackId: string, src: string, metadata?: Partial<TrackMetadata>): Promise<void> {
        console.log(`💿 [PlaybackManager] Loading: ${trackId}`);

        // Use provided metadata or defaults
        const currentMeta: TrackMetadata = {
            id: trackId,
            title: metadata?.title || 'Unknown Track',
            artist: metadata?.artist || 'Unknown Artist',
            album: metadata?.album || '',
            artwork: metadata?.artwork || '',
            duration: metadata?.duration || 0,
            sourceUrl: src
        };

        this.stateManager.setPlaybackState({
            currentTrack: currentMeta,
            isPlaying: false,
            isPaused: false,
            isStopped: false
            // Buffering implied by lack of state? Or stick to previous state?
        });

        try {
            await this.driver.load(src);
            this.audioClock?.reset();
        } catch (error) {
            console.error('[PlaybackManager] Load failed:', error);
            this.stateManager.setPlaybackState({
                isStopped: true, isPlaying: false, isPaused: false
            });
            throw error;
        }
    }

    public async play(): Promise<void> {
        // H5 FIX: Ensure AudioContext is running (important for DSP)
        if (this.useDSP) {
            const ctx = this.dspGraph.getContext();
            console.log(`▶️ [PlaybackManager] Play requested. Context State: ${ctx?.state}`);

            if (ctx?.state === 'suspended') {
                console.log('⚠️ [PlaybackManager] Context suspended. Attempting resume...');
                try {
                    // Timeout the resume attempt to prevent hanging (e.g. 500ms)
                    await Promise.race([
                        ctx.resume(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Context Resume Timeout')), 500))
                    ]);
                    console.log(`✅ [PlaybackManager] AudioContext resumed. New State: ${ctx.state}`);
                } catch (e) {
                    console.warn(`⚠️ [PlaybackManager] AudioContext resume failed or timed out: ${e}. Proceeding to driver play anyway.`);
                }
            }
        }

        await this.driver.play();
    }

    public pause(): void {
        this.driver.pause();
    }

    public seek(position: number): void {
        this.driver.seek(position);
        this.audioClock?.setTime(position);
    }

    public setVolume(volume: number): void {
        this.driver.setVolume(volume);
        this.stateManager.setPlaybackState({ volume });
    }

    public getDuration(): number {
        return this.driver.getDuration();
    }

    /**
     * Get current playback position in seconds
     */
    public getPosition(): number {
        return this.driver.getPosition();
    }

    /**
     * Enable/disable DSP routing
     */
    public setDSPEnabled(enabled: boolean): void {
        this.useDSP = enabled;
    }

    /** Check if DSP is currently enabled */
    public isDSPEnabled(): boolean {
        return this.useDSP;
    }

    public setPlaybackRate(rate: number): void {
        this.driver.setPlaybackRate(rate);
        this.audioClock?.setPlaybackRate(rate);
        this.stateManager.setPlaybackState({ playbackRate: rate });
    }

    /**
     * Set loop state
     */
    public setLoop(loop: boolean): void {
        this.driver.setLoop(loop);
    }

    /**
     * Set preserve pitch (for natural pitch shifting)
     */
    public setPreservePitch(preserve: boolean): void {
        this.driver.setPreservePitch(preserve);
    }

    /**
     * Watchdog: Check if we passed duration but didn't get 'ended' event
     */
    public startWatchdog(): void {
        if (this.watchdogId) return;  // H5 FIX: Prevent multiple watchdogs
        this.watchdogId = setInterval(() => {
            if (!this.stateManager.getState().playback.isPlaying) return;

            const position = this.getPosition();
            const duration = this.getDuration();

            if (duration > 0 && position > duration + 0.5) {
                console.warn('🐕 [PlaybackManager] Watchdog: Track ended but no event. Forcing end.');
                kernelEventBus.emit('driver:ended');
            }
        }, 1000);
    }

    /**
     * H5 FIX: Clean up resources
     */
    public dispose(): void {
        if (this.watchdogId) {
            clearInterval(this.watchdogId);
            this.watchdogId = null;
        }
    }

    /**
     * Preload a track (warm up cache)
     */
    public preload(src: string): void {
        if (this.driver && 'preload' in this.driver) {
            (this.driver as any).preload(src);
        }
    }
}
