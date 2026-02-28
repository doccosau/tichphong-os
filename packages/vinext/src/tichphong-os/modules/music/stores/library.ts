/**
 * TichPhong Core 5.1.1 - Library Store
 * 
 * Manages: favorites, history, tuVi, userPlaylists
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Track } from './playback';

export interface LootItem {
    id: string;
    itemId: string;
    name: string;
    type: 'material' | 'consumable' | 'collectible' | 'artifact' | 'pill';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    quantity: number;
    description?: string;
    obtainedAt: number;
}

interface LibraryState {
    // State
    userId: string | null; // Track which user this data belongs to
    favorites: Track[];
    history: (Track & { playedAt?: number })[];
    tuVi: number;
    inventory: LootItem[];
    facilityLevels: Record<string, number>; // Mapping facilityId -> level
    achievements: string[]; // Claimed achievement IDs
    activeTitle: string; // ID of the currently equipped title
    activeBadge: string; // ID of the currently equipped badge
    cultivationMethod: string | null; // ID of the current cultivation method

    // Actions
    addFavorite: (track: Track) => void;
    removeFavorite: (trackId: string) => void;
    toggleFavorite: (track: Track) => boolean;
    isFavorite: (trackId: string) => boolean;
    addToHistory: (track: Track) => void;
    clearHistory: () => void;
    incrementTuVi: (amount?: number) => void;
    setTuVi: (points: number) => void;
    setUserId: (userId: string) => void; // Set current user ID
    setActiveTitle: (titleId: string) => void;
    setActiveBadge: (badgeId: string) => void;
    setCultivationMethod: (methodId: string | null) => void;
    addTuVi: (amount: number) => void; // Alias for incrementTuVi with method bonus
    clearAll: () => void;

    // Inventory Actions
    addLoot: (item: Omit<LootItem, 'id' | 'obtainedAt' | 'quantity'>, amount?: number) => void;
    removeLoot: (itemId: string, amount?: number) => void;

    // Facility Actions
    updateFacilityLevel: (facilityId: string, level: number) => void;
    hydrateFacilities: (levels: Record<string, number>) => void;

    // Pet Actions
    ownedPets: OwnedPet[];
    addPet: (petId: PetId) => void;
    updatePet: (petId: PetId, updates: Partial<OwnedPet>) => void;
    evolvePet: (petId: PetId) => void;

    claimAchievement: (achievementId: string) => void;
    hydrateSync: (serverInventory: any[], serverAchievements: any[]) => void;
    hydrateHistory: (serverHistory: { songId: string, playedAt: number }[], librarySongs: Record<string, any>) => void;
    getSyncPayload: () => { inventory: any[], achievements: any[] };
    hydratePets: (serverPetData: OwnedPet[]) => void;
}

import { getLootDef } from '../../../legacy/utils/lootUtils';
import { type PetId, type OwnedPet, PETS, calculatePetBuffValue } from '../../../legacy/utils/pets';

import { auth } from '../../../legacy/firebase';
// Mock syncManager cho Example Module
const syncManager = {
    pushRamState: (state: any) => { },
    emit: (event: string, payload: any, options?: any) => { }
};

// Helper to sync pet data to D1
const syncPetData = async (petData: OwnedPet[]) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const token = await user.getIdToken();
        await fetch(`/api/pets/${user.uid}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ petData })
        });
    } catch (err) {
        console.error('[PetSync] Failed:', err);
    }
};

export const useLibraryStore = create<LibraryState>()(
    persist(
        (set, get) => ({
            // Initial state
            userId: null,
            favorites: [],
            history: [],
            tuVi: 0,
            inventory: [],
            facilityLevels: {}, // Default empty
            achievements: [],
            activeTitle: 'none',
            activeBadge: 'none',
            cultivationMethod: null,

            // Pet State
            ownedPets: [],

            // Actions
            addFavorite: (track) => set((state) => {
                const newFavorites = [track, ...state.favorites.filter((t) => t.id !== track.id)];

                // OS Sync
                syncManager.pushRamState({ favorites: newFavorites });
                syncManager.emit('FAVORITE_ADD', { songId: track.id, track }, { urgent: true, authoritative: true });

                return { favorites: newFavorites };
            }),

            removeFavorite: (trackId) => set((state) => {
                const newFavorites = state.favorites.filter((t) => t.id !== trackId);

                // OS Sync
                syncManager.pushRamState({ favorites: newFavorites });
                syncManager.emit('FAVORITE_REMOVE', { songId: trackId }, { urgent: true, authoritative: true });

                return { favorites: newFavorites };
            }),

            toggleFavorite: (track) => {
                const { favorites, addFavorite, removeFavorite } = get();
                const isFav = favorites.some((t) => t.id === track.id);

                if (isFav) {
                    removeFavorite(track.id);
                    return false;
                } else {
                    addFavorite(track);
                    return true;
                }
            },

            isFavorite: (trackId) => {
                return get().favorites.some((t) => t.id === trackId);
            },

            addToHistory: (track) => set((state) => {
                const newHistory = [{ ...track, playedAt: Date.now() }, ...state.history.filter((t) => t.id !== track.id)].slice(0, 100);

                // OS Sync (Background implicit sync via periodic flush, history is less critical than favorites)
                // Actually History is critical for continuity.
                syncManager.pushRamState({ history: newHistory });
                // We emit SONG_PLAY logic elsewhere (Player Context), but here we just store local history.
                // The 'SONG_FINISH' or 'SONG_PLAY_START' events handle the D1 log.

                return { history: newHistory };
            }),

            clearHistory: () => set((state) => {
                syncManager.pushRamState({ history: [] });
                return { history: [] };
            }),

            incrementTuVi: (amount = 1) => set((state) => {
                // Check for active pet buff
                const activePet = state.ownedPets.find(p => p.isActive);
                if (activePet) {
                    const petDef = PETS.find((p: any) => p.id === activePet.petId);

                    if (petDef && petDef.buff.id === 'cultivation_speed') {
                        const multiplier = 1 + (calculatePetBuffValue(petDef, activePet) / 100);
                        amount = Math.ceil(amount * multiplier);
                    }
                }

                const newTuVi = state.tuVi + amount;

                // OS ARCHITECTURE: Write to RAM (Supabase)
                syncManager.pushRamState({ tuVi: newTuVi });

                return { tuVi: newTuVi };
            }),

            setTuVi: (tuVi) => {
                set({ tuVi });
                syncManager.pushRamState({ tuVi });
            },
            setUserId: (userId) => set({ userId }),

            setActiveTitle: (titleId) => set({ activeTitle: titleId }),
            setActiveBadge: (badgeId) => set({ activeBadge: badgeId }),
            setCultivationMethod: (methodId) => set({ cultivationMethod: methodId }),

            // Add Tu Vi with method bonus
            addTuVi: (amount) => {
                const state = get();
                // Import dynamically to avoid circular deps
                import('../../../legacy/utils/cultivation').then(({ calculateXPWithMethod }) => {
                    const bonusAmount = calculateXPWithMethod(amount, state.cultivationMethod || undefined);
                    state.incrementTuVi(bonusAmount);
                });
            },

            addLoot: (item, amount = 1) => {
                set((state) => {
                    let newInventory;
                    const existing = state.inventory.find(i => i.itemId === item.itemId);

                    if (existing) {
                        newInventory = state.inventory.map(i =>
                            i.itemId === item.itemId
                                ? { ...i, quantity: i.quantity + amount }
                                : i
                        );
                    } else {
                        newInventory = [...state.inventory, {
                            ...item,
                            id: `loot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            obtainedAt: Date.now(),
                            quantity: amount
                        }];
                    }

                    // OS ARCHITECTURE: Sync RAM
                    syncManager.pushRamState({ inventory: newInventory });

                    return { inventory: newInventory };
                });
            },

            removeLoot: (itemId, amount = 1) => {
                set((state) => {
                    const newInventory = state.inventory
                        .map(i => i.itemId === itemId ? { ...i, quantity: i.quantity - amount } : i)
                        .filter(i => i.quantity > 0);

                    // OS ARCHITECTURE: Sync RAM
                    syncManager.pushRamState({ inventory: newInventory });

                    return { inventory: newInventory };
                });
            },

            addPet: (petId) => set((state) => {
                const existing = state.ownedPets.find(p => p.petId === petId);
                if (existing) return {}; // Already owned

                const newPets = [...state.ownedPets, {
                    petId,
                    level: 1,
                    experience: 0,
                    bond: 0,
                    obtainedAt: Date.now(),
                    isActive: state.ownedPets.length === 0 // Auto-equip if first pet
                }];

                // Sync to server (fire and forget)
                syncPetData(newPets);

                return { ownedPets: newPets };
            }),

            updatePet: (petId, updates) => set((state) => {
                const newPets = state.ownedPets.map(pet =>
                    pet.petId === petId ? { ...pet, ...updates } : pet
                );
                syncPetData(newPets);
                return { ownedPets: newPets };
            }),

            evolvePet: (petId) => set((state) => {
                const pet = state.ownedPets.find(p => p.petId === petId);
                if (!pet) return {};

                const petDef = PETS.find((p: any) => p.id === petId);
                if (!petDef || !petDef.evolvesTo) return {};

                const newPets = state.ownedPets.map(p => {
                    if (p.petId === petId) {
                        return {
                            ...p,
                            petId: petDef.evolvesTo!,
                            level: 1, // Reset level after evolution
                            experience: 0,
                        };
                    }
                    return p;
                });

                syncPetData(newPets);
                return { ownedPets: newPets };
            }),

            hydratePets: (serverPetData) => set(() => ({
                ownedPets: serverPetData || []
            })),

            claimAchievement: (achievementId) => set((state) => {
                if (state.achievements.includes(achievementId)) return {};

                // OS ARCHITECTURE: Log Event
                syncManager.emit('ACHIEVEMENT_CLAIM', {
                    achievementId,
                    claimedAt: Date.now()
                }, { urgent: true, authoritative: true });

                return { achievements: [...state.achievements, achievementId] };
            }),

            hydrateSync: (serverInventory, serverAchievements) => set(() => {
                // SERVER IS SOURCE OF TRUTH - REPLACE local with server data

                // Convert server inventory to LootItem format - FILTER OUT quantity 0
                const inventory: LootItem[] = serverInventory
                    .filter((si: any) => (si.quantity || 0) > 0) // Exclude items with 0 quantity
                    .map((si: any) => {
                        const def = getLootDef(si.itemId);
                        if (!def) return null;
                        return {
                            id: `loot_${si.itemId}`,
                            itemId: si.itemId,
                            name: def.name,
                            type: def.type,
                            rarity: def.rarity,
                            quantity: si.quantity,
                            description: def.description,
                            obtainedAt: si.obtainedAt || Date.now()
                        } as LootItem;
                    }).filter(Boolean) as LootItem[];

                // Achievements: REPLACE with server data
                const achievements = serverAchievements.map((a: any) => a.achievementId);

                return {
                    inventory,
                    achievements,
                    activeTitle: (serverInventory as any).activeTitle || 'none',
                    activeBadge: (serverInventory as any).activeBadge || 'none'
                };
            }),

            hydrateHistory: (serverHistory, librarySongs) => set((state) => {
                if (!serverHistory || serverHistory.length === 0) return {};

                // Resolve song IDs to full song objects
                const resolvedHistory = serverHistory
                    .map(h => {
                        const song = librarySongs[h.songId];
                        if (!song) return null;
                        return {
                            ...song,
                            id: h.songId,
                            playedAt: h.playedAt
                        };
                    })
                    .filter(Boolean);

                // Merge with existing local history, avoiding duplicates
                const existingIds = new Set(state.history.map(h => h.id));
                const newItems = resolvedHistory.filter(h => !existingIds.has(h.id));

                // Combine and sort by playedAt descending
                const merged = [...state.history, ...newItems]
                    .sort((a, b) => (b.playedAt || 0) - (a.playedAt || 0))
                    .slice(0, 100);

                console.log(`📚 Hydrated history: ${newItems.length} new items from D1`);
                return { history: merged };
            }),

            getSyncPayload: () => {
                const { inventory, achievements } = get();
                return {
                    inventory: inventory.map(i => ({
                        itemId: i.itemId,
                        quantity: i.quantity,
                        obtainedAt: i.obtainedAt
                    })),
                    achievements: achievements.map(id => ({
                        achievementId: id,
                        unlockedAt: Date.now(), // Approximation if missing
                        claimedAt: Date.now()
                    })),
                    activeTitle: get().activeTitle,
                    activeBadge: get().activeBadge
                };
            },

            clearAll: () => set({ favorites: [], history: [], tuVi: 0, inventory: [], achievements: [], activeTitle: 'none', activeBadge: 'none', cultivationMethod: null }),

            // Facility Actions Implementation
            updateFacilityLevel: (facilityId, level) => set((state) => {
                const newLevels = { ...state.facilityLevels, [facilityId]: level };
                // OS Sync
                syncManager.pushRamState({ facilityLevels: newLevels });
                return { facilityLevels: newLevels };
            }),

            hydrateFacilities: (levels) => set({ facilityLevels: levels || {} }),
        }),
        {
            name: 'tichphong-library',
            partialize: (state) => ({
                favorites: state.favorites.slice(0, 500),
                history: state.history.slice(0, 100),
                tuVi: state.tuVi,
                inventory: state.inventory,
                achievements: state.achievements, // Persist claimed achievements
                activeTitle: state.activeTitle,
                activeBadge: state.activeBadge,
                cultivationMethod: state.cultivationMethod,
                ownedPets: state.ownedPets,
                facilityLevels: state.facilityLevels,
            }),
            // Migration to add playedAt to old history items
            migrate: (persistedState: any, version: number) => {
                if (persistedState.history) {
                    const now = Date.now();
                    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

                    persistedState.history = persistedState.history.map((item: any, index: number) => {
                        if (!item.playedAt) {
                            // Distribute old items evenly across the last 7 days
                            const totalItems = persistedState.history.filter((h: any) => !h.playedAt).length;
                            const timeSlot = (now - sevenDaysAgo) / Math.max(totalItems, 1);
                            return {
                                ...item,
                                playedAt: sevenDaysAgo + (index * timeSlot)
                            };
                        }
                        return item;
                    });
                }
                return persistedState;
            },
            version: 1, // Bump version to trigger migration
        }
    )
);

// Selector hooks
export const useFavorites = () => useLibraryStore((s) => s.favorites);
export const useHistory = () => useLibraryStore((s) => s.history);
export const useTuVi = () => useLibraryStore((s) => s.tuVi);

export const useInventory = () => useLibraryStore((s) => s.inventory);
export const useAchievements = () => useLibraryStore((s) => s.achievements);
export const useActiveTitle = () => useLibraryStore((s) => s.activeTitle);
export const useActiveBadge = () => useLibraryStore((s) => s.activeBadge);
export const useOwnedPets = () => useLibraryStore((s) => s.ownedPets);
export const useFacilityLevels = () => useLibraryStore((s) => s.facilityLevels);

// Actions hook
export const useLibraryActions = () => useLibraryStore((s) => ({
    addFavorite: s.addFavorite,
    removeFavorite: s.removeFavorite,
    toggleFavorite: s.toggleFavorite,
    isFavorite: s.isFavorite,
    addToHistory: s.addToHistory,
    clearHistory: s.clearHistory,
    incrementTuVi: s.incrementTuVi,
    setTuVi: s.setTuVi,
    clearAll: s.clearAll,

    // Inventory
    addLoot: s.addLoot,
    removeLoot: s.removeLoot,
    claimAchievement: s.claimAchievement,
    setActiveTitle: s.setActiveTitle,
    setActiveBadge: s.setActiveBadge,

    // Pets
    addPet: s.addPet,
    updatePet: s.updatePet,
    evolvePet: s.evolvePet,

    // Facilities
    updateFacilityLevel: s.updateFacilityLevel,
}));
