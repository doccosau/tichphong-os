/**
 * TichPhong Core 5.1.1 - MusicContext Context
 */
import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useMusicDataQuery } from '../../react/queries/useMusicDataQuery';

const MusicContext = createContext();

export const useMusic = () => useContext(MusicContext);

export const MusicProvider = ({ children }) => {
    const { data, isLoading, isError } = useMusicDataQuery();

    const librarySongs = useMemo(() => {
        const raw = data?.songs || {};
        const processed: Record<string, any> = {};
        for (const [id, song] of Object.entries(raw as Record<string, any>)) {
            processed[id] = { ...song, id };
        }
        return processed;
    }, [data]);
    const systemPlaylists = useMemo(() => data?.playlists || [], [data]);

    // Helper Function 1: resolvePlaylist
    const resolvePlaylist = useCallback((songIds) => {
        if (!Array.isArray(songIds)) return [];
        return songIds
            .map(id => {
                const song = librarySongs[id];
                if (song) {
                    return { ...song, id }; // Ensure ID is included
                }
                return null;
            })
            .filter(song => song !== null); // Filter out missing songs
    }, [librarySongs]);

    // Helper Function 2: filterByArtist
    const filterByArtist = useCallback((artistName) => {
        if (!artistName) return [];
        return Object.entries(librarySongs)
            .filter(([_, song]) => song.artist === artistName)
            .map(([id, song]) => ({ ...song, id }));
    }, [librarySongs]);

    const songs = useMemo(() => {
        return Object.entries(librarySongs).map(([id, song]) => {
            // Ensure ID is present in the object, even if it wasn't in the raw data
            return { ...(song as any), id };
        });
    }, [librarySongs]);

    const value = useMemo(() => ({
        librarySongs,
        songs,
        systemPlaylists,
        loading: isLoading,
        resolvePlaylist,
        filterByArtist
    }), [librarySongs, songs, systemPlaylists, isLoading, resolvePlaylist, filterByArtist]);

    return (
        <MusicContext.Provider value={value}>
            {children}
        </MusicContext.Provider>
    );
};
