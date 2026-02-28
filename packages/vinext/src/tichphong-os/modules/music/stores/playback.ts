/**
 * TichPhong Core 5.1.1 - Playback Store
 */
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { Song } from '../../../legacy/types';

// Types (Track is now alias for Song to maintain compatibility if needed, or just use Song)
export type Track = Song;

interface PlaybackState {
    // State
    currentTrack: Song | null;
    isPlaying: boolean;
    volume: number;
    crossfadeEnabled: boolean;
    playbackPosition: number; // Current playback time in seconds
    duration: number;
    bufferedTime: number;

    // Actions
    play: () => void;
    pause: () => void;
    togglePlay: () => void;
    setVolume: (volume: number) => void;
    setTrack: (track: Song) => void;
    setCrossfade: (enabled: boolean) => void;
    setPlaybackPosition: (position: number) => void;
    setDuration: (duration: number) => void;
    setBufferedTime: (time: number) => void;
    reset: () => void;
}

export const usePlaybackStore = create<PlaybackState>()(
    subscribeWithSelector(
        persist(
            (set) => ({
                // Initial state
                currentTrack: null,
                isPlaying: false,
                volume: 0.8,
                crossfadeEnabled: false,
                playbackPosition: 0,
                duration: 0,
                bufferedTime: 0,

                // Actions
                play: () => set({ isPlaying: true }),
                pause: () => set({ isPlaying: false }),
                togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
                setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
                setTrack: (currentTrack) => set({ currentTrack, playbackPosition: 0, duration: currentTrack?.duration || 0 }),
                setCrossfade: (crossfadeEnabled) => set({ crossfadeEnabled }),
                setPlaybackPosition: (playbackPosition) => set({ playbackPosition }),
                setDuration: (duration) => set({ duration }),
                setBufferedTime: (bufferedTime) => set({ bufferedTime }),
                reset: () => set({ currentTrack: null, isPlaying: false, playbackPosition: 0, duration: 0 }),
            }),
            {
                name: 'tichphong-playback',
                partialize: (state) => ({
                    volume: state.volume,
                    crossfadeEnabled: state.crossfadeEnabled,
                    currentTrack: state.currentTrack,
                    playbackPosition: state.playbackPosition,
                }),
            }
        )
    )
);

// Selector hooks for optimized subscriptions
export const useCurrentTrack = () => usePlaybackStore((s) => s.currentTrack);
export const useIsPlaying = () => usePlaybackStore((s) => s.isPlaying);
export const useVolume = () => usePlaybackStore((s) => s.volume);
export const useCrossfadeEnabled = () => usePlaybackStore((s) => s.crossfadeEnabled);

// Actions hook (stable reference - never causes re-render)
export const usePlaybackActions = () => usePlaybackStore((s) => ({
    play: s.play,
    pause: s.pause,
    togglePlay: s.togglePlay,
    setVolume: s.setVolume,
    setTrack: s.setTrack,
    setCrossfade: s.setCrossfade,
    reset: s.reset,
}));
