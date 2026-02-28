/**
 * Audio Kernel — Event Definitions
 * Constitution §5: Event System Standard
 */

export const AudioEvents = {
    PLAY: 'tp:audio:play',
    PAUSE: 'tp:audio:pause',
    STOP: 'tp:audio:stop',
    SEEK: 'tp:audio:seek',
    VOLUME_CHANGE: 'tp:audio:volume_change',
    TRACK_ENDED: 'tp:audio:track_ended',
    QUEUE_UPDATE: 'tp:audio:queue_update',
    ERROR: 'tp:audio:error',
} as const;

export type AudioEventType = typeof AudioEvents[keyof typeof AudioEvents];
