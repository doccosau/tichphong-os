/**
 * TichPhong Music Module - Manifest
 * 
 * Registers the music module with the CMS framework.
 */

import { lazy } from 'react';
import type { ModuleManifest } from '../..//core/types';
import { audioController } from './signals/audio';

// Lazy load admin pages
const MusicManager = lazy(() => import('@/pages/admin/MusicManager'));
const PlaylistManager = lazy(() => import('@/pages/admin/PlaylistManager'));
const ArtistManager = lazy(() => import('@/pages/admin/ArtistManager'));
const MoodManager = lazy(() => import('@/pages/admin/MoodManager'));
const GenreManager = lazy(() => import('@/pages/admin/GenreManager'));

/**
 * Music Module Manifest
 */
export const musicModuleManifest: ModuleManifest = {
    id: 'music',
    name: 'Music Player',
    version: '5.1.1',
    description: 'Full-featured music player with playlists, lyrics, and queue management',
    author: 'TichPhong Team',
    type: 'music',

    // Public routes (handled in main App.tsx for now)
    routes: [],

    // Admin pages
    adminPages: [
        {
            id: 'music-songs',
            name: 'Bài hát',
            icon: 'Music',
            path: '/admin/music',
            component: MusicManager,
            order: 10,
        },
        {
            id: 'music-playlists',
            name: 'Playlist',
            icon: 'ListMusic',
            path: '/admin/playlists',
            component: PlaylistManager,
            order: 11,
        },
        {
            id: 'music-artists',
            name: 'Nghệ sĩ',
            icon: 'Users',
            path: '/admin/artists',
            component: ArtistManager,
            order: 12,
        },
        {
            id: 'music-moods',
            name: 'Tâm trạng',
            icon: 'Smile',
            path: '/admin/moods',
            component: MoodManager,
            order: 13,
        },
        {
            id: 'music-genres',
            name: 'Thể loại',
            icon: 'Tag',
            path: '/admin/genres',
            component: GenreManager,
            order: 14,
        },
    ],

    // Lifecycle
    onEnable: () => {
        console.log('[Music Module] Enabled');

        // Register services with TPCore Service Registry
        import('../../').then(({ registerService, ServiceNames, emit, Events }) => {
            registerService(ServiceNames.AUDIO_CONTROLLER, audioController, 'music');
            emit(Events.MODULE_ENABLED, { moduleId: 'music' });
        });
    },
    onDisable: () => {
        console.log('[Music Module] Disabled - Stopping audio playback');

        // Stop audio playback
        audioController.stop();

        // Unregister services
        import('../../').then(({ services, emit, Events }) => {
            services.unregister('music.audioController');
            emit(Events.MODULE_DISABLED, { moduleId: 'music' });
        });
    },
};

export default musicModuleManifest;
