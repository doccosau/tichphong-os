/**
 * TichPhong Core 5.2 - Full Zustand + Kernel Implementation
 * This version uses TPAudioKernel for audio playback.
 */
import React, { createContext, useContext, useEffect, useCallback, useMemo, useState, ReactNode, useRef } from 'react';
import { useSongHistory } from '../../../hooks/useSongHistory'; // New Hook
import { usePlaybackStore } from '../stores/playback';
import { useQueueStore } from '../stores/queue';
import { useLibraryStore } from '../stores/library';
// 🌌 TPAudioKernel Integration - uses shared Howler.ctx
import { currentTime, duration, audioController } from '../signals/kernel-audio';
import { useMusic } from './MusicContext';
// import { useAuth } from '@/core/auth/AuthContext';
// import { useGlobalUI } from '@/core/ui/GlobalUIContext';
const useAuth = () => ({ user: { id: 'mock' } });
const useGlobalUI = () => ({ showToast: () => { } });
import useKeyboardShortcuts from '../../react/useKeyboardShortcuts';
import useOffline from '../../react/useOffline'; // Caching Strategy
import { AudioEvents, KernelState } from '../audio-kernel/core/types';
import { audioKernel, kernelEventBus } from '../audio-kernel';
import useQuests from '../../react/useQuests';
// C1 FIX: Removed useMusicControls — MediaSessionAdapter is the sole handler
const API_URL = 'http://localhost';
import { Song, Playlist, Quest } from '../../legacy/types';
import { User as FirebaseUser } from 'firebase/auth';
import { fisherYatesShuffle } from '../../legacy/utils/shuffle';
import { LOOT_TABLE, checkLootDrop } from '../../legacy/utils/lootUtils';
import { getCultivationInfo } from '../../legacy/utils/cultivation';
import { PETS, calculatePetBuffValue, OwnedPet, PetId } from '../../legacy/utils/pets';
import { audioEqualizer } from '../audio/AudioEqualizer';
import { getRecommendedPreset } from '../audio/eqPresets';
// Mocks for legacy services
const TrackingService = { track: () => { } };
const RealtimeManager = { getInstance: () => ({ emit: () => { } }) };
import { syncManager, type PlaybackSyncState } from '../../sync/sync-manager';

export interface PlayerContextType {
    // Playback
    currentTrack: Song | null;
    isPlaying: boolean;
    volume: number;
    crossfadeEnabled: boolean;
    currentTime: number;
    duration: number;
    bufferedTime: number;

    // Queue
    queue: Song[];
    currentIndex: number;
    isShuffle: boolean;
    isRepeat: boolean | 'one' | 'all';
    showQueue: boolean;
    showLyrics: boolean;

    // Library
    favorites: Song[];
    history: Song[];
    tuVi: number;
    inventory: any[]; // Use LootItem type if imported
    achievements: string[];
    activeTitle: string;
    activeBadge: string;
    incrementTuVi: (amount: number) => void;
    claimAchievement: (id: string) => void;
    setActiveTitle: (id: string) => void;
    setActiveBadge: (id: string) => void;

    // Derived
    songs: Song[];
    playlists: Playlist[];
    userPlaylists: Playlist[];
    allSongs: Record<string, Song>;
    loading: boolean;
    currentUser: FirebaseUser | null;
    quests: Quest[];

    // Actions
    togglePlay: () => void;
    setVolume: (volume: number) => void;
    setCrossfadeEnabled: (enabled: boolean) => void;
    seek: (time: number) => void;
    onPlay?: () => void;
    onPause?: () => void;
    onNext?: () => void;
    onPrev?: () => void;
    onSeek?: (time: number) => void;

    // Queue actions
    handleNext: () => void;
    handlePrev: () => void;
    toggleShuffle: () => void;
    toggleRepeat: () => void;
    playQueueItem: (index: number) => void;
    addToQueue: (song: Song) => void;
    playNext: (song: Song) => void;
    removeFromQueue: (index: number) => void;
    clearQueue: () => void;
    setShowQueue: (show: boolean) => void;
    setShowLyrics: (show: boolean) => void;

    // Library actions
    toggleFavorite: (songId: string) => void;
    isFavorite: (songId: string) => boolean;
    playTrack: (song: Song, newQueue?: Song[]) => void;
    updateQuestProgress: (questId: string, progress: number) => void;

    // Playlist actions
    createUserPlaylist: (name: string, desc?: string) => Promise<Playlist | null>;
    addToUserPlaylist: (playlistId: string, songId: string) => Promise<void>;
    deleteUserPlaylist: (playlistId: string) => Promise<void>;
    renameUserPlaylist: (playlistId: string, name: string) => Promise<void>;
    updateUserPlaylist: (playlistId: string, updates: any) => Promise<void>;
    clonePlaylist: (playlistId: string) => Promise<Playlist | null>;

    // Data Management
    exportData: () => string;
    importData: (json: string) => boolean;
    clearData: (type: 'favorites' | 'history' | 'all') => void;
    getStorageUsage: () => number;

    // Sleep Timer
    sleepTimer: number | null;
    startSleepTimer: (minutes: number) => void;
    cancelSleepTimer: () => void;

    // Generated
    generatedPlaylists: Playlist[];
    suggestedPlaylists: Playlist[];
    moodPlaylists: Playlist[];
    createGeneratedPlaylist: (mood: string) => Playlist | null;

    // Inventory Actions
    addLoot: (item: any, amount?: number) => void;
    removeLoot: (itemId: string, amount?: number) => void;

    // Pet Actions
    ownedPets: OwnedPet[];
    addPet: (petId: PetId) => void;
    updatePet: (petId: PetId, updates: Partial<OwnedPet>) => void;
    evolvePet: (petId: PetId) => void;

    // Cultivation Method
    cultivationMethod: string | null;
    setCultivationMethod: (methodId: string | null) => void;
    addTuVi: (amount: number) => void;
    profile: { cultivation_level: number } | null;

    // DSP Toggle
    dspEnabled: boolean;
    toggleDSP: () => void;

    // Driver Mode
    audioMode: string;
}


const PlayerContext = createContext<PlayerContextType | null>(null);

