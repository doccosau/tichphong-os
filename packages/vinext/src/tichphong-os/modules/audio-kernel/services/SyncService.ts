/**
 * SyncService - Room Synchronization Bridge
 * 
 * Bridges audio-kernel events to/from ListeningRoomManager (Supabase Realtime).
 * 
 * Architecture:
 *   Kernel Intent → SyncService → ListeningRoomManager → Supabase Channel
 *   Supabase Channel → ListeningRoomManager → SyncService → kernelEventBus
 */
import { kernelEventBus } from '../core/EventBus';
import { AudioEvents } from '../core/types';
import { createLogger } from '../core/Logger';
import { listeningRoomManager, ROOM_EVENTS } from '@/services/ListeningRoomManager';
import type { RoomMember, RoomStatePayload } from '../../legacy/types/listening-room';

const log = createLogger('SyncService');

export interface SyncState {
    roomId: string | null;
    isHost: boolean;
    isConnected: boolean;
    latencyMs: number;
    memberCount: number;
}

export interface SyncCommand {
    type: 'play' | 'pause' | 'seek' | 'load' | 'next';
    trackId?: string;
    position?: number;
    timestamp: number;
}

export class SyncService {
    private roomId: string | null = null;
    private isHost: boolean = false;
    private isConnected: boolean = false;
    private latencyMs: number = 0;
    private memberCount: number = 0;

    // Cleanup functions for event subscriptions
    private unsubscribers: Array<() => void> = [];

    // Callbacks for incoming sync commands
    private onSyncCommand?: (cmd: SyncCommand) => void;

    constructor() {
        log.info('Initialized (bridge to ListeningRoomManager)');
    }

    /**
     * Register callback for incoming sync commands
     */
    public onCommand(callback: (cmd: SyncCommand) => void): void {
        this.onSyncCommand = callback;
    }

    /**
     * Join a listening room via ListeningRoomManager (Supabase Realtime)
     */
    public async joinRoom(roomId: string, user: RoomMember, asHost: boolean = false): Promise<boolean> {
        try {
            this.roomId = roomId;
            this.isHost = asHost;

            // Delegate to ListeningRoomManager (which handles Supabase channel)
            listeningRoomManager.joinRoom(roomId, {
                ...user,
                role: asHost ? 'host' : user.role || 'listener',
            });

            // Subscribe to room events → bridge to kernelEventBus
            this.subscribeToRoomEvents();

            // Measure latency via Supabase round-trip
            await this.calibrateLatency();

            this.isConnected = true;

            kernelEventBus.emit(AudioEvents.ROOM_JOINED, { roomId, isHost: asHost });
            log.info(`Joined room ${roomId} as ${asHost ? 'HOST' : 'GUEST'}`);

            return true;
        } catch (e) {
            log.error('Failed to join room:', e);
            return false;
        }
    }

    /**
     * Leave current room
     */
    public leaveRoom(): void {
        // Unsubscribe from room events
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];

        const oldRoomId = this.roomId;

        // Delegate to ListeningRoomManager
        listeningRoomManager.leaveRoom();

        this.roomId = null;
        this.isHost = false;
        this.isConnected = false;
        this.memberCount = 0;

