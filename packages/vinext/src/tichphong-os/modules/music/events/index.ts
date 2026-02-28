/**
 * Music Module — Event Definitions
 * Constitution §5: Event System Standard
 */

export const MusicEvents = {
    SONG_LOADED: 'tp:music:song_loaded',
    PLAYLIST_CREATED: 'tp:music:playlist_created',
    PLAYLIST_UPDATED: 'tp:music:playlist_updated',
    PLAYLIST_DELETED: 'tp:music:playlist_deleted',
    SEARCH_PERFORMED: 'tp:music:search_performed',
    SONG_LIKED: 'tp:music:song_liked',
    SONG_ADDED_TO_PLAYLIST: 'tp:music:song_added_to_playlist',
} as const;

export type MusicEventType = typeof MusicEvents[keyof typeof MusicEvents];
