/**
 * TichPhong Music Module
 * 
 * Core logic for the music player application.
 * Registered as a CMS module via manifest.
 */

// Module Manifest
export { musicModuleManifest } from './manifest';

// Context
export { PlayerProvider, usePlayer } from './context/PlayerContext';

// Stores
export { usePlaybackStore } from './stores/playback';
export { useQueueStore } from './stores/queue';
export { useLibraryStore } from './stores/library';

// Audio Controller (Signals-based for high-frequency updates)
export { audioController } from './signals/kernel-audio';

// Re-export common hooks from main hooks folder
export { useAudioError } from '../../react/useAudioError';


