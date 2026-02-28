/**
 * TichPhong Core 5.1.1 - Queue Store
 * 
 * Manages: queue, currentIndex, shuffle, repeat
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Track } from './playback';

export type RepeatMode = 'off' | 'all' | 'one';

interface QueueState {
    // State
    queue: Track[];
    currentIndex: number;
    shuffleEnabled: boolean;
    repeatMode: RepeatMode;
    showQueue: boolean;
    showLyrics: boolean;

    // Actions
    setQueue: (tracks: Track[], startIndex?: number) => void;
    addToQueue: (tracks: Track | Track[]) => void;
    playNext: (track: Track) => void;
    removeFromQueue: (index: number) => void;
    clearQueue: () => void;
    setCurrentIndex: (index: number) => void;
    getNextIndex: () => number;
    getPrevIndex: () => number;
    advanceQueue: () => number;
    retreatQueue: () => number;
    toggleShuffle: () => void;
    toggleRepeat: () => void;
    setShowQueue: (show: boolean) => void;
    setShowLyrics: (show: boolean) => void;
}

export const useQueueStore = create<QueueState>()(
    persist(
        (set, get) => ({
            // Initial state
            queue: [],
            currentIndex: -1,
            shuffleEnabled: false,
            repeatMode: 'off',
            showQueue: false,
            showLyrics: false,

            // Actions
            setQueue: (queue, startIndex = 0) => set({ queue: Array.isArray(queue) ? queue : [], currentIndex: startIndex }),

            addToQueue: (tracks) => set((state) => ({
                queue: [...(Array.isArray(state.queue) ? state.queue : []), ...(Array.isArray(tracks) ? tracks : [tracks])]
            })),

            playNext: (track) => set((state) => {
                const currentQueue = Array.isArray(state.queue) ? state.queue : [];
                const newQueue = [...currentQueue];
                newQueue.splice(state.currentIndex + 1, 0, track);
                return { queue: newQueue };
            }),

            removeFromQueue: (index) => set((state) => {
                const currentQueue = Array.isArray(state.queue) ? state.queue : [];
                const newQueue = currentQueue.filter((_, i) => i !== index);
                let newIndex = state.currentIndex;
                if (index < state.currentIndex) {
                    newIndex--;
                } else if (index === state.currentIndex && newIndex >= newQueue.length) {
                    newIndex = Math.max(0, newQueue.length - 1);
                }
                return { queue: newQueue, currentIndex: newIndex };
            }),

            clearQueue: () => set({ queue: [], currentIndex: -1 }),

            setCurrentIndex: (currentIndex) => set({ currentIndex }),

            getNextIndex: () => {
                const { queue, currentIndex, shuffleEnabled, repeatMode } = get();
                const safeQueue = Array.isArray(queue) ? queue : [];
                if (safeQueue.length === 0) return -1;

                if (shuffleEnabled) {
                    // Simple random for now, ideally should avoid repeats
                    let next = Math.floor(Math.random() * safeQueue.length);
                    // Try to avoid playing same song if queue > 1
                    if (safeQueue.length > 1 && next === currentIndex) {
                        next = (next + 1) % safeQueue.length;
                    }
                    return next;
                } else if (currentIndex >= safeQueue.length - 1) {
                    return repeatMode === 'all' ? 0 : -1;
                } else {
                    return currentIndex + 1;
                }
            },

            getPrevIndex: () => {
                const { queue, currentIndex, repeatMode } = get();
                const safeQueue = Array.isArray(queue) ? queue : [];
                if (safeQueue.length === 0) return -1;

                let prev = currentIndex - 1;
                if (prev < 0) {
                    prev = repeatMode === 'all' ? safeQueue.length - 1 : 0;
                }
                return prev;
            },

            advanceQueue: () => {
                const next = get().getNextIndex();
                if (next !== -1) {
                    set({ currentIndex: next });
                    return next;
                }
                return -1;
            },

            retreatQueue: () => {
                const prev = get().getPrevIndex();
                if (prev !== -1) {
                    set({ currentIndex: prev });
                    return prev;
                }
                return -1;
            },

            toggleShuffle: () => set((s) => ({ shuffleEnabled: !s.shuffleEnabled })),

            toggleRepeat: () => set((s) => ({
                repeatMode: s.repeatMode === 'off' ? 'all'
                    : s.repeatMode === 'all' ? 'one'
                        : 'off'
            })),

            setShowQueue: (showQueue) => set({ showQueue }),
            setShowLyrics: (showLyrics) => set({ showLyrics }),
        }),
        {
            name: 'tichphong-queue',
            partialize: (state) => ({
                queue: Array.isArray(state.queue) ? state.queue.slice(0, 200) : [], // Limit stored queue
                currentIndex: state.currentIndex,
                shuffleEnabled: state.shuffleEnabled,
                repeatMode: state.repeatMode,
            }),
            // Safe merge to handle corrupted data
            merge: (persistedState, currentState) => {
                const persisted = persistedState as Partial<QueueState> | undefined;

                // Validate and sanitize queue
                let sanitizedQueue: Track[] = [];
                if (Array.isArray(persisted?.queue)) {
                    sanitizedQueue = persisted.queue.filter(
                        (item): item is Track => item !== null && item !== undefined && typeof item === 'object'
                    );
                }

                return {
                    ...currentState,
                    queue: sanitizedQueue,
                    currentIndex: typeof persisted?.currentIndex === 'number' && persisted.currentIndex >= -1
                        ? Math.min(persisted.currentIndex, sanitizedQueue.length - 1)
                        : -1,
                    shuffleEnabled: typeof persisted?.shuffleEnabled === 'boolean' ? persisted.shuffleEnabled : false,
                    repeatMode: persisted?.repeatMode || 'off',
                };
            },
            // Handle rehydration errors
            onRehydrateStorage: () => (state, error) => {
                if (error) {
                    console.error('🚨 Queue hydration failed, clearing storage:', error);
                    try {
                        localStorage.removeItem('tichphong-queue');
                    } catch (e) {
                        console.error('Failed to clear queue storage:', e);
                    }
                } else if (state) {
                    console.log('✅ Queue rehydrated:', Array.isArray(state.queue) ? state.queue.length : 0, 'items');
                }
            },
        }
    )
);

// Selector hooks
export const useQueue = () => useQueueStore((s) => s.queue);
export const useCurrentIndex = () => useQueueStore((s) => s.currentIndex);
export const useShuffleEnabled = () => useQueueStore((s) => s.shuffleEnabled);
export const useRepeatMode = () => useQueueStore((s) => s.repeatMode);
export const useShowQueue = () => useQueueStore((s) => s.showQueue);
export const useShowLyrics = () => useQueueStore((s) => s.showLyrics);

// Actions hook
export const useQueueActions = () => useQueueStore((s) => ({
    setQueue: s.setQueue,
    addToQueue: s.addToQueue,
    playNext: s.playNext,
    removeFromQueue: s.removeFromQueue,
    clearQueue: s.clearQueue,
    setCurrentIndex: s.setCurrentIndex,
    getNextIndex: s.getNextIndex,
    getPrevIndex: s.getPrevIndex,
    advanceQueue: s.advanceQueue,
    retreatQueue: s.retreatQueue,
    toggleShuffle: s.toggleShuffle,
    toggleRepeat: s.toggleRepeat,
    setShowQueue: s.setShowQueue,
    setShowLyrics: s.setShowLyrics,
}));
