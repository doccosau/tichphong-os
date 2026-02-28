import { kernelEventBus } from './EventBus';
import { AudioClock } from './AudioClock';
import { StateManager } from './StateManager';
import { AudioEvents } from './types';
import { createLogger } from './Logger';
import type { PlaybackManager } from '../playback/PlaybackManager';  // BUG 2 FIX

const log = createLogger('LifecycleManager');

export enum KernelStatus {
    UNINITIALIZED = 'UNINITIALIZED',
    INITIALIZING = 'INITIALIZING',
    RUNNING = 'RUNNING',
    SUSPENDED = 'SUSPENDED',
    DESTROYED = 'DESTROYED'
}

/**
 * LifecycleManager
 * 
 * Manages the kernel's lifecycle: init, suspend, resume, destroy.
 * 
 * CRITICAL ARCHITECTURE DECISION:
 * - DO NOT touch Howler.ctx or Howler.masterGain
 * - Let Howler manage its own AudioContext completely
 * - We'll get the context FROM Howler after first sound loads (if needed for DSP)
 * - For now, just create our own AudioContext for DSP nodes (will merge later)
 */
export class LifecycleManager {
    private status: KernelStatus = KernelStatus.UNINITIALIZED;
    private audioContext: AudioContext | null = null;
    private audioClock: AudioClock | null = null;
    private stateManager: StateManager | null = null;
    private playbackManager: PlaybackManager | null = null;  // BUG 2 FIX

    // Main Loop
    private rafId: number | null = null;
    private lastTick: number = 0;

    constructor() {
        this.init = this.init.bind(this);
        this.destroy = this.destroy.bind(this);
    }

    public getStatus(): KernelStatus {
        return this.status;
    }

    // === Main Loop (Heartbeat) ===
    private startMainLoop(): void {
        log.info('Starting Main Loop...');
        if (this.rafId) return;

        const loop = () => {
            this.tick();
            this.rafId = requestAnimationFrame(loop);
        };
        this.rafId = requestAnimationFrame(loop);
    }

    private stopMainLoop(): void {
        log.info('Stopping Main Loop');
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    private tick(): void {
        if (this.status !== KernelStatus.RUNNING) return;

        // H2 FIX: Read state once per tick, not twice
        if (this.playbackManager && this.stateManager) {
            const state = this.stateManager.getState();
            if (!state.playback.isPlaying) return;

            const currentTime = this.playbackManager.getPosition();
            const duration = this.playbackManager.getDuration();

            kernelEventBus.emit(AudioEvents.TIME_UPDATED, {
                currentTime,
                duration
            });

            // Sync duration to StateManager if not yet set
            if (duration > 0 && Math.abs(state.playback.duration - duration) > 0.5) {
                this.stateManager.setDuration(duration);
            }
        }
    }

    /**
     * Initialize the Audio Kernel (Non-Audio parts)
     * AudioContext is now lazy-loaded via TPDriver interaction.
     */
    public async init(): Promise<void> {
        if (this.status !== KernelStatus.UNINITIALIZED && this.status !== KernelStatus.DESTROYED) {
            log.warn('Already initialized.');
            return;
        }

        this.status = KernelStatus.INITIALIZING;
        kernelEventBus.emit(AudioEvents.KERNEL_INITIALIZED);
        log.info('Initializing (Lazy Context Mode)...');

        try {
            // Initialize core modules (State, Queue, etc.)
            this.stateManager = new StateManager();

            this.status = KernelStatus.RUNNING; // Running but "Audio-less"
            kernelEventBus.emit(AudioEvents.KERNEL_READY);
            log.info('Ready (Waiting for AudioContext).');

            this.startMainLoop();

        } catch (error) {
            log.error('Init failed:', error);
            await this.destroy();
            throw error;
        }
    }

    /**
     * Late-initialize Audio subsystems once Context is created by Driver
     */
    public async injectContext(context: AudioContext): Promise<void> {
        if (this.audioContext === context) return;

        log.info('💉 Injecting AudioContext...');
        this.audioContext = context;

        // Init Clock
        this.audioClock = new AudioClock(this.audioContext);

        // Init DSP
        // Initialize DSP Graph
        // DSPGraph might need reference update if it was already created?
        // In Kernel.ts, dspGraph is property. We need to access it via Kernel or event.
        // LifecycleManager manages lifecycle... 

        // We emit event so Kernel can wire up DSP
        kernelEventBus.emit('kernel:context-ready', { context });

        // Load AudioWorklet
        try {
            await this.audioContext.audioWorklet.addModule('/worklets/bypass-processor.js');
            await this.audioContext.audioWorklet.addModule('/worklets/gain-processor.js');
            log.info('AudioWorklet modules loaded');
        } catch (e) {
            log.error('Failed to load AudioWorklet:', e);
        }
    }




    public async suspend(): Promise<void> {
        if (this.status !== KernelStatus.RUNNING) return;

        if (this.audioContext?.state === 'running') {
            await this.audioContext.suspend();
        }
        this.audioClock?.suspend();

        this.status = KernelStatus.SUSPENDED;
        kernelEventBus.emit(AudioEvents.KERNEL_SUSPENDED);
    }

    public async resume(): Promise<void> {
        if (this.audioContext?.state === 'suspended') {
            await this.audioContext.resume();
        }
        this.audioClock?.resume();

        this.status = KernelStatus.RUNNING;
        kernelEventBus.emit(AudioEvents.KERNEL_RESUMED);
    }

    public async destroy(): Promise<void> {
        log.info('Destroying...');
        this.stopMainLoop();

        this.audioClock?.reset();

        // H5/H6 FIX: Properly dispose PlaybackManager (clears watchdog, stops driver)
        if (this.playbackManager) {
            this.playbackManager.dispose();
            this.playbackManager = null;
        }

        // DON'T close Howler.ctx - it's shared!
        // Just release our reference

        this.stateManager?.reset();

        this.audioContext = null;
        this.audioClock = null;
        this.stateManager = null;

        kernelEventBus.emit(AudioEvents.KERNEL_DESTROYED);
        kernelEventBus.clear();

        this.status = KernelStatus.DESTROYED;
    }

    // Accessors
    public getContext(): AudioContext | null { return this.audioContext; }
    public getClock(): AudioClock | null { return this.audioClock; }
    public getStateManager(): StateManager | null { return this.stateManager; }

    // BUG 2 FIX: Allow Kernel to inject PlaybackManager reference
    public setPlaybackManager(pm: PlaybackManager): void {
        this.playbackManager = pm;
    }
}
