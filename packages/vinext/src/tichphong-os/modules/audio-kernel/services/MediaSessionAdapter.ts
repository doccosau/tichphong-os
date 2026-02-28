/**
 * MediaSessionAdapter - External Control Adapter for TPAudioKernel
 * 
 * ARCHITECTURE:
 * Browser Media Session API → MediaSessionAdapter → TPAudioKernel → Playback/DSP/Theme
 * 
 * RESPONSIBILITIES:
 * - Map Media Session actions → Kernel API
 * - Subscribe Kernel events → Media Session metadata  
 * - Sync playback position using AudioClock (NOT HTMLMediaElement.currentTime)
 * - Handle Bluetooth edge cases (debouncing, double-trigger)
 * 
 * RULES:
 * ❌ NEVER call drivers directly
 * ❌ NEVER hold playback state 
 * ❌ NEVER process DSP
 * ✅ ONLY communicate with Kernel
 * ✅ Kernel is the single source of truth
 */

import { kernelEventBus } from '../core/EventBus';
import { AudioEvents } from '../core/types';
import { createLogger } from '../core/Logger';

const log = createLogger('MediaSessionAdapter');
import { audioKernel } from '../core/Kernel';

// Use typeof for type inference since AudioKernel class is not directly exported
type AudioKernelType = typeof audioKernel;

export interface MediaSessionTrackInfo {
    title: string;
    artist: string;
    album?: string;
    artwork?: string;
    duration?: number;
}

export class MediaSessionAdapter {
    private isSupported: boolean;
    private kernel: AudioKernelType | null = null;
    private unsubscribers: Array<() => void> = [];
    private isInitialized: boolean = false;

    // Bluetooth safety - debounce rapid commands
    private lastCommandTime: number = 0;
    private readonly DEBOUNCE_MS = 300;

    // Position update throttling
    private positionUpdateInterval: ReturnType<typeof setInterval> | null = null;
    private readonly POSITION_UPDATE_INTERVAL_MS = 1000;

    constructor() {
        this.isSupported = 'mediaSession' in navigator;

        if (!this.isSupported) {
            log.warn('Not supported in this browser');
            return;
        }

        log.info('Created (waiting for Kernel)');
    }

    /**
     * Initialize adapter with Kernel reference
     * Called when Kernel is ready
     */
    public init(kernel: AudioKernelType): void {
        if (!this.isSupported) return;
        if (this.isInitialized) return;

        this.kernel = kernel;
        this.isInitialized = true;

        this.setupActionHandlers();
        this.subscribeToKernelEvents();
        this.startPositionSync();

        log.info('Initialized with Kernel');
    }

    /**
     * Setup Media Session action handlers
     * Maps browser actions → Kernel API
     */
    private setupActionHandlers(): void {
        if (!this.isSupported || !this.kernel) return;

        const actions: Array<{
            action: MediaSessionAction;
            handler: MediaSessionActionHandler;
        }> = [
                { action: 'play', handler: () => this.handlePlay() },
                { action: 'pause', handler: () => this.handlePause() },
                { action: 'stop', handler: () => this.handleStop() },
                { action: 'seekto', handler: (details) => this.handleSeekTo(details) },
                { action: 'seekforward', handler: () => this.handleSeekForward() },
                { action: 'seekbackward', handler: () => this.handleSeekBackward() },
                { action: 'nexttrack', handler: () => this.handleNextTrack() },
                { action: 'previoustrack', handler: () => this.handlePreviousTrack() },
            ];

        for (const { action, handler } of actions) {
            try {
                navigator.mediaSession.setActionHandler(action, handler);
            } catch (e) {
                log.warn(`Action "${action}" not supported`);
            }
        }

        log.info('Action handlers registered');
    }

    /**
     * Subscribe to Kernel events for real-time sync
     */
    private subscribeToKernelEvents(): void {
        // Playback state changes
        const unsubPlayback = kernelEventBus.on(AudioEvents.PLAYBACK_STARTED, () => {
            this.setPlaybackState('playing');
        });
        this.unsubscribers.push(unsubPlayback);

        const unsubPaused = kernelEventBus.on(AudioEvents.PLAYBACK_PAUSED, () => {
            this.setPlaybackState('paused');
        });
        this.unsubscribers.push(unsubPaused);

        const unsubEnded = kernelEventBus.on(AudioEvents.PLAYBACK_ENDED, () => {
            this.setPlaybackState('none');
        });
        this.unsubscribers.push(unsubEnded);

        // Track changed - update metadata
        const unsubTrack = kernelEventBus.on(AudioEvents.TRACK_CHANGED, (track: MediaSessionTrackInfo) => {
            this.updateMetadata(track);
        });
        this.unsubscribers.push(unsubTrack);

        // Theme changed - optional extended metadata
        const unsubTheme = kernelEventBus.on(AudioEvents.THEME_CHANGED, (themeName: string) => {
            log.info(`Theme: ${themeName}`);
            // Future: Extended metadata if OS supports
        });
        this.unsubscribers.push(unsubTheme);

        log.info('Subscribed to Kernel events');
    }

    /**
     * Start periodic position sync using AudioClock
     */
    private startPositionSync(): void {
        if (this.positionUpdateInterval) return;

        this.positionUpdateInterval = setInterval(() => {
            this.syncPosition();
        }, this.POSITION_UPDATE_INTERVAL_MS);
    }

