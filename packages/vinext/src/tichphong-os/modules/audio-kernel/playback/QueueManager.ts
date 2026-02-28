/**
 * QueueManager - Track Queue and Playlist Management
 * 
 * @deprecated This queue is NOT authoritative. The Zustand queue store
 * (`src/modules/music/stores/queue.ts`) is the single source of truth
 * for queue state. This class exists only for internal kernel use and
 * may be removed in a future version.
 * 
 * Handles next/previous, shuffle, repeat modes, and queue operations.
 */
import { kernelEventBus } from '../core/EventBus';

export interface QueueTrack {
    id: string;
    src: string;
    title?: string;
    artist?: string;
    artwork?: string;
    duration?: number;
}

export type RepeatMode = 'off' | 'one' | 'all';
export type ShuffleMode = 'off' | 'on';

export interface QueueState {
    tracks: QueueTrack[];
    currentIndex: number;
    repeatMode: RepeatMode;
    shuffleMode: ShuffleMode;
    shuffledIndices: number[];
}

export class QueueManager {
    private tracks: QueueTrack[] = [];
    private currentIndex: number = -1;
    private repeatMode: RepeatMode = 'off';
    private shuffleMode: ShuffleMode = 'off';
    private shuffledIndices: number[] = [];
    private history: number[] = [];  // For back navigation in shuffle mode

    constructor() {
        console.log('📋 [QueueManager] Initialized');
    }

    // ═══════════════════════════════════════════════════════════════════
    // QUEUE OPERATIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Set the entire queue
     */
    public setQueue(tracks: QueueTrack[], startIndex: number = 0): void {
        this.tracks = [...tracks];
        this.currentIndex = startIndex;
        this.regenerateShuffleOrder();

        kernelEventBus.emit('queue:updated', this.getState());
        console.log(`📋 [QueueManager] Queue set with ${tracks.length} tracks`);
    }

    /**
     * Add track to end of queue
     */
    public addToQueue(track: QueueTrack): void {
        this.tracks.push(track);
        this.regenerateShuffleOrder();
        kernelEventBus.emit('queue:updated', this.getState());
    }

    /**
     * Add track to play next
     */
    public addNext(track: QueueTrack): void {
        this.tracks.splice(this.currentIndex + 1, 0, track);
        this.regenerateShuffleOrder();
        kernelEventBus.emit('queue:updated', this.getState());
    }

    /**
     * Remove track from queue
     */
    public removeFromQueue(index: number): void {
        if (index < 0 || index >= this.tracks.length) return;

        this.tracks.splice(index, 1);

        // Adjust current index if needed
        if (index < this.currentIndex) {
            this.currentIndex--;
        } else if (index === this.currentIndex) {
            this.currentIndex = Math.min(this.currentIndex, this.tracks.length - 1);
        }

        this.regenerateShuffleOrder();
        kernelEventBus.emit('queue:updated', this.getState());
    }

    /**
     * Clear the queue
     */
    public clearQueue(): void {
        this.tracks = [];
        this.currentIndex = -1;
        this.shuffledIndices = [];
        this.history = [];
        kernelEventBus.emit('queue:updated', this.getState());
    }

    // ═══════════════════════════════════════════════════════════════════
    // NAVIGATION
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Get current track
     */
    public getCurrentTrack(): QueueTrack | null {
        if (this.currentIndex < 0 || this.currentIndex >= this.tracks.length) {
            return null;
        }
        return this.tracks[this.currentIndex];
    }

    /**
     * Get next track (respecting shuffle/repeat)
     */
    public getNextTrack(): QueueTrack | null {
        const nextIndex = this.getNextIndex();
        if (nextIndex === -1) return null;
        return this.tracks[nextIndex];
    }

    /**
     * Get previous track
     */
    public getPreviousTrack(): QueueTrack | null {
        const prevIndex = this.getPreviousIndex();
        if (prevIndex === -1) return null;
        return this.tracks[prevIndex];
    }

    /**
     * Move to next track
     * @returns The new current track or null if end of queue
     */
    public next(): QueueTrack | null {
        if (this.repeatMode === 'one') {
            // Repeat one: stay on current
            return this.getCurrentTrack();
        }

        const nextIndex = this.getNextIndex();
        if (nextIndex === -1) return null;

        this.history.push(this.currentIndex);
        this.currentIndex = nextIndex;

        kernelEventBus.emit('queue:trackChanged', {
            track: this.getCurrentTrack(),
            index: this.currentIndex
        });

        return this.getCurrentTrack();
    }

