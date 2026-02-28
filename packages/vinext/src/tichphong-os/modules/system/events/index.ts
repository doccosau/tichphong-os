/**
 * System Module — Event Definitions
 * Constitution §5: Event System Standard
 */
export const SystemEvents = {
    MODULE_ENABLED: 'tp:system:module_enabled',
    MODULE_DISABLED: 'tp:system:module_disabled',
    THEME_CHANGED: 'tp:system:theme_changed',
    FEATURE_FLAG_UPDATED: 'tp:system:feature_flag_updated',
    CONFIG_CHANGED: 'tp:system:config_changed',
} as const;

export type SystemEventType = typeof SystemEvents[keyof typeof SystemEvents];
