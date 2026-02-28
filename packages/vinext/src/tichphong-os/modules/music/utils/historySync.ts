/**
 * TichPhong Core 5.1.1 - History & XP Sync Utility
 * 
 * Module-level utility for session-based synchronization to D1.
 * Batches both history entries AND xp (Tu Vi) into single requests.
 */

interface HistoryEntry {
    songId: string;
    playedAt: number;
}

// Global sync state
let pendingSync: HistoryEntry[] = [];
let pendingXP = 0; // Accumulated XP to sync
let isSyncing = false;
let syncTimeout: ReturnType<typeof setTimeout> | null = null;

const API_BASE = import.meta.env.VITE_API_URL || '';

// Configuration
const BATCH_THRESHOLD = 20; // Sync when this many entries accumulated
const IDLE_SYNC_MS = 5 * 60 * 1000; // 5 minutes idle

/**
 * Queue a history entry for batch sync
 */
export const queueHistoryEntry = (songId: string, xpGained: number = 0): void => {
    pendingSync.push({
        songId,
        playedAt: Date.now()
    });
    pendingXP += xpGained;

    console.log(`[HistorySync] Queued: ${songId} (+${xpGained} XP, total pending: ${pendingXP})`);

    // Sync immediately if batch threshold reached
    if (pendingSync.length >= BATCH_THRESHOLD) {
        syncPendingHistory();
    } else {
        // Reset idle timer
        if (syncTimeout) {
            clearTimeout(syncTimeout);
        }
        syncTimeout = setTimeout(() => {
            syncPendingHistory();
        }, IDLE_SYNC_MS);
    }
};

/**
 * Queue XP gain without history entry (e.g., quest rewards)
 */
export const queueXP = (amount: number): void => {
    pendingXP += amount;
    console.log(`[HistorySync] Queued XP: +${amount} (total pending: ${pendingXP})`);

    // Schedule sync if not already scheduled
    if (!syncTimeout) {
        syncTimeout = setTimeout(() => {
            syncPendingHistory();
        }, IDLE_SYNC_MS);
    }
};

/**
 * Get current user auth info
 */
const getAuthInfo = async (): Promise<{ uid: string; token: string } | null> => {
    try {
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return null;

        const token = await user.getIdToken();
        return { uid: user.uid, token };
    } catch (err) {
        console.error('[HistorySync] Auth error:', err);
        return null;
    }
};

/**
 * Sync pending history entries + XP to D1
 */
export const syncPendingHistory = async (): Promise<boolean> => {
    if ((pendingSync.length === 0 && pendingXP === 0) || isSyncing) {
        return false;
    }

    const auth = await getAuthInfo();
    if (!auth) {
        console.log('[HistorySync] No auth, skipping sync');
        return false;
    }

    isSyncing = true;
    const entriesToSync = [...pendingSync];
    const xpToSync = pendingXP;
    pendingSync = [];
    pendingXP = 0;

    try {
        const response = await fetch(`${API_BASE}/api/history/${auth.uid}/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.token}`
            },
            body: JSON.stringify({
                entries: entriesToSync,
                xpDelta: xpToSync  // Piggyback XP on history sync
            })
        });

        if (!response.ok) {
            console.warn('[HistorySync] Sync failed:', response.status);
            pendingSync = [...entriesToSync, ...pendingSync];
            pendingXP += xpToSync;
            return false;
        }

        console.log(`[HistorySync] ✓ Synced ${entriesToSync.length} entries + ${xpToSync} XP to D1`);
        return true;
    } catch (err) {
        console.error('[HistorySync] Sync error:', err);
        pendingSync = [...entriesToSync, ...pendingSync];
        pendingXP += xpToSync;
        return false;
    } finally {
        isSyncing = false;
    }
};

/**
 * Get pending counts
 */
export const getPendingCount = (): number => pendingSync.length;
export const getPendingXP = (): number => pendingXP;

/**
 * Initialize beforeunload handler (call once at app start)
 */
export const initHistorySyncListeners = (): void => {
    // Sync on page close
    window.addEventListener('beforeunload', () => {
        if (pendingSync.length > 0 || pendingXP > 0) {
            getAuthInfo().then(auth => {
                if (auth) {
                    const payload = JSON.stringify({
                        entries: pendingSync,
                        xpDelta: pendingXP
                    });
                    navigator.sendBeacon(
                        `${API_BASE}/api/history/${auth.uid}/batch`,
                        new Blob([payload], { type: 'application/json' })
                    );
                    console.log('[HistorySync] Sent beacon on unload');
                }
            });
        }
    });

    // Sync on tab hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && (pendingSync.length > 0 || pendingXP > 0)) {
            syncPendingHistory();
        }
    });

    console.log('[HistorySync] Listeners initialized');
};
