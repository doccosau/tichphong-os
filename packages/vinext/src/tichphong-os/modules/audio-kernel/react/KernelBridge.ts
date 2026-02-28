/**
 * KernelBridge - Connects Legacy PlayerContext with TPAudioKernel
 * 
 * This bridge allows gradual migration from the old PlayerContext to the new AudioKernel.
 * It syncs state bidirectionally and forwards playback commands.
 */

import { useEffect, useCallback } from 'react';
import audioKernel from '..//audio-kernel';
import { kernelEventBus } from '..//audio-kernel/core/EventBus';

/**
 * Hook to bridge legacy player with AudioKernel
 * 
 * Usage: Call this once in PlayerProvider to enable kernel features
 */
export function useKernelBridge(options: {
    onStateChange?: (state: any) => void;
    onTrackEnd?: () => void;
    isEnabled?: boolean;
}) {
    const { onStateChange, onTrackEnd, isEnabled = true } = options;

    // Initialize kernel on mount
    useEffect(() => {
        if (!isEnabled) return;

        let initialized = false;

        const initKernel = async () => {
            try {
                if (!audioKernel.isReady()) {
                    await audioKernel.init();
                }
                initialized = true;
                console.log('🌉 [KernelBridge] Connected to AudioKernel');
            } catch (e) {
                console.error('❌ [KernelBridge] Failed to init kernel:', e);
            }
        };

        initKernel();

        return () => {
            if (initialized) {
                console.log('🌉 [KernelBridge] Disconnected');
            }
        };
    }, [isEnabled]);

    // Subscribe to kernel state changes
    useEffect(() => {
        if (!isEnabled || !onStateChange) return;

        const unsubscribe = kernelEventBus.on('state:updated', onStateChange);
        return unsubscribe;
    }, [isEnabled, onStateChange]);

    // Subscribe to track end events
    useEffect(() => {
        if (!isEnabled || !onTrackEnd) return;

        const unsubscribe = kernelEventBus.on('playback:ended', onTrackEnd);
        return unsubscribe;
    }, [isEnabled, onTrackEnd]);

    // Bridge methods that delegate to kernel
    const bridgeMethods = {
        /**
         * Load and play a track through the kernel
         */
        loadTrack: useCallback(async (trackId: string, src: string, metadata?: {
            title?: string;
            artist?: string;
            artwork?: string;
        }) => {
            if (!audioKernel.isReady()) return;

            try {
                await audioKernel.playback.load(trackId, src);

                // Update media session
                if (metadata) {
                    audioKernel.media.updateMetadata({
                        id: trackId,
                        src,
                        title: metadata.title,
                        artist: metadata.artist,
                        artwork: metadata.artwork
                    });
                }
            } catch (e) {
                console.error('❌ [KernelBridge] Load failed:', e);
            }
        }, []),

        /**
         * Play through kernel
         */
        play: useCallback(async () => {
            if (!audioKernel.isReady()) return;
            await audioKernel.playback.play();
        }, []),

        /**
         * Pause through kernel
         */
        pause: useCallback(() => {
            if (!audioKernel.isReady()) return;
            audioKernel.playback.pause();
        }, []),

        /**
         * Seek through kernel
         */
        seek: useCallback((time: number) => {
            if (!audioKernel.isReady()) return;
            audioKernel.playback.seek(time);
        }, []),

        /**
         * Set volume through kernel
         */
        setVolume: useCallback((volume: number) => {
            if (!audioKernel.isReady()) return;
            audioKernel.playback.setVolume(volume);
        }, []),

        /**
         * Apply theme preset
         */
        applyTheme: useCallback((themeId: string) => {
            if (!audioKernel.isReady()) return;
            audioKernel.theme.applyTheme(themeId);
        }, []),

        /**
         * Apply spatial preset
         */
        applySpatialPreset: useCallback((presetId: string) => {
            if (!audioKernel.isReady()) return;
            audioKernel.spatial.applySpatialPreset(presetId);
        }, []),

        /**
         * Toggle 432Hz mode
         */
        set432Hz: useCallback((enabled: boolean) => {
            if (!audioKernel.isReady()) return;
            audioKernel.audio.set432HzEnabled(enabled);
        }, []),

        /**
         * Get analyzer data for visualizers
         */
        getFrequencyData: useCallback(() => {
            if (!audioKernel.isReady() || !audioKernel.analyzer) return null;
            return audioKernel.analyzer.getFrequencyData();
        }, []),

        /**
         * Get waveform data for visualizers
         */
        getWaveformData: useCallback(() => {
            if (!audioKernel.isReady() || !audioKernel.analyzer) return null;
            return audioKernel.analyzer.getWaveformData();
        }, []),

        /**
         * Check if kernel is ready
         */
        isKernelReady: useCallback(() => {
            return audioKernel.isReady();
        }, [])
    };

    return bridgeMethods;
}

/**
 * Get kernel state snapshot
 */
export function getKernelState() {
    if (!audioKernel.isReady()) return null;
    return audioKernel.state.getState();
}

/**
 * Direct kernel access (for advanced usage)
 */
export { audioKernel };
