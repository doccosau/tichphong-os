/**
 * Community Module — Event Definitions
 * Constitution §5: Event System Standard
 */
export const CommunityEvents = {
    ROOM_CREATED: 'tp:community:room_created',
    ROOM_JOINED: 'tp:community:room_joined',
    ROOM_LEFT: 'tp:community:room_left',
    SEND_MESSAGE: 'tp:community:send_message',
    CHAT_RECEIVED: 'tp:community:chat_received',
    PRESENCE_UPDATE: 'tp:community:presence_update',
    GUILD_JOINED: 'tp:community:guild_joined',
    FRIEND_REQUEST: 'tp:community:friend_request',
    MATCH_FOUND: 'tp:community:match_found',
} as const;

export type CommunityEventType = typeof CommunityEvents[keyof typeof CommunityEvents];
