import { useEffect, useState, useCallback } from 'react';
import { audioKernel } from '../core/Kernel';
import { kernelEventBus } from '../core/EventBus';
import { AudioEvents, KernelState } from '../core/types';

/**
 * useAudioKernelInit - Initialize the Audio Kernel
 * 
 * Returns { isReady, error } to gate rendering of audio-dependent UI.
 */
export const useAudioKernelInit = () => {
    const [isReady, setIsReady] = useState(audioKernel.isReady());
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            if (audioKernel.isReady()) return;
            try {
                await audioKernel.init();
            } catch (err) {
                console.error('[useAudioKernelInit] Failed:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
            }
        };

        const onReady = () => setIsReady(true);
        const onDestroy = () => setIsReady(false);

        kernelEventBus.on('kernelReady', onReady);
        kernelEventBus.on('kernelDestroy', onDestroy);

        init();

        return () => {
            kernelEventBus.off('kernelReady', onReady);
            kernelEventBus.off('kernelDestroy', onDestroy);
        };
    }, []);

    return { isReady, error };
};

/**
 * useKernelState - Subscribe to Kernel state updates
 * 
 * Safely handles the case where kernel is not yet ready.
 * Re-subscribes when kernelReady fires.
 */
export const useKernelState = (): KernelState => {
    const defaultState: KernelState = {
        playback: {
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
        },
        dsp: {
            activePreset: 'DEFAULT_ANCIENT',
            eqConfig: { enabled: true, bands: [] },
            dynamicsConfig: { enabled: true, compressionRatio: 1.5, threshold: -24 },
            ambienceConfig: { enabled: false, reverbType: 'hall', wet: 0.3, decay: 1.5 },
            spatialConfig: { enabled: false, width: 0.5, crossfeed: 0, mode: 'stereo' }
        },
        theme: {
            currentThemeId: 'DEFAULT_ANCIENT',
            themeVersion: '1.0.0',
            themeMetadata: {}
        },
        sync: {
            roomId: null,
            isHost: false,
            roomPlaybackState: 'idle',
            syncLatency: 0,
            clockOffset: 0,
            participants: 0
        }
    };

    const [state, setState] = useState<KernelState>(() => {
        try {
            if (audioKernel.isReady() && audioKernel.state) {
                return audioKernel.state.getState();
            }
        } catch (e) {
            // Kernel not ready
        }
        return defaultState;
    });

    useEffect(() => {
        const subscribeToState = () => {
            if (!audioKernel.isReady() || !audioKernel.state) return () => { };

            try {
                setState(audioKernel.state.getState());
            } catch (e) {
                return () => { };
            }

            return kernelEventBus.on('state:updated', (newState: KernelState) => {
                setState(newState);
            });
        };

        // Initial subscription
        let unsub = subscribeToState();

        // Re-subscribe when kernel becomes ready
        const onKernelReady = () => {
            unsub();
            unsub = subscribeToState();
        };
        kernelEventBus.on('kernelReady', onKernelReady);

        return () => {
            if (typeof unsub === 'function') unsub();
            kernelEventBus.off('kernelReady', onKernelReady);
        };
    }, []);

    return state;
};

/**
 * useAudioTime - Get real-time playback position
 * 
 * H1 FIX: Subscribes to TIME_UPDATED events from LifecycleManager's
 * single rAF loop instead of creating a third rAF loop.
 */
export const useAudioTime = () => {
    const [time, setTime] = useState(0);

    useEffect(() => {
        const unsub = kernelEventBus.on(AudioEvents.TIME_UPDATED, (payload: { currentTime: number }) => {
            setTime(payload.currentTime);
        });
        return unsub;
    }, []);

    return time;
};

/**
 * useAudioController - Get playback and theme control methods
 * 
 * Safe to call before kernel is ready - methods will no-op.
 */
/**
 * M1 FIX: Use kernel intent methods instead of bypassing the intent contract.
 */