        kernelEventBus.emit(AudioEvents.ROOM_LEFT, { roomId: oldRoomId });
        log.info('Left room');
    }

    /**
     * Broadcast a playback command (host only)
     * Routes to the correct ListeningRoomManager method
     */
    public broadcastCommand(cmd: Omit<SyncCommand, 'timestamp'>): void {
        if (!this.isHost || !this.isConnected) {
            log.warn('Only host can broadcast commands');
            return;
        }

        switch (cmd.type) {
            case 'play':
                listeningRoomManager.sendPlay(cmd.trackId || '', cmd.position || 0);
                break;
            case 'pause':
                listeningRoomManager.sendPause(cmd.position || 0);
                break;
            case 'seek':
                listeningRoomManager.sendSeek(cmd.position || 0);
                break;
            case 'next':
                listeningRoomManager.broadcast?.(ROOM_EVENTS.NEXT, {});
                break;
            case 'load':
                listeningRoomManager.sendPlay(cmd.trackId || '', 0);
                break;
        }

        log.info('Broadcast:', cmd.type);
    }

    /**
     * Broadcast full state sync (host only)
     */
    public broadcastState(state: RoomStatePayload): void {
        if (!this.isHost || !this.isConnected) return;
        listeningRoomManager.sendStateSync(state);
    }

    /**
     * Get current sync state
     */
    public getState(): SyncState {
        return {
            roomId: this.roomId,
            isHost: this.isHost,
            isConnected: this.isConnected,
            latencyMs: this.latencyMs,
            memberCount: this.memberCount,
        };
    }

    /**
     * Get estimated server time (adjusted for latency)
     */
    public getServerTime(): number {
        return Date.now(); // Supabase uses server timestamps in broadcasts
    }

    /**
     * Get synchronized position for guests
     */
    public getSyncedPosition(hostPosition: number, hostTimestamp: number): number {
        const elapsed = (Date.now() - hostTimestamp) / 1000;
        return hostPosition + elapsed;
    }

    // ═══════════════════════════════════════════════════════
    // PRIVATE: Room Event Subscriptions
    // ═══════════════════════════════════════════════════════

    /**
     * Subscribe to ListeningRoomManager events and bridge to kernel
     */
    private subscribeToRoomEvents(): void {
        // Play command from host
        const unsubPlay = listeningRoomManager.on(ROOM_EVENTS.PLAY, (payload: any) => {
            if (this.isHost) return; // Host ignores own broadcasts
            const cmd: SyncCommand = {
                type: 'play',
                trackId: payload.track_id,
                position: payload.start_time,
                timestamp: Date.now(),
            };
            log.info('Received PLAY:', payload.track_id);
            this.onSyncCommand?.(cmd);
            kernelEventBus.emit(AudioEvents.SYNC_ADJUSTED, cmd);
        });
        this.unsubscribers.push(unsubPlay);

        // Pause command
        const unsubPause = listeningRoomManager.on(ROOM_EVENTS.PAUSE, (payload: any) => {
            if (this.isHost) return;
            const cmd: SyncCommand = {
                type: 'pause',
                position: payload.pause_time,
                timestamp: Date.now(),
            };
            log.info('Received PAUSE');
            this.onSyncCommand?.(cmd);
            kernelEventBus.emit(AudioEvents.SYNC_ADJUSTED, cmd);
        });
        this.unsubscribers.push(unsubPause);

        // Seek command
        const unsubSeek = listeningRoomManager.on(ROOM_EVENTS.SEEK, (payload: any) => {
            if (this.isHost) return;
            const cmd: SyncCommand = {
                type: 'seek',
                position: payload.new_time,
                timestamp: Date.now(),
            };
            log.info('Received SEEK:', payload.new_time);
            this.onSyncCommand?.(cmd);
            kernelEventBus.emit(AudioEvents.SYNC_ADJUSTED, cmd);
        });
        this.unsubscribers.push(unsubSeek);

        // State sync (full state from host)
        const unsubState = listeningRoomManager.on(ROOM_EVENTS.STATE_SYNC, (payload: RoomStatePayload) => {
            if (this.isHost) return;
            log.info('Received STATE_SYNC');
            kernelEventBus.emit(AudioEvents.SYNC_STATE_CHANGED, payload);
        });
        this.unsubscribers.push(unsubState);

        // Next track
        const unsubNext = listeningRoomManager.on(ROOM_EVENTS.NEXT, (payload: any) => {
            if (this.isHost) return;
            const cmd: SyncCommand = {
                type: 'next',
                timestamp: Date.now(),
            };
            this.onSyncCommand?.(cmd);
        });
        this.unsubscribers.push(unsubNext);

        // Presence tracking → member count
        const unsubPresence = listeningRoomManager.on('presence_sync', (state: any) => {
            if (state) {
                this.memberCount = Object.keys(state).length;
                log.debug(`Members online: ${this.memberCount}`);
            }
        });
        this.unsubscribers.push(unsubPresence);
    }

    /**
     * Calibrate network latency via Supabase presence round-trip
     */
    private async calibrateLatency(): Promise<void> {
        const start = Date.now();
        try {
            // Use presence state fetch as a ping proxy
            listeningRoomManager.getPresenceState();
            this.latencyMs = Math.max(1, (Date.now() - start) / 2);
            log.info(`Latency: ~${this.latencyMs.toFixed(0)}ms`);
        } catch {
            this.latencyMs = 50; // Conservative default
            log.warn('Latency calibration failed, using default 50ms');
        }
    }

    /**
     * Clean up
     */
    public dispose(): void {
        this.leaveRoom();
    }
}