    /**
     * Sync position from AudioClock to MediaSession
     */
    private syncPosition(): void {
        if (!this.isSupported || !this.kernel) return;

        try {
            const playback = this.kernel.playback;
            if (!playback) return;

            // C3 FIX: Use PlaybackManager position (TPDriver), NOT AudioClock
            const position = playback.getPosition();
            const duration = playback.getDuration();
            const playbackRate = 1.0;

            if (duration > 0 && position >= 0) {
                navigator.mediaSession.setPositionState({
                    duration,
                    playbackRate,
                    position: Math.min(position, duration)
                });
            }
        } catch (e) {
            // Some browsers don't support setPositionState
        }
    }

    // ==================== ACTION HANDLERS ====================

    /**
     * Debounce check for Bluetooth safety
     */
    private isDebounced(): boolean {
        const now = Date.now();
        if (now - this.lastCommandTime < this.DEBOUNCE_MS) {
            log.debug('Command debounced');
            return true;
        }
        this.lastCommandTime = now;
        return false;
    }

    // C1 FIX: Use kernel intents. Driver emits events automatically.
    private async handlePlay(): Promise<void> {
        if (this.isDebounced()) return;
        try {
            await this.kernel?.intentResume();
        } catch (e) {
            log.error('Play failed:', e);
        }
    }

    private handlePause(): void {
        if (this.isDebounced()) return;
        this.kernel?.intentPause();
    }

    private handleStop(): void {
        if (this.isDebounced()) return;
        this.kernel?.intentPause();
    }

    // C3 FIX: Use kernel.intentSeek() + playback.getPosition() for position
    private handleSeekTo(details: MediaSessionActionDetails): void {
        if (!details.seekTime) return;
        this.kernel?.intentSeek(details.seekTime);
        this.syncPosition();
    }

    private handleSeekForward(): void {
        const position = this.kernel?.playback?.getPosition() ?? 0;
        const duration = this.kernel?.playback?.getDuration() ?? 0;
        this.kernel?.intentSeek(Math.min(position + 10, duration));
        this.syncPosition();
    }

    private handleSeekBackward(): void {
        const position = this.kernel?.playback?.getPosition() ?? 0;
        this.kernel?.intentSeek(Math.max(position - 10, 0));
        this.syncPosition();
    }

    // C2 FIX: Emit bus events. Let PlayerContext handle queue navigation.
    private handleNextTrack(): void {
        if (this.isDebounced()) return;
        kernelEventBus.emit(AudioEvents.MEDIA_NEXT);
    }

    private handlePreviousTrack(): void {
        if (this.isDebounced()) return;
        kernelEventBus.emit(AudioEvents.MEDIA_PREV);
    }

    // ==================== METADATA UPDATES ====================

    /**
     * Update Media Session playback state
     */
    public setPlaybackState(state: MediaSessionPlaybackState): void {
        if (!this.isSupported) return;
        navigator.mediaSession.playbackState = state;
    }

    /**
     * Update track metadata for lockscreen/notification
     */
    public updateMetadata(track: MediaSessionTrackInfo | null): void {
        if (!this.isSupported) return;

        if (!track) {
            navigator.mediaSession.metadata = null;
            return;
        }

        const artwork: MediaImage[] = [];
        if (track.artwork) {
            artwork.push(
                { src: track.artwork, sizes: '96x96', type: 'image/jpeg' },
                { src: track.artwork, sizes: '256x256', type: 'image/jpeg' },
                { src: track.artwork, sizes: '512x512', type: 'image/jpeg' }
            );
        }

        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title || 'Unknown',
            artist: track.artist || 'Unknown Artist',
            album: track.album || 'Nhạc Quán',
            artwork
        });

        log.info(`Metadata: "${track.title}" - ${track.artist}`);

        // Emit event for other listeners
        kernelEventBus.emit('mediaSession:metadataUpdated', track);
    }

    /**
     * Manual position update (for seek operations)
     */
    public updatePositionState(duration: number, position: number, playbackRate: number = 1): void {
        if (!this.isSupported) return;

        try {
            navigator.mediaSession.setPositionState({
                duration: duration || 0,
                playbackRate,
                position: Math.min(position, duration || 0)
            });
        } catch (e) {
            // Some browsers don't support setPositionState
        }
    }

    // ==================== LIFECYCLE ====================

    /**
     * Re-register handlers on AudioContext resume
     */
    public onAudioContextResume(): void {
        if (!this.isInitialized) return;
        log.info('AudioContext resumed, re-registering');
        this.setupActionHandlers();
    }

    /**
     * Cleanup resources
     */
    public dispose(): void {
        if (!this.isSupported) return;

        // Stop position sync
        if (this.positionUpdateInterval) {
            clearInterval(this.positionUpdateInterval);
            this.positionUpdateInterval = null;
        }

        // Unsubscribe from Kernel events
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];

        // Clear action handlers
        const actions: MediaSessionAction[] = [
            'play', 'pause', 'stop', 'seekto',
            'seekforward', 'seekbackward', 'nexttrack', 'previoustrack'
        ];

        actions.forEach(action => {
            try {
                navigator.mediaSession.setActionHandler(action, null);
            } catch (e) { }
        });

        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';

        this.isInitialized = false;
        this.kernel = null;

        log.info('Disposed');
    }
}

// Export singleton
export const mediaSessionAdapter = new MediaSessionAdapter();