export const useAudioController = () => {
    return {
        // Playback — via Kernel Intent Contract
        play: async (track?: { id: string; src: string; metadata?: any }) => {
            if (!audioKernel.isReady()) return;
            if (track) return audioKernel.intentPlay(track);
            return audioKernel.intentResume();
        },
        pause: () => {
            if (!audioKernel.isReady()) return;
            audioKernel.intentPause();
        },
        seek: (time: number) => {
            if (!audioKernel.isReady()) return;
            audioKernel.intentSeek(time);
        },
        setVolume: (vol: number) => {
            if (!audioKernel.isReady()) return;
            audioKernel.playback.setVolume(vol);
        },
        setLoop: (enabled: boolean) => {
            if (!audioKernel.isReady()) return;
            audioKernel.intentLoop(enabled);
        },

        // Queue
        setQueue: (tracks: any[]) => {
            if (!audioKernel.isReady()) return;
            audioKernel.queue.setQueue(tracks);
        },
        toggleShuffle: () => {
            if (!audioKernel.isReady()) return;
            audioKernel.queue.toggleShuffle();
        },
        setRepeatMode: (mode: 'off' | 'one' | 'all') => {
            if (!audioKernel.isReady()) return;
            audioKernel.queue.setRepeatMode(mode);
        },

        // Theme
        setTheme: (id: string) => {
            if (!audioKernel.isReady()) return;
            audioKernel.theme.applyTheme(id);
        },
        getThemes: () => {
            if (!audioKernel.isReady()) return [];
            return audioKernel.theme.getAvailableThemes();
        },

        // Audio Enhancer
        set432Hz: (enabled: boolean) => {
            if (!audioKernel.isReady()) return;
            audioKernel.audio.set432HzEnabled(enabled);
        },
        setNormalization: (enabled: boolean) => {
            if (!audioKernel.isReady()) return;
            audioKernel.audio.setNormalizationEnabled(enabled);
        },
        setCrossfade: (durationMs: number) => {
            if (!audioKernel.isReady()) return;
            audioKernel.audio.setCrossfadeDuration(durationMs);
        },
        setGapless: (enabled: boolean) => {
            if (!audioKernel.isReady()) return;
            audioKernel.audio.setGaplessEnabled(enabled);
        }
    };
};

/**
 * useAnalyzer - Get FFT data for visualizers
 */
export const useAnalyzer = () => {
    const getFrequencyData = useCallback(() => {
        if (!audioKernel.isReady() || !audioKernel.analyzer) return null;
        return audioKernel.analyzer.getFrequencyData();
    }, []);

    const getWaveformData = useCallback(() => {
        if (!audioKernel.isReady() || !audioKernel.analyzer) return null;
        return audioKernel.analyzer.getWaveformData();
    }, []);

    const getBinCount = useCallback(() => {
        if (!audioKernel.isReady() || !audioKernel.analyzer) return 0;
        return audioKernel.analyzer.getBinCount();
    }, []);

    return { getFrequencyData, getWaveformData, getBinCount };
};

/**
 * useSyncRoom - Listening room sync controls
 */
export const useSyncRoom = () => {
    const [syncState, setSyncState] = useState<{
        roomId: string | null;
        isHost: boolean;
        isConnected: boolean;
    }>({ roomId: null, isHost: false, isConnected: false });

    useEffect(() => {
        if (!audioKernel.isReady()) return;

        const updateState = () => {
            const state = audioKernel.sync.getState();
            setSyncState({
                roomId: state.roomId,
                isHost: state.isHost,
                isConnected: state.isConnected
            });
        };

        updateState();
        const unsub = kernelEventBus.on('sync:roomJoined', updateState);
        const unsub2 = kernelEventBus.on('sync:roomLeft', updateState);

        return () => {
            unsub();
            unsub2();
        };
    }, []);

    const joinRoom = useCallback(async (roomId: string, asHost = false) => {
        if (!audioKernel.isReady()) return false;
        return audioKernel.sync.joinRoom(roomId, asHost);
    }, []);

    const leaveRoom = useCallback(() => {
        if (!audioKernel.isReady()) return;
        audioKernel.sync.leaveRoom();
    }, []);

    return { ...syncState, joinRoom, leaveRoom };
};

