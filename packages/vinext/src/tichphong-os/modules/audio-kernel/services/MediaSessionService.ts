/**
 * MediaSessionService - Browser Media Session API Integration
 * 
 * Provides lock screen controls, Now Playing info, and media key handling.
 */
import { kernelEventBus } from '../core/EventBus';
import { QueueTrack } from '../playback/QueueManager';

export interface MediaSessionConfig {
    onPlay?: () => void;
    onPause?: () => void;
    onSeekBackward?: () => void;
    onSeekForward?: () => void;
    onPreviousTrack?: () => void;
    onNextTrack?: () => void;
    onSeekTo?: (time: number) => void;
    onStop?: () => void;
}

export class MediaSessionService {
    private config: MediaSessionConfig = {};
    private isSupported: boolean;

    constructor() {
        this.isSupported = 'mediaSession' in navigator;

        if (!this.isSupported) {
            console.warn('⚠️ [MediaSession] Not supported in this browser');
            return;
        }

        console.log('📱 [MediaSession] Initialized');
    }

    /**
     * Configure media session handlers
     */
    public configure(config: MediaSessionConfig): void {
        this.config = config;

        if (!this.isSupported) return;

        // Set action handlers
        try {
            if (config.onPlay) {
                navigator.mediaSession.setActionHandler('play', config.onPlay);
            }
            if (config.onPause) {
                navigator.mediaSession.setActionHandler('pause', config.onPause);
            }
            if (config.onSeekBackward) {
                navigator.mediaSession.setActionHandler('seekbackward', config.onSeekBackward);
            }
            if (config.onSeekForward) {
                navigator.mediaSession.setActionHandler('seekforward', config.onSeekForward);
            }
            if (config.onPreviousTrack) {
                navigator.mediaSession.setActionHandler('previoustrack', config.onPreviousTrack);
            }
            if (config.onNextTrack) {
                navigator.mediaSession.setActionHandler('nexttrack', config.onNextTrack);
            }
            if (config.onSeekTo) {
                navigator.mediaSession.setActionHandler('seekto', (details) => {
                    if (details.seekTime !== undefined) {
                        config.onSeekTo!(details.seekTime);
                    }
                });
            }
            if (config.onStop) {
                navigator.mediaSession.setActionHandler('stop', config.onStop);
            }
        } catch (e) {
            console.warn('⚠️ [MediaSession] Some handlers not supported:', e);
        }
    }

    /**
     * Update Now Playing metadata
     */
    public updateMetadata(track: QueueTrack | null): void {
        if (!this.isSupported || !track) {
            navigator.mediaSession.metadata = null;
            return;
        }

        const artwork: MediaImage[] = [];
        if (track.artwork) {
            artwork.push({
                src: track.artwork,
                sizes: '512x512',
                type: 'image/jpeg'
            });
        }

        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title || 'Unknown',
            artist: track.artist || 'Unknown Artist',
            album: 'Nhạc Quán',
            artwork
        });

        console.log('📱 [MediaSession] Updated:', track.title);
        kernelEventBus.emit('mediaSession:metadataUpdated', track);
    }

    /**
     * Update playback state
     */
    public setPlaybackState(state: 'playing' | 'paused' | 'none'): void {
        if (!this.isSupported) return;
        navigator.mediaSession.playbackState = state;
    }

    /**
     * Update position state (for seek bar on lock screen)
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
            // Some browsers don't support position state
        }
    }

    /**
     * Clear all handlers
     */
    public dispose(): void {
        if (!this.isSupported) return;

        const actions: MediaSessionAction[] = [
            'play', 'pause', 'seekbackward', 'seekforward',
            'previoustrack', 'nexttrack', 'seekto', 'stop'
        ];

        actions.forEach(action => {
            try {
                navigator.mediaSession.setActionHandler(action, null);
            } catch (e) { }
        });

        navigator.mediaSession.metadata = null;
    }
}