    /**
     * Move to previous track
     */
    public previous(): QueueTrack | null {
        if (this.shuffleMode === 'on' && this.history.length > 0) {
            // In shuffle mode, go back through history
            this.currentIndex = this.history.pop()!;
        } else {
            const prevIndex = this.getPreviousIndex();
            if (prevIndex === -1) return null;
            this.currentIndex = prevIndex;
        }

        kernelEventBus.emit('queue:trackChanged', {
            track: this.getCurrentTrack(),
            index: this.currentIndex
        });

        return this.getCurrentTrack();
    }

    /**
     * Skip to specific index
     */
    public skipTo(index: number): QueueTrack | null {
        if (index < 0 || index >= this.tracks.length) return null;

        this.history.push(this.currentIndex);
        this.currentIndex = index;

        kernelEventBus.emit('queue:trackChanged', {
            track: this.getCurrentTrack(),
            index: this.currentIndex
        });

        return this.getCurrentTrack();
    }

    // ═══════════════════════════════════════════════════════════════════
    // MODES
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Toggle repeat mode: off → all → one → off
     */
    public toggleRepeat(): RepeatMode {
        switch (this.repeatMode) {
            case 'off': this.repeatMode = 'all'; break;
            case 'all': this.repeatMode = 'one'; break;
            case 'one': this.repeatMode = 'off'; break;
        }

        kernelEventBus.emit('queue:repeatChanged', this.repeatMode);
        return this.repeatMode;
    }

    /**
     * Toggle shuffle mode
     */
    public toggleShuffle(): ShuffleMode {
        this.shuffleMode = this.shuffleMode === 'off' ? 'on' : 'off';

        if (this.shuffleMode === 'on') {
            this.regenerateShuffleOrder();
        }

        kernelEventBus.emit('queue:shuffleChanged', this.shuffleMode);
        return this.shuffleMode;
    }

    public setRepeatMode(mode: RepeatMode): void {
        this.repeatMode = mode;
        kernelEventBus.emit('queue:repeatChanged', mode);
    }

    public setShuffleMode(mode: ShuffleMode): void {
        this.shuffleMode = mode;
        if (mode === 'on') {
            this.regenerateShuffleOrder();
        }
        kernelEventBus.emit('queue:shuffleChanged', mode);
    }

    // ═══════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════

    public getState(): QueueState {
        return {
            tracks: this.tracks,  // H3 FIX: No clone — read-only consumer
            currentIndex: this.currentIndex,
            repeatMode: this.repeatMode,
            shuffleMode: this.shuffleMode,
            shuffledIndices: this.shuffledIndices
        };
    }

    public hasNext(): boolean {
        return this.getNextIndex() !== -1;
    }

    public hasPrevious(): boolean {
        return this.getPreviousIndex() !== -1 || this.history.length > 0;
    }

    // ═══════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════════

    private getNextIndex(): number {
        if (this.tracks.length === 0) return -1;

        if (this.shuffleMode === 'on') {
            // Find current position in shuffle order
            const shufflePos = this.shuffledIndices.indexOf(this.currentIndex);
            if (shufflePos < this.shuffledIndices.length - 1) {
                return this.shuffledIndices[shufflePos + 1];
            }
            // End of shuffle - repeat all?
            if (this.repeatMode === 'all') {
                this.regenerateShuffleOrder();
                return this.shuffledIndices[0];
            }
            return -1;
        }

        // Normal mode
        if (this.currentIndex < this.tracks.length - 1) {
            return this.currentIndex + 1;
        }

        // End of queue - repeat all?
        if (this.repeatMode === 'all') {
            return 0;
        }

        return -1;
    }

    private getPreviousIndex(): number {
        if (this.tracks.length === 0) return -1;

        if (this.currentIndex > 0) {
            return this.currentIndex - 1;
        }

        // Beginning of queue - wrap if repeat all
        if (this.repeatMode === 'all') {
            return this.tracks.length - 1;
        }

        return -1;
    }

    private regenerateShuffleOrder(): void {
        if (this.tracks.length === 0) {
            this.shuffledIndices = [];
            return;
        }

        // Fisher-Yates shuffle
        this.shuffledIndices = Array.from({ length: this.tracks.length }, (_, i) => i);

        for (let i = this.shuffledIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shuffledIndices[i], this.shuffledIndices[j]] =
                [this.shuffledIndices[j], this.shuffledIndices[i]];
        }

        // Move current track to front of shuffle
        if (this.currentIndex >= 0) {
            const currentPos = this.shuffledIndices.indexOf(this.currentIndex);
            if (currentPos > 0) {
                this.shuffledIndices.splice(currentPos, 1);
                this.shuffledIndices.unshift(this.currentIndex);
            }
        }
    }
}