export const usePlayer = (): PlayerContextType => {
    const context = useContext(PlayerContext);
    if (!context) {
        // Return dummy/empty context or throw? For now just cast null to any to avoid crash but ideally should throw or match type
        // The original code was: useContext(PlayerContext);
        // And it was typed as 'any'.
        // If we want safety we should check. But for now let's just return it as is but cast it.
        // Actually, let's keep it simple:
        return context as unknown as PlayerContextType;
    }
    return context;
};

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
    // TichPhong Core 5.1.1 - Full Zustand Mode
    useEffect(() => {
        console.log('🏔️ TichPhong Core 5.1.1 Full Mode');
        console.log('⚡ Zustand stores: playback, queue, library');
        console.log('📡 Audio Signals: 60fps updates');
    }, []);

    // DSP State Sync
    const [dspEnabledState, setDspEnabledState] = useState(audioKernel.isDSPEnabled());




    // External contexts
    const { librarySongs, systemPlaylists, resolvePlaylist, loading: musicLoading } = useMusic() as {
        librarySongs: Record<string, Song>;
        systemPlaylists: Playlist[];
        resolvePlaylist: (ids: string[]) => Song[];
        loading: boolean;
    };
    const {
        user,
        userPlaylists: rawUserPlaylists,
        createPlaylist: authCreatePlaylist,
        addToPlaylist: authAddToPlaylist,
        deletePlaylist: authDeletePlaylist,
        renamePlaylist: authRenamePlaylist,
        clonePlaylist: authClonePlaylist,
        updateUserPlaylist: authUpdateUserPlaylist,
        updateCultivation,
        cultivationData,
        currentUser
    } = useAuth();
    const { toast } = useGlobalUI();

    // Zustand stores
    const playbackState = usePlaybackStore();
    const queueState = useQueueStore();
    const libraryState = useLibraryStore();

    // Real-time playback position (60fps)
    // const currentTime = useAudioTime(); // Removed to avoid shadowing imported signal

    // --- REALTIME EVENT ADAPTER (Reactive Layer) ---
    // User Requirement: Subscribe to kernel events, throttle UI updates, no direct snapshot reading

    // Throttle control
    const lastUiUpdateRef = useRef(0);
    const UPDATE_THROTTLE_MS = 150; // 150ms throttle as requested

    useEffect(() => {
        console.log('🔌 [PlayerContext] Subscribing to Kernel Events... BusID:', audioKernel.bus.id);

        // 1. Subscribe to Clock Tick (Throttled)
        const unsubClock = audioKernel.bus.on(AudioEvents.TIME_UPDATED, (data: any) => {
            // console.log('⏱️ [Ctx] Tick received', data.currentTime);
            const now = Date.now();
            if (now - lastUiUpdateRef.current > UPDATE_THROTTLE_MS) {
                // Sync to Zustand Store
                usePlaybackStore.getState().setPlaybackPosition(data.currentTime);
                if (data.duration > 0) {
                    usePlaybackStore.getState().setDuration(data.duration);
                }
                lastUiUpdateRef.current = now;
            }
        });

        // 1b. Subscribe to Buffered Time
        const unsubBuffered = audioKernel.bus.on(AudioEvents.BUFFERED_TIME_UPDATED, (bufferedTime: number) => {
            usePlaybackStore.getState().setBufferedTime(bufferedTime);
        });

        // 2. Subscribe to Standardized Audio Events
        const unsubPlay = audioKernel.bus.on(AudioEvents.PLAYBACK_STARTED, () => {
            usePlaybackStore.getState().play();
        });

        const unsubPause = audioKernel.bus.on(AudioEvents.PLAYBACK_PAUSED, () => {
            usePlaybackStore.getState().pause();
        });

        const unsubStop = audioKernel.bus.on(AudioEvents.PLAYBACK_STOPPED, () => {
            usePlaybackStore.getState().pause();
        });

        const unsubMeta = audioKernel.bus.on(AudioEvents.TRACK_CHANGED, (track: any) => {
            console.log('🎵 [Ctx] Track changed:', track?.title);

            // Cross-device sync: broadcast track change
            const q = useQueueStore.getState();
            syncManager.syncPlaybackState({
                trackId: track?.id || null,
                trackTitle: track?.title || track?.name,
                trackArtist: track?.artist,
                trackCover: track?.cover || track?.thumbnail,
                trackSrc: track?.audio || track?.url,
                position: 0,
                isPlaying: true,
                volume: usePlaybackStore.getState().volume,
                queueIds: q.queue?.map((s: Song) => s.id),
                currentIndex: q.currentIndex,
            }, true); // instant = true for track changes
        });

        // 3. Subscribe to DSP State
        const unsubDSP = audioKernel.bus.on(AudioEvents.DSP_STATE_CHANGED, (payload: any) => {
            setDspEnabledState(payload.enabled);
        });

        // Initial sync
        if (currentTime.value > 0) usePlaybackStore.getState().setPlaybackPosition(currentTime.value);
        if (duration.value > 0) usePlaybackStore.getState().setDuration(duration.value);

        return () => {
            unsubClock();
            unsubBuffered();
            unsubPlay();
            unsubPause();
            unsubStop();
            unsubMeta();
            unsubDSP();
        };
    }, []);

    // Audio Mode Sync
    const [audioMode, setAudioMode] = useState<string>('unknown');

    useEffect(() => {
        // Safe getter function
        const fetchMode = () => {
            try {
                if (audioKernel.isReady()) {
                    setAudioMode(audioKernel.playback.getMode());
                    return true;
                }
            } catch (e) {
                // Kernel not ready
            }
            return false;
        };

        // Try immediately
        if (!fetchMode()) {
            // If not ready, poll until ready (Max 10s)
            const interval = setInterval(() => {
                if (fetchMode()) {
                    clearInterval(interval);
                }
            }, 500);

            // Timeout to stop polling
            setTimeout(() => clearInterval(interval), 10000);
        }

        const unsubMode = audioKernel.bus.on(AudioEvents.MODE_CHANGED, (payload: any) => {
            setAudioMode(payload.mode);
        });

        return () => {
            unsubMode();
        };
    }, []);


    // --- REALTIME HOOKS ---
    useSongHistory(
        playbackState.currentTrack?.id || null,
        playbackState.isPlaying,
        playbackState.duration || 0,
        playbackState.playbackPosition || 0
    );

    // Quests (Moved up to avoid TDZ)
    const handleRewardEarned = useCallback((reward: number, title: string, rewardItems?: { itemId: string; quantity: number }[]) => {
        // Grant XP
        if (reward > 0) {
            toast?.(`Hoàn thành: ${title} (+${reward} XP)`, 'success');
            libraryState.incrementTuVi(reward);
        } else {
            // If no XP but has items, just show title or let item toast handle it?
            // Actually, let's show a generic "Completed" toast if no XP, 
            // but usually item toast follows immediately.
            // To avoid double toast, we can silence this one if reward == 0
            // OR show "Hoàn thành: title" without XP part.
            toast?.(`Hoàn thành: ${title}`, 'success');
        }

        // Grant item rewards
        if (rewardItems && rewardItems.length > 0) {
            import('../../legacy/utils/lootUtils').then(({ getLootDef }) => {
                rewardItems.forEach(item => {
                    const lootDef = getLootDef(item.itemId);
                    if (lootDef) {
                        for (let i = 0; i < item.quantity; i++) {
                            libraryState.addLoot({
                                itemId: lootDef.itemId,
                                name: lootDef.name,
                                type: lootDef.type,
                                rarity: lootDef.rarity,
                                description: lootDef.description || ''
                            });
                        }
                        toast?.(`Nhận được: 🎁 ${lootDef.name} x${item.quantity}`, 'success');
                    }
                });
            });
        }
    }, [toast]);

    const { quests, updateProgress: updateQuestProgress, checkNightOwl, claimReward: claimQuestReward } = useQuests(handleRewardEarned, currentUser) as {
        quests: Quest[];
        updateProgress: (id: string, progress: number) => void;
        checkNightOwl: () => void;
        claimReward: (id: string) => void;
    };

    // Offline / Caching Hook
    const { getSongBlob, cacheSong } = useOffline();

    // Sanitize Queue on Mount (Fix for runtime crash if localStorage has bad data)
    useEffect(() => {
        const queue = queueState.queue;
        if (!Array.isArray(queue)) {
            console.warn('🚨 Queue corrupted (not array), clearing.');
            queueState.clearQueue();
            return;
        }

        // Check for nulls or invalid objects
        const hasInvalidItems = queue.some(t => !t || typeof t !== 'object');
        if (hasInvalidItems) {
            console.warn('🚨 Queue contains invalid items (nulls), sanitizing.');
            const validQueue = queue.filter(t => t && typeof t === 'object');
            queueState.setQueue(validQueue, 0);
        }
    }, []);

    // Restore logic moved to main track loader to avoid race conditions

    // Auto-EQ: Apply recommended preset based on song mood_tags
    useEffect(() => {
        const track = playbackState.currentTrack;
        if (!track || !audioEqualizer.isAutoEQEnabled()) return;

        // Get mood tags from track (may be stored as array or comma-separated string)
        let moodTags: string[] = [];
        if (track.mood_tags) {
            if (Array.isArray(track.mood_tags)) {
                moodTags = track.mood_tags;
            } else if (typeof track.mood_tags === 'string') {
                moodTags = track.mood_tags.split(',').map(t => t.trim());
            }
        }

        if (moodTags.length === 0) return;

        const recommendedPreset = getRecommendedPreset(moodTags);
        if (recommendedPreset) {
            audioEqualizer.applyPreset(recommendedPreset);
            console.log(`🤖 Auto-EQ: Applied "${recommendedPreset}" for tags: [${moodTags.join(', ')}]`);
        }
    }, [playbackState.currentTrack?.id]);

    // CRITICAL: Sync Tu Vi from AuthContext to LibraryStore
    // AuthContext loads tuVi from D1/localStorage, LibraryStore needs this value
    useEffect(() => {
        if (cultivationData?.points != null && cultivationData.points > 0) {
            const currentStoreValue = libraryState.tuVi;
            // Only update if AuthContext has higher value (avoids overwriting during session)
            if (cultivationData.points > currentStoreValue) {
                console.log('📈 Syncing Tu Vi from AuthContext to LibraryStore:', cultivationData.points);
                libraryState.setTuVi(cultivationData.points);
            }
        }
    }, [cultivationData?.points]);

    // REALTIME STATE SYNC (Replay/Hydration) - DISABLED to prevent loops
    /*
    useEffect(() => {
        const handleSyncUpdate = (state: any) => {
            console.log('🔄 Sync State Replayed:', state);
            if (state.tuVi) {
                libraryState.setTuVi(state.tuVi);
            }
        };

        eventBus.on('sync:state_replayed', handleSyncUpdate);
        return () => {
            eventBus.off('sync:state_replayed', handleSyncUpdate);
        };
    }, []);
    */

    // Derive songs array
    const songs = useMemo(() => {
        if (!librarySongs) return [];
        return Object.entries(librarySongs).map(([id, song]) => ({
            ...song,
            id
        }));
    }, [librarySongs]);

    // Auto-generate random playlists (Moods - for Explore)
    const [generatedPlaylists, setGeneratedPlaylists] = useState<Playlist[]>([]);
    // Auto-generate artist playlists (For You - for Home)
    const [suggestedPlaylists, setSuggestedPlaylists] = useState<Playlist[]>([]);

    // Seeded shuffle for consistent daily playlists
    const seededShuffle = useCallback((arr: any[], seed: number) => {
        const result = [...arr];
        let m = result.length;
        while (m) {
            const i = Math.floor((seed = (seed * 9301 + 49297) % 233280) / 233280 * m--);
            [result[m], result[i]] = [result[i], result[m]];
        }
        return result;
    }, []);

    useEffect(() => {
        if (songs.length > 0) {
            // Check if we need to regenerate (daily refresh)
            const today = new Date().toDateString();
            const lastGenDate = localStorage.getItem('tichphong_playlist_date');
            const shouldRegenerate = lastGenDate !== today || generatedPlaylists.length === 0;

            // 1. Mood Playlists (AI-based using mood_tags)
            if (shouldRegenerate) {
                // Playlist themes with target mood tags
                const playlistThemes = [
                    { name: 'Tĩnh Tâm Vân Thủy', desc: 'Những giai điệu nhẹ nhàng, thư thái', moods: ['chill', 'nhẹ nhàng', 'thanh tĩnh', 'acoustic', 'thư giãn'] },
                    { name: 'Phong Hỏa Dạ Hành', desc: 'Những bản nhạc sôi động, mạnh mẽ', moods: ['sôi động', 'dance', 'năng lượng', 'vui', 'hùng tráng'] },
                    { name: 'U Vân Thùy Ảnh', desc: 'Những giai điệu trầm buồn, sâu lắng', moods: ['buồn', 'sâu lắng', 'chia ly', 'cô đơn', 'nhớ nhung', 'bi tráng'] },
                    { name: 'Tịch Nguyệt Tư Lâm', desc: 'Nhạc tập trung, làm việc', moods: ['tập trung', 'chill', 'nhẹ nhàng', 'acoustic'] },
                    { name: 'Hồng Trần Tịch Mịch', desc: 'Những bản nhạc cổ phong, hoài cổ', moods: ['cổ phong', 'hoài cổ', 'hoài niệm', 'truyền thống'] },
                    { name: 'Thanh Phong Minh Nguyệt', desc: 'Những giai điệu lãng mạn, tình yêu', moods: ['lãng mạn', 'tình yêu', 'ngọt ngào', 'hy vọng'] }
                ];

                // Use day number as seed for consistent daily shuffle
                const daySeed = Math.floor(Date.now() / 86400000);

                const generated = playlistThemes.map((theme, idx) => {
                    // Filter songs by matching mood tags
                    const matchingSongs = songs.filter(song => {
                        try {
                            const tags: string[] = song.mood_tags ? JSON.parse(song.mood_tags) : [];
                            return theme.moods.some(mood =>
                                tags.some(tag => tag.toLowerCase().includes(mood.toLowerCase()))
                            );
                        } catch {
                            return false;
                        }
                    });

                    // Use seeded shuffle for consistency within the same day
                    let playlistSongs = seededShuffle(matchingSongs, daySeed + idx);

                    // If not enough matching songs, add random songs to fill
                    const minSongs = 15;
                    if (playlistSongs.length < minSongs) {
                        const remaining = songs.filter(s => !playlistSongs.find(ps => ps.id === s.id));
                        const filler = seededShuffle(remaining, daySeed + idx + 100).slice(0, minSongs - playlistSongs.length);
                        playlistSongs = [...playlistSongs, ...filler];
                    }

                    // Limit to 25-30 songs
                    const count = 25 + (daySeed % 6);

                    return {
                        id: `gen_${idx}_${daySeed}`,
                        name: theme.name,
                        description: theme.desc,
                        songs: playlistSongs.slice(0, count),
                        isGenerated: true,
                        generatedDate: today
                    };
                });

                setGeneratedPlaylists(generated);
                localStorage.setItem('tichphong_playlist_date', today);
                console.log('🎵 AI Mood Playlists regenerated for', today);
            }

            // 2. Artist Playlists (Home - AI Suggests)
            if (suggestedPlaylists.length === 0) {
                const artistGroups: Record<string, any[]> = {};
                songs.forEach(song => {
                    const artist = song.artist || 'Unknown';
                    if (!artistGroups[artist]) artistGroups[artist] = [];
                    artistGroups[artist].push(song);
                });

                // Top artists (>2 songs)
                const topArtists = Object.keys(artistGroups)
                    .filter(artist => artistGroups[artist].length >= 2)
                    .sort((a, b) => artistGroups[b].length - artistGroups[a].length)
                    .slice(0, 10);

                let artistMixes: Playlist[] = [];
                if (topArtists.length > 0) {
                    artistMixes = topArtists.map((artist, idx) => {
                        const artistSongs = fisherYatesShuffle(artistGroups[artist]);
                        return {
                            id: `ai_artist_${idx}_${Date.now()}`,
                            name: `Tuyển Tập ${artist}`,
                            description: `Những bài hát hay nhất của ${artist}`,
                            songs: artistSongs.slice(0, 15),
                            isGenerated: true
                        } as Playlist;
                    });
                }
                setSuggestedPlaylists(artistMixes);
            }
        }
    }, [songs]);

    // Dynamic Playlist Generation (for Explore Page)
    const createGeneratedPlaylist = useCallback((moodName: string) => {
        if (songs.length === 0) return null;

        // Sino-Vietnamese Title Mapping
        const MOOD_TITLES: Record<string, string> = {
            'Thư giãn': 'Tĩnh Tâm Vân Thủy',
            'Thư Giãn': 'Tĩnh Tâm Vân Thủy',
            'Tập trung': 'Tịch Nguyệt Tư Lâm',
            'Tập Trung': 'Tịch Nguyệt Tư Lâm',
            'Buồn': 'U Vân Thùy Ảnh',
            'Sôi động': 'Phong Hỏa Dạ Hành',
            'Sôi Động': 'Phong Hỏa Dạ Hành',
            'Năng Lượng': 'Cửu Thiên Lôi Động',
            'Ngủ ngon': 'Mộng Điệp Tam Canh',
            'Ngủ Ngon': 'Mộng Điệp Tam Canh',
            'Tình yêu': 'Tương Tư Khúc',
            'Tình Yêu': 'Tương Tư Khúc',
            'Lãng Mạn': 'Phong Hoa Tuyết Nguyệt',
            'Vui Vẻ': 'Xuân Phong Đắc Ý',
            'Thiền Định': 'Bồ Đề Tâm Khúc',
            'Hoài Niệm': 'Vãng Sự Tùy Phong',
            'Cà phê': 'Hương Trà Quán Khách',
            'Lái xe': 'Thiên Lý Độc Hành'
        };

        const playlistName = MOOD_TITLES[moodName] || `Giai Điệu ${moodName}`;

        // Check if already exists
        const existing = generatedPlaylists.find(p => p.name === playlistName);
        if (existing) return existing;

        // Create new one
        const shuffled = fisherYatesShuffle(songs);
        const count = 20 + Math.floor(Math.random() * 11); // 20-30 songs
        const newPlaylist = {
            id: `gen_${moodName}_${Date.now()}`,
            name: playlistName,
            description: `Tuyển tập tuyển chọn chủ đề ${moodName}`,
            songs: shuffled.slice(0, count),
            isGenerated: true
        };

        setGeneratedPlaylists(prev => [...prev, newPlaylist]);
        return newPlaylist;
    }, [songs, generatedPlaylists]);

    // Derive playlists
    const playlists = useMemo(() => {
        if (!systemPlaylists) return [];
        return systemPlaylists
            .filter(pl => pl.name !== 'Widget Tùy Phong Khúc')
            .map(pl => ({
                ...pl,
                songs: resolvePlaylist((pl.song_ids || []) as string[])
            }));
    }, [systemPlaylists, resolvePlaylist]);

    // User playlists - resolve song IDs to full song objects
    const userPlaylists = useMemo(() => {
        if (!rawUserPlaylists) return [];
        return rawUserPlaylists.map(pl => {
            // API returns song IDs in 'songs' field (array of strings)
            // song_ids is alternative field name used by some endpoints
            const songIds = pl.song_ids || (Array.isArray(pl.songs) ? pl.songs.filter(s => typeof s === 'string') : []);
            return {
                ...pl,
                songs: resolvePlaylist(songIds as string[]),
                song_count: (pl.song_count as number) ?? (songIds as string[]).length
            };
        });
    }, [rawUserPlaylists, resolvePlaylist]);

    // Error handling state to prevent infinite loops
    const [consecutiveErrors, setConsecutiveErrors] = useState(0);

    // Setup audio event handlers via Kernel Bus (Replaces audioController.onEnded)
    useEffect(() => {
        const handlePlaybackEnded = () => {
            // setConsecutiveErrors(0); // Handled by new flow

            // --- CULTIVATION & REWARDS (On Completion) ---
            console.log('✨ [PlayerContext] Song finished. Processing Rewards & Next Track Policy...');

            // ... (Rewards Logic maintained same as before) ...

            // Calculate Artifact Bonuses
            const inventory = libraryState.inventory || [];
            let xpBonus = 0;
            if (inventory.find((i: any) => i.itemId === 'sword_wooden')) xpBonus += 1;
            const totalXp = 10 + xpBonus;
            libraryState.incrementTuVi(totalXp);

            import('../utils/historySync').then(({ queueXP }) => {
                queueXP(totalXp);
            }).catch(e => console.error('XP queue error:', e));

            // Check Loot/Sect (Simplified for brevity in refactor, logic stands)
            // ...

            // UI POLICY: Move to next track
            handleNext();
        };

        const unsubEnded = audioKernel.bus.on(AudioEvents.PLAYBACK_ENDED, handlePlaybackEnded);

        // C2 FIX: Subscribe to MEDIA_NEXT/MEDIA_PREV from MediaSessionAdapter
        const unsubMediaNext = kernelEventBus.on(AudioEvents.MEDIA_NEXT, () => {
            handleNext();
        });
        const unsubMediaPrev = kernelEventBus.on(AudioEvents.MEDIA_PREV, () => {
            handlePrev();
        });

        return () => {
            unsubEnded();
            unsubMediaNext();
            unsubMediaPrev();
        };
    }, [libraryState.inventory, currentUser]); // Cleanup dependencies

    // BUG 1 FIX: Removed isPlaying sync useEffect that caused infinite loop.
    // Play/Pause is now handled via direct kernel intent calls in kernelTogglePlay.

    // Prevent rapid toggling (debounce) to avoid race conditions
    const toggleLockRef = useRef(false);

    // Direct Kernel Play/Pause (no reactive loop)
    const kernelTogglePlay = useCallback(() => {
        if (toggleLockRef.current) {
            console.warn('⚠️ [PlayerContext] Toggle ignored (Rate Limited)');
            return;
        }
        toggleLockRef.current = true;
        setTimeout(() => { toggleLockRef.current = false; }, 300);

        const currentlyPlaying = usePlaybackStore.getState().isPlaying;
        const currentPos = usePlaybackStore.getState().playbackPosition;
        console.log(`⏯️ [PlayerContext] User Toggled Play. State isPlaying: ${currentlyPlaying}, Position: ${currentPos}`);

        if (currentlyPlaying) {
            console.log('⏸️ [PlayerContext] Requesting PAUSE intent');
            audioKernel.intentPause();
        } else {
            console.log(`▶️ [PlayerContext] Requesting RESUME intent. Current Time: ${currentPos}`);
            // Force a seek to current store position if we are at 0 but store says otherwise (Sync Fix)
            if (currentPos > 0 && audioKernel.playback.getPosition() < 1) {
                console.log(`🔧 [PlayerContext] Syncing Engine Time to Store: ${currentPos}`);
                audioKernel.intentSeek(currentPos);
            }

            audioKernel.intentResume().catch(e => {
                console.error('❌ [PlayerContext] Resume failed:', e);
            });
        }
    }, []);

    // Sync volume — M1 FIX: Use kernel playback directly
    useEffect(() => {
        if (audioKernel.isReady()) audioKernel.playback.setVolume(playbackState.volume);

        // Debounce Sync
        const timer = setTimeout(() => {
            RealtimeManager.emit('PLAYER_UPDATE', {
                type: 'volume',
                value: playbackState.volume,
                timestamp: Date.now()
            });
        }, 1000);

        return () => clearTimeout(timer);
    }, [playbackState.volume]);

    // Track active/inactive handling
    const isFirstLoadRef = useRef(true);
    const lastLoadedTrackIdRef = useRef<string | null>(null);

    // Debug: Check Storage
    useEffect(() => {
        try {
            const stored = localStorage.getItem('tichphong-playback');
            console.log('📦 [PlayerContext] Storage Snap:', stored ? JSON.parse(stored) : 'Empty');
        } catch (e) {
            console.error('Storage read error', e);
        }
    }, []);

    // Load track with crossfade and handle History/Quest updates
    useEffect(() => {
        const track = playbackState.currentTrack;
        if (!track) return;

        const source = track.audio || track.url;
        if (!source) {
            console.error('No audio source for track:', track);
            return;
        }

        // Fix: Prevent re-loading the same track (infinite loop / interruption)
        if (track.id === lastLoadedTrackIdRef.current) {
            // If already loaded, just ensure we are playing if intended?
            // Actually, if we are here, it might be a spurious update.
            // If user clicked "Play" on same track, isPlaying would update, not necessarily currentTrack.
            return;
        }

        // Update ref immediately to prevent race conditions
        lastLoadedTrackIdRef.current = track.id;

        // Crossfade & Load via INTENT
        const performLoad = async () => {
            let autoPlay = true;
            let restorePosition = 0;
            let finalSrc = source;

            // --- RESTORATION LOGIC ---
            if (isFirstLoadRef.current) {
                console.log('🔄 [PlayerContext] Initial Load Detected (Restoration Mode)');
                isFirstLoadRef.current = false;
                autoPlay = false;

                // Sync UI state to Paused immediately
                usePlaybackStore.getState().pause();

                // Retrieve saved position
                const savedPosition = playbackState.playbackPosition;
                if (savedPosition > 5) {
                    restorePosition = savedPosition;
                }

                // Smart Caching for Restoration: Try to get local blob
                try {
                    const cachedBlob = await getSongBlob(track);
                    if (cachedBlob) {
                        console.log('📦 [PlayerContext] Restoring from Local Cache:', track.title);
                        finalSrc = cachedBlob;
                    } else {
                        console.log('🌍 [PlayerContext] Not in cache, fetching normally');
                        cacheSong(track).catch(e => console.warn('Cache background failed', e));
                    }
                } catch (e) {
                    console.warn('Cache check failed', e);
                }
            } else {
                // Normal playback: Ensure we cache if we used network (Fire and Forget)
                cacheSong(track).catch(() => { });
            }

            try {
                // Execute Intent
                await audioKernel.intentPlay({
                    id: track.id,
                    src: finalSrc,
                    metadata: {
                        title: track.title || 'Unknown',
                        artist: track.artist || 'Unknown Artist',
                        artwork: track.artwork || (track as any).thumbnail,
                        duration: track.duration
                    }
                }, { autoPlay });

                // If restoring, seek to position AFTER load
                if (restorePosition > 0) {
                    console.log(`📍 [PlayerContext] Restoring position: ${restorePosition}s`);
                    // We must wait for 'driver:ready' or similar inside kernel, but intentPlay awaits load()
                    // So we are safe to seek now.
                    audioKernel.intentSeek(restorePosition);
                }
            } catch (e) {
                console.error('[PlayerContext] Load failed:', e);
            }
        };

        performLoad();

        // --- CENTRALIZED UPDATE LOGIC ---
        // This runs whenever the track changes (Manual Click, Next Button, or Auto-Next)

        // We check against the CURRENT history state before adding
        const isNewSong = !libraryState.history.some(h => h.id === track.id);

        // Debug log (optional, keeping for now but less verbose)
        // console.log(`🎵 Track Changed: ${track.title || track.name} | New: ${isNewSong}`);

        if (isNewSong) {
            updateQuestProgress('listen_3', 1);
        }

        // Track listen_10 quest (always counts, not just new songs)
        updateQuestProgress('listen_10', 1);

        // 2. Check Night Owl
        checkNightOwl();

        // 3. Add to History
        libraryState.addToHistory(track);

        // Phase 13: Track song view
        TrackingService.trackView(track.id, 'song');

        // 4. Grant XP when song STARTS playing (+10 base + artifact bonus)
        const inventory = libraryState.inventory || [];
        let xpBonus = 0;
        if (inventory.find((i: any) => i.itemId === 'sword_wooden')) xpBonus += 1;
        const totalXp = 10 + xpBonus;
        libraryState.incrementTuVi(totalXp);
        console.log(`✨ Song started: +${totalXp} XP`);

        // 5. Check for Loot Drop with Pet Buff
        const activePet = libraryState.ownedPets.find((p: any) => p.isActive);
        let luckModifier = 0; // percentage

        // Add Luck from Pills (if implemented, but simple for now)
        // Add Luck from Pet
        if (activePet) {
            const petDef = PETS.find(p => p.id === activePet.petId);
            if (petDef && petDef.buff.id === 'drop_boost') {
                luckModifier += calculatePetBuffValue(petDef, activePet);
            } else if (petDef && petDef.buff.type === 'all_percent') {
                luckModifier += calculatePetBuffValue(petDef, activePet);
            }
        }

        const playerLevel = getCultivationInfo(libraryState.tuVi).level;
        const drop = checkLootDrop(luckModifier, playerLevel);
        if (drop) {
            console.log('🎁 Loot Dropped:', drop.name);
            libraryState.addLoot({
                itemId: drop.itemId,
                name: drop.name,
                type: drop.type,
                rarity: drop.rarity,
                description: drop.description
            });

            // Simple toast via global event or just console for now since we can't easily access toast here without prop drilling or context
            // Ideally useGlobalUI() should be usable if this component is wrapped, but PlayerProvider is usually high up.
            // We'll rely on the User seeing it in inventory later or add a notification system call.
            // Actually, we can dispatch a custom event.
            window.dispatchEvent(new CustomEvent('loot-obtained', { detail: { item: drop } }));
        }

        // 6. Queue for batch sync to D1 (history + XP)
        if (track.id) {
            import('../utils/historySync').then(({ queueHistoryEntry }) => {
                queueHistoryEntry(track.id, totalXp);
            }).catch(e => console.error('History queue error:', e));
        }

    }, [playbackState.currentTrack?.id]);

    // Smart Preloading: Preload the NEXT track in the queue — M2 FIX: Use kernel
    useEffect(() => {
        // PURE getter - NO side effects
        const nextIdx = queueState.getNextIndex();
        if (nextIdx !== -1 && queueState.queue[nextIdx]) {
            const nextTrack = queueState.queue[nextIdx];
            const nextSource = nextTrack.audio || nextTrack.url;

            if (nextSource && audioKernel.isReady()) {
                console.log('🚀 Preloading next track:', nextTrack.title || nextTrack.name);
                audioKernel.playback.preload(nextSource);
            }
        }
    }, [queueState.queue, queueState.currentIndex, queueState.shuffleEnabled, queueState.repeatMode]);

    // Actions
    // C3 FIX: handleNext uses kernel intents, no audioController bypass
    const handleNext = useCallback(() => {
        const nextIdx = queueState.advanceQueue();
        // CRITICAL: Read fresh state AFTER advanceQueue to avoid stale closure
        const freshQueue = useQueueStore.getState().queue;
        if (nextIdx !== -1 && freshQueue[nextIdx]) {
            const nextTrack = freshQueue[nextIdx];

            // If repeating the same song, seek to 0 + resume via kernel intents
            if (playbackState.currentTrack?.id === nextTrack.id) {
                audioKernel.intentSeek(0);
                audioKernel.intentResume().catch(console.error);
                // C5 FIX: No optimistic playbackState.play() — let kernel event propagate
                return;
            }

            playbackState.setTrack(nextTrack);
            // C5 FIX: kernel PLAYBACK_STARTED event will set isPlaying via Zustand handler
        } else {
            audioKernel.intentPause();
            // C5 FIX: kernel PLAYBACK_PAUSED event will set isPaused via Zustand handler
        }
    }, [playbackState.currentTrack?.id]); // Minimal deps since we use getState()

    // C3 FIX: handlePrev uses kernel intents
    const handlePrev = useCallback(() => {
        if (currentTime.value > 3) {
            audioKernel.intentSeek(0);
            return;
        }

        const prevIdx = queueState.retreatQueue();
        // CRITICAL: Read fresh state AFTER retreatQueue
        const freshQueue = useQueueStore.getState().queue;
        if (prevIdx !== -1 && freshQueue[prevIdx]) {
            playbackState.setTrack(freshQueue[prevIdx]);
            // C5 FIX: kernel PLAYBACK_STARTED event will set isPlaying via Zustand handler
        }
    }, []); // No deps needed since we use getState()

    // C3 FIX: seek uses kernel intent
    const seek = useCallback((time) => {
        audioKernel.intentSeek(time);

        // Sync Seek
        RealtimeManager.emit('PLAYER_UPDATE', {
            type: 'seek',
            value: time,
            timestamp: Date.now()
        });
    }, []);

    const playTrack = useCallback((track: Song, newQueue?: Song[]) => {
        console.log('👆 Playing:', track.title || track.name);

        // CRITICAL FIX: If track is partial (from AI API), resolve to full song object
        // AI API returns only {id, title, artist, cover} without audio/url
        let resolvedTrack = track;
        if (!track.audio && !track.url && track.id && librarySongs) {
            const fullSong = librarySongs[track.id];
            if (fullSong) {
                resolvedTrack = { ...fullSong, id: track.id };
                console.log('🔗 Resolved partial track to full song with audio');
            } else {
                console.warn('⚠️ Could not resolve partial track:', track.id);
            }
        }

        if (newQueue) {
            // Also resolve songs in the new queue
            const resolvedQueue = newQueue.map(t => {
                if (!t.audio && !t.url && t.id && librarySongs) {
                    const full = librarySongs[t.id];
                    return full ? { ...full, id: t.id } : t;
                }
                return t;
            });

            // Filter out tracks that still have no audio source to prevent playback hang
            const validQueue = resolvedQueue.filter(t => t.audio || t.url);

            // When new queue is provided, set it and find track index
            const idx = validQueue.findIndex(t => t?.id === resolvedTrack.id);
            queueState.setQueue(validQueue, idx !== -1 ? idx : 0);
        } else {
            // CRITICAL: Read fresh queue state to avoid stale closure
            const currentQueue = useQueueStore.getState().queue;
            const idx = currentQueue.findIndex(t => t?.id === resolvedTrack.id);
            if (idx === -1) {
                // Track not in queue, add it and set index to the new position
                queueState.addToQueue(resolvedTrack);
                // Read fresh length AFTER adding to get correct index
                const freshLength = useQueueStore.getState().queue.length;
                queueState.setCurrentIndex(freshLength - 1);
            } else {
                queueState.setCurrentIndex(idx);
            }
        }

        playbackState.setTrack(resolvedTrack);
        // C5 FIX: kernel PLAYBACK_STARTED event will update Zustand isPlaying

    }, [currentUser, librarySongs]); // Added librarySongs to deps

    const playQueueItem = useCallback((index) => {
        // CRITICAL: Read fresh state to ensure consistency
        const freshQueue = useQueueStore.getState().queue;
        const freshIndex = useQueueStore.getState().currentIndex;

        if (index >= 0 && index < freshQueue.length) {
            if (index === freshIndex) {
                kernelTogglePlay(); // Use kernel intent instead of store toggle
            } else {
                queueState.setCurrentIndex(index);
                playbackState.setTrack(freshQueue[index]);
                // C5 FIX: kernel event will update isPlaying state
            }
        }
    }, [kernelTogglePlay]); // Depend on kernelTogglePlay

    const toggleFavorite = useCallback((track) => {
        const added = libraryState.toggleFavorite(track);
        toast?.(added ? 'Đã thêm vào yêu thích' : 'Đã xóa khỏi yêu thích', added ? 'success' : 'info');

        // Sync Like Event
        RealtimeManager.emit('INTERACTION_LIKE', {
            type: 'song',
            id: track.id,
            action: added ? 'like' : 'unlike',
            timestamp: Date.now()
        });

        // Grant +5 XP when adding to favorites (not when removing)
        if (added) {
            libraryState.incrementTuVi(5);
            console.log('❤️ Favorited: +5 XP');

            // Queue XP for batch sync
            import('../utils/historySync').then(({ queueXP }) => {
                queueXP(5);
            }).catch(console.error);

            // Track favorite_3 quest
            updateQuestProgress('favorite_3', 1);
        }

        if (currentUser?.uid) {
            if (added) {
                fetch(`${API_URL}/api/favorites/${currentUser.uid}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ songId: track.id })
                }).catch(console.error);
            } else {
                fetch(`${API_URL}/api/favorites/${currentUser.uid}/${track.id}`, {
                    method: 'DELETE'
                }).catch(console.error);
            }
        }
    }, [currentUser, toast]);

    const isFavorite = useCallback((songId) => {
        return libraryState.isFavorite(songId);
    }, []);

    // Keyboard shortcuts
    useKeyboardShortcuts({
        isPlaying: playbackState.isPlaying,
        togglePlay: kernelTogglePlay,
        handleNext,
        handlePrev,
        setVolume: playbackState.setVolume,
        volume: playbackState.volume,
        seek,
        currentTime: currentTime.value,
    });

    // C1 FIX: Removed useMusicControls — MediaSessionAdapter is the sole handler
    // Media key/Bluetooth/lockscreen actions go through:
    // MediaSessionAdapter → kernel intents → PlaybackManager → events → Zustand



    // Sanitize queue for rendering to prevent react-window crashes
    const safeQueue = useMemo(() => {
        const q = queueState.queue;
        if (!Array.isArray(q)) return [];
        return q.filter(item => item && typeof item === 'object');
    }, [queueState.queue]);

    // --- PET SYSTEM ACTIONS ---






    // Context value (backward compatible)
    const value = useMemo(() => ({
        // Playback
        currentTrack: playbackState.currentTrack,
        isPlaying: playbackState.isPlaying,
        volume: playbackState.volume,
        crossfadeEnabled: playbackState.crossfadeEnabled,
        currentTime: playbackState.playbackPosition, // Reactive from Zustand (Synced via Events)
        duration: playbackState.duration,
        bufferedTime: playbackState.bufferedTime,

        // Queue
        // Queue (Sanitized synchronously for render safety)
        queue: safeQueue,
        currentIndex: queueState.currentIndex,
        isShuffle: queueState.shuffleEnabled,
        isRepeat: queueState.repeatMode !== 'off' ? queueState.repeatMode : false,
        showQueue: queueState.showQueue,
        showLyrics: queueState.showLyrics,

        // Library
        favorites: libraryState.favorites,
        history: libraryState.history,
        tuVi: libraryState.tuVi,
        inventory: libraryState.inventory,
        achievements: libraryState.achievements || [],
        activeTitle: libraryState.activeTitle || 'none',
        activeBadge: libraryState.activeBadge || 'none',

        // Pets
        ownedPets: libraryState.ownedPets || [],
        addPet: libraryState.addPet,
        updatePet: libraryState.updatePet,
        evolvePet: libraryState.evolvePet,

        // Derived
        songs,
        playlists,
        userPlaylists,
        allSongs: librarySongs,
        loading: musicLoading || !librarySongs,
        currentUser,
        quests,

        // Playback actions
        togglePlay: kernelTogglePlay,
        setVolume: playbackState.setVolume,
        setCrossfadeEnabled: playbackState.setCrossfade,
        seek,

        // Queue actions
        handleNext,
        handlePrev,
        toggleShuffle: queueState.toggleShuffle,
        toggleRepeat: queueState.toggleRepeat,
        playQueueItem,
        addToQueue: queueState.addToQueue,
        playNext: queueState.playNext,
        removeFromQueue: queueState.removeFromQueue,
        clearQueue: queueState.clearQueue,
        setShowQueue: queueState.setShowQueue,
        setShowLyrics: queueState.setShowLyrics,

        // Inventory Actions
        addLoot: (item, amount) => {
            libraryState.addLoot(item, amount);
            RealtimeManager.emit('PLAYER_UPDATE', {
                type: 'loot_add',
                item,
                amount: amount || 1,
                timestamp: Date.now()
            });
        },
        removeLoot: (itemId, amount) => {
            libraryState.removeLoot(itemId, amount);
            RealtimeManager.emit('PLAYER_UPDATE', {
                type: 'loot_remove',
                itemId,
                amount: amount || 1,
                timestamp: Date.now()
            });
        },
        incrementTuVi: (amount) => {
            libraryState.incrementTuVi(amount);
            RealtimeManager.emit('PLAYER_UPDATE', {
                type: 'cultivation',
                amount,
                total: libraryState.tuVi + amount, // Optimistic logic
                timestamp: Date.now()
            });
        },
        claimAchievement: libraryState.claimAchievement,
        setActiveTitle: libraryState.setActiveTitle,
        setActiveBadge: libraryState.setActiveBadge,

        // Cultivation Method
        cultivationMethod: libraryState.cultivationMethod,
        setCultivationMethod: libraryState.setCultivationMethod,
        addTuVi: (amount) => { // Wrapper for incrementTuVi alias
            libraryState.incrementTuVi(amount);
            RealtimeManager.emit('PLAYER_UPDATE', {
                type: 'cultivation',
                amount,
                total: libraryState.tuVi + amount,
                timestamp: Date.now()
            });
        },
        profile: { cultivation_level: getCultivationInfo(libraryState.tuVi).level },

        // Library actions
        toggleFavorite,
        isFavorite,
        playTrack,
        updateQuestProgress,
        claimQuestReward,

        // Playlist management (delegate to auth)
        createUserPlaylist: authCreatePlaylist,
        addToUserPlaylist: authAddToPlaylist,
        deleteUserPlaylist: authDeletePlaylist,
        renameUserPlaylist: authRenamePlaylist,
        updateUserPlaylist: authUpdateUserPlaylist,
        clonePlaylist: authClonePlaylist,

        // Data management
        exportData: () => JSON.stringify({
            favorites: libraryState.favorites,
            history: libraryState.history,
            tuVi: libraryState.tuVi
        }),
        importData: () => false,
        clearData: (type) => {
            if (type === 'favorites') libraryState.favorites = [];
            if (type === 'history') libraryState.clearHistory();
            if (type === 'all') libraryState.clearAll();
        },
        getStorageUsage: () => 0,

        // Sleep timer (simplified)
        sleepTimer: null,
        startSleepTimer: () => toast?.('Sleep timer not yet migrated', 'info'),
        cancelSleepTimer: () => { },

        // Generated playlists
        generatedPlaylists,
        suggestedPlaylists, // AI Artist Mixes
        moodPlaylists: generatedPlaylists,
        createGeneratedPlaylist,

        // DSP Toggle
        dspEnabled: dspEnabledState,
        toggleDSP: () => {
            audioKernel.intentEnableDSP(!audioKernel.isDSPEnabled());
        },
        audioMode
    }), [
        // State dependencies
        playbackState.currentTrack,
        playbackState.isPlaying,
        playbackState.volume,
        playbackState.crossfadeEnabled,
        playbackState.playbackPosition, // Trigger re-render on time update
        playbackState.duration, // Trigger re-render on duration update

        queueState.queue,
        queueState.currentIndex,
        queueState.shuffleEnabled,
        queueState.repeatMode,
        queueState.showQueue,
        queueState.showLyrics,

        libraryState.favorites,
        libraryState.history,
        libraryState.tuVi,
        libraryState.activeTitle,
        libraryState.activeBadge,

        // Derived/External
        songs,
        playlists,
        userPlaylists,
        librarySongs,
        musicLoading,
        currentUser,
        quests,
        generatedPlaylists,
        suggestedPlaylists,

        // Actions (stable refs or memoized)
        handleNext,
        handlePrev,
        seek,
        playQueueItem,
        toggleFavorite,
        isFavorite,
        playTrack,
        updateQuestProgress,
        claimQuestReward,
        libraryState.setActiveTitle,
        libraryState.setActiveBadge,

        // Auth actions (stable)
        authCreatePlaylist,
        authAddToPlaylist,
        authDeletePlaylist,
        authRenamePlaylist
    ]);

    return (
        <PlayerContext.Provider value={value} >
            {children}
        </PlayerContext.Provider >
    );
};
