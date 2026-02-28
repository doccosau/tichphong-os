import { IThemePreset } from '../interfaces';
import { BASIC_PRESETS } from './basic';
import { ADVANCED_PRESETS } from './advanced';

// Combine all presets
const ALL_LIST = [...BASIC_PRESETS, ...ADVANCED_PRESETS];

// Map for quick lookup
export const PRESETS: Record<string, IThemePreset> = ALL_LIST.reduce((acc, preset) => {
    acc[preset.id] = preset;
    return acc;
}, {} as Record<string, IThemePreset>);

export const THEME_CATEGORIES = {
    BASIC: BASIC_PRESETS,
    ADVANCED: ADVANCED_PRESETS
};

export { BASIC_PRESETS, ADVANCED_PRESETS };
