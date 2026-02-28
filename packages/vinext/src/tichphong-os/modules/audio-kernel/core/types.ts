/**
 * TPAudioKernel - Core Type Definitions
 * Defines the contract for Audio State and Event Architecture.
 */

// ==========================================
// 1. STATE CONTRACTS
// ==========================================

export interface PlaybackState {
    isPlaying: boolean;
    isPaused: boolean;
    isStopped: boolean;
    currentTime: number;
    duration: number;
    bufferedTime: number;
    playbackRate: number;
    volume: number;
    currentTrack: TrackMetadata | null;
    playlistState: PlaylistState;
}

export interface PlaylistState {
    currentTrackIndex: number;
    queue: string[]; // Track IDs
    shuffle: boolean;
    repeat: 'off' | 'one' | 'all';
}

export interface TrackMetadata {
    id: string;
    title: string;
    artist: string;
    album: string;
    artwork: string;
    duration: number;
    sourceUrl: string;
}

export interface DSPState {
    activePreset: string; // Preset ID
    eqConfig: EQConfig;
    dynamicsConfig: DynamicsConfig;
    ambienceConfig: AmbienceConfig;
    spatialConfig: SpatialConfig;
}

export interface EQConfig {
    enabled: boolean;
    bands: number[]; // Gains per band
}

export interface DynamicsConfig {
    enabled: boolean;
    compressionRatio: number;
    threshold: number;
}

export interface AmbienceConfig {
    enabled: boolean;
    reverbType: string;
    wet: number;
    decay: number; // Added for granular control
}

export interface SpatialConfig {
    enabled: boolean;
    width: number; // 0-1
    crossfeed: number; // 0-1 (Added for separation)
    mode: 'stereo' | 'binaural' | 'surround';
}

export interface ThemeState {
    currentThemeId: string;
    themeVersion: string;
    themeMetadata: Record<string, any>;
}

export interface SyncState {
    roomId: string | null;
    isHost: boolean;
    roomPlaybackState: 'playing' | 'paused' | 'buffering' | 'idle';
    syncLatency: number;
    clockOffset: number;
    participants: number;
}

export interface KernelState {
    playback: PlaybackState;
    dsp: DSPState;
    theme: ThemeState;
    sync: SyncState;
}

// ==========================================
// 2. EVENT DEFINITIONS
// ==========================================

export enum AudioEvents {
    // Playback Events
    PLAYBACK_STARTED = 'playback:started',
    PLAYBACK_PAUSED = 'playback:paused',
    PLAYBACK_STOPPED = 'playback:stopped',
    PLAYBACK_ENDED = 'playback:ended',
    PLAYBACK_SEEKED = 'playback:seeked',
    TRACK_CHANGED = 'playback:track_changed',
    TIME_UPDATED = 'playback:time_updated', // High frequency
    BUFFER_UPDATED = 'playback:buffer_updated',
    BUFFERED_TIME_UPDATED = 'playback:buffered_time_updated', // Added
    DURATION_UPDATED = 'playback:duration_updated', // Added
    VOLUME_CHANGED = 'playback:volume_changed',
    RATE_CHANGED = 'playback:rate_changed',

    // DSP Events
    DSP_PRESET_CHANGED = 'dsp:preset_changed',
    DSP_EQ_UPDATED = 'dsp:eq_updated',
    DSP_DYNAMICS_UPDATED = 'dsp:dynamics_updated',
    DSP_AMBIENCE_UPDATED = 'dsp:ambience_updated',
    DSP_SPATIAL_UPDATED = 'dsp:spatial_updated',

    // Theme Events
    THEME_CHANGED = 'theme:changed',
    THEME_LOADED = 'theme:loaded',

    // Metadata Events
    METADATA_LOADED = 'metadata:loaded',
    ARTWORK_UPDATED = 'metadata:artwork_updated',

    // Sync Events
    ROOM_JOINED = 'sync:room_joined',
    ROOM_LEFT = 'sync:room_left',
    SYNC_ADJUSTED = 'sync:adjusted',
    SYNC_STATE_CHANGED = 'sync:state_changed',

    // Lifecycle Events
    KERNEL_INITIALIZED = 'lifecycle:initialized',
    KERNEL_READY = 'lifecycle:ready',
    KERNEL_SUSPENDED = 'lifecycle:suspended',
    KERNEL_RESUMED = 'lifecycle:resumed',
    KERNEL_DESTROYED = 'lifecycle:destroyed',

    // Driver Events
    MODE_CHANGED = 'driver:mode_changed',

    // Media Session Events (headphones, bluetooth, lockscreen)
    MEDIA_NEXT = 'media:next',
    MEDIA_PREV = 'media:prev',

    // DSP Events
    DSP_STATE_CHANGED = 'dsp:state_changed',

    // State
    STATE_UPDATED = 'state:updated' // Full state update
}
