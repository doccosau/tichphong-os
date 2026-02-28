import { kernelEventBus } from './EventBus';
import {
    KernelState,
    PlaybackState,
    DSPState,
    ThemeState,
    SyncState,
    AudioEvents,
    PlaylistState,
    TrackMetadata
} from './types';

const DEFAULT_PLAYBACK_STATE: PlaybackState = {
    isPlaying: false,
    isPaused: false,
    isStopped: true,
    currentTime: 0,
    duration: 0,
    bufferedTime: 0,
    playbackRate: 1.0,
    volume: 1.0,
    currentTrack: null,
    playlistState: {
        currentTrackIndex: -1,
        queue: [],
        shuffle: false,
        repeat: 'off'
    }
};

const DEFAULT_DSP_STATE: DSPState = {
    activePreset: 'DEFAULT_ANCIENT',
    eqConfig: { enabled: true, bands: [] },
    dynamicsConfig: { enabled: true, compressionRatio: 1.5, threshold: -24 },
    ambienceConfig: { enabled: false, reverbType: 'hall', wet: 0.3, decay: 1.5 },
    spatialConfig: { enabled: false, width: 0.5, crossfeed: 0, mode: 'stereo' }
};

const DEFAULT_THEME_STATE: ThemeState = {
    currentThemeId: 'DEFAULT_ANCIENT',
    themeVersion: '1.0.0',
    themeMetadata: {}
};

const DEFAULT_SYNC_STATE: SyncState = {
    roomId: null,
    isHost: false,
    roomPlaybackState: 'idle',
    syncLatency: 0,
    clockOffset: 0,
    participants: 0
};

const DEFAULT_STATE: KernelState = {
    playback: DEFAULT_PLAYBACK_STATE,
    dsp: DEFAULT_DSP_STATE,
    theme: DEFAULT_THEME_STATE,
    sync: DEFAULT_SYNC_STATE
};

/**
 * StateManager - Reactive state store for the audio kernel
 * 
 * Implements TPAudioKernel State Contract.
 * Emits 'state:updated' event when state changes.
 */
export class StateManager {
    private state: KernelState;

    constructor() {
        this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        // TODO: Load persisted preferences if needed
    }

    public getState(): KernelState {
        return this.state;  // BUG 5 FIX: No deep clone (called 60fps from tick())
    }

    // ==========================================
    // UPDATE METHODS
    // ==========================================

    public setPlaybackState(partial: Partial<PlaybackState>): void {
        this.state.playback = { ...this.state.playback, ...partial };
        kernelEventBus.emit(AudioEvents.STATE_UPDATED, this.getState());

        // Emit specific events for reactivity
        if (partial.isPlaying !== undefined) {
            if (partial.isPlaying) {
                console.log('🐞 [StateManager] Emitting PLAYBACK_STARTED');
                kernelEventBus.emit(AudioEvents.PLAYBACK_STARTED);
            }
            else if (partial.isPaused) kernelEventBus.emit(AudioEvents.PLAYBACK_PAUSED);
            else if (partial.isStopped) kernelEventBus.emit(AudioEvents.PLAYBACK_STOPPED);
        }
    }

    /**
     * Specialized method for high-frequency time updates
     * Does NOT emit full state update to avoid thrashing
     */
    public setTime(time: number): void {
        this.state.playback.currentTime = time;
        // Only emit localized time event
        kernelEventBus.emit(AudioEvents.TIME_UPDATED, { currentTime: time });
    }

    public setDuration(duration: number): void {
        this.state.playback.duration = duration;
        kernelEventBus.emit(AudioEvents.STATE_UPDATED, this.getState());
        // Also emit specific duration event for optimized listeners
        kernelEventBus.emit(AudioEvents.DURATION_UPDATED, duration);
    }

    public setBufferedTime(time: number): void {
        this.state.playback.bufferedTime = time;
        kernelEventBus.emit(AudioEvents.BUFFERED_TIME_UPDATED, time);
    }

    public setTrack(track: TrackMetadata | null): void {
        this.state.playback.currentTrack = track;
        kernelEventBus.emit(AudioEvents.TRACK_CHANGED, track);
        kernelEventBus.emit(AudioEvents.STATE_UPDATED, this.getState());
    }

    public setDSPState(partial: Partial<DSPState>): void {
        this.state.dsp = { ...this.state.dsp, ...partial };
        kernelEventBus.emit(AudioEvents.STATE_UPDATED, this.getState());

        if (partial.activePreset) kernelEventBus.emit(AudioEvents.DSP_PRESET_CHANGED, partial.activePreset);
    }

    public setThemeState(partial: Partial<ThemeState>): void {
        this.state.theme = { ...this.state.theme, ...partial };
        kernelEventBus.emit(AudioEvents.THEME_CHANGED, this.state.theme);
        kernelEventBus.emit(AudioEvents.STATE_UPDATED, this.getState());
    }

    public setSyncState(partial: Partial<SyncState>): void {
        this.state.sync = { ...this.state.sync, ...partial };
        kernelEventBus.emit(AudioEvents.SYNC_STATE_CHANGED, this.state.sync);
        kernelEventBus.emit(AudioEvents.STATE_UPDATED, this.getState());
    }

    public reset(): void {
        this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        kernelEventBus.emit(AudioEvents.STATE_UPDATED, this.getState());
    }
}
