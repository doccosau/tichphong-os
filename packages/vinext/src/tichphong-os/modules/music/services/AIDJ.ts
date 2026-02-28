import { Song } from '../../legacy/types/components';
import { registerService } from '../..//core/services';

const TAG_WEIGHTS = {
    GENRE: 5,
    MOOD: 3,
    INSTRUMENT: 2
};

class AIDJ {
    private static instance: AIDJ;

    private constructor() {
        registerService('ai_dj', this);
    }

    public static getInstance(): AIDJ {
        if (!AIDJ.instance) {
            AIDJ.instance = new AIDJ();
        }
        return AIDJ.instance;
    }

    /**
     * Generate "Next Up" recommendation
     * Simple Heuristic:
     * 1. Look at last 5 played songs
     * 2. Extract common tags (Genre, Tone)
     * 3. Find candidates in library that match tags but haven't been played recently
     */
    public recommendNextSong(
        history: Song[],
        library: Song[],
        currentSongId: string
    ): Song | null {
        if (history.length === 0 || library.length === 0) return null;

        // 1. Build User Profile from History (Last 5)
        const recentHistory = history.slice(-5);
        const tagProfile: Record<string, number> = {};

        recentHistory.forEach(song => {
            // Heuristic: Extract implicit tags from metadata if explicit tags missing
            // This is a placeholder for real metadata analysis
            const genre = song.metadata?.genre || 'CoPhong';
            tagProfile[genre] = (tagProfile[genre] || 0) + TAG_WEIGHTS.GENRE;
        });

        // 2. Score Candidates
        const candidates = library.filter(s => s.id !== currentSongId && !recentHistory.find(h => h.id === s.id));

        const scoredCandidates = candidates.map(song => {
            let score = 0;
            const genre = song.metadata?.genre || 'CoPhong';

            if (tagProfile[genre]) {
                score += tagProfile[genre];
            }

            // Random jitter to keep it fresh
            score += Math.random() * 2;

            return { song, score };
        });

        // 3. Pick Winner
        scoredCandidates.sort((a, b) => b.score - a.score);

        return scoredCandidates.length > 0 ? scoredCandidates[0].song : null;
    }

    /**
     * Detect Anomalous Behavior (Bot Farming)
     * Heuristic: 
     * - > 10 songs skipped in < 30 seconds each
     * - > 100 search queries in 1 minute
     */
    public detectAnomaly(events: any[]): boolean {
        // Placeholder for client-side heuristic
        // In reality, this should run on Worker/Server
        return false;
    }
}

export const aiDJ = AIDJ.getInstance();
