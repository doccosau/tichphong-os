/**
 * TichPhong Core 5.1.1 - EQ Presets
 * Vietnamese-friendly implementation with distinct audio profiles
 * Includes AI Auto-EQ mood tag mapping
 */

export const EQ_FREQUENCIES = [60, 250, 1000, 4000, 16000] as const;

export type EQPresetKey = 'flat' | 'guqin' | 'pipa' | 'erhu' | 'flute' | 'zen' | 'vocal' | 'nature' | 'bassBoost' | 'nightMode';

export interface EQPreset {
    name: string;
    nameZh: string;      // Chinese name (Primary label)
    nameVi: string;      // Vietnamese name (Secondary/Description)
    icon: string;        // Emoji icon
    gains: number[];     // Professionally tuned for instrument characteristics
    description: string; // Vietnamese description
}

// Safe preset object - always defined
export const EQ_PRESETS: Record<EQPresetKey, EQPreset> = {
    flat: {
        name: 'Flat',
        nameZh: '原声',
        nameVi: 'Nguyên Âm',
        icon: '🎵',
        gains: [0, 0, 0, 0, 0],
        description: 'Âm thanh gốc, không chỉnh sửa'
    },
    guqin: {
        name: 'Guqin',
        nameZh: '古琴',
        nameVi: 'Cổ Cầm',
        icon: '🪕',
        // Boost low-mids for body, slight highs for string slide definition
        gains: [6, 10, -3, 5, 3], // Boosted
        description: 'Âm trầm phong phú cho đàn cổ cầm'
    },
    pipa: {
        name: 'Pipa',
        nameZh: '琵琶',
        nameVi: 'Tỳ Bà',
        icon: '🎸',
        // Boost high-mids for pluck attack (1-4k), cut subs
        gains: [-3, 5, 8, 10, 5], // Boosted
        description: 'Âm trong sáng cho dây đàn tỳ bà'
    },
    erhu: {
        name: 'Erhu',
        nameZh: '二胡',
        nameVi: 'Nhị Hồ',
        icon: '🎻',
        // Focus on mids (1k), roll off highs to reduce scratchiness
        gains: [-5, 5, 10, 5, -3], // Boosted
        description: 'Âm trung ấm áp cho nhị hồ'
    },
    flute: {
        name: 'Flute',
        nameZh: '笛子',
        nameVi: 'Sáo Trúc',
        icon: '🎺',
        // Air and brightness focus
        gains: [-8, -2, 7, 12, 9], // Boosted
        description: 'Âm cao trong trẻo cho sáo trúc'
    },
    zen: {
        name: 'Zen',
        nameZh: '禅意',
        nameVi: 'Thiền Định',
        icon: '🧘',
        // Deep atmosphere, reduced distracting mids
        gains: [9, 5, -7, -3, 5], // Boosted
        description: 'Bass sâu, chế độ thiền định'
    },
    vocal: {
        name: 'Vocal',
        nameZh: '人声',
        nameVi: 'Giọng Hát',
        icon: '🎤',
        // Human voice presence range
        gains: [-2, 3, 8, 5, 3], // Boosted
        description: 'Tăng cường giọng hát'
    },
    nature: {
        name: 'Nature',
        nameZh: '自然',
        nameVi: 'Thiên Nhiên',
        icon: '🌿',
        // V-shape for dynamic range
        gains: [7, 0, -3, 5, 9], // Boosted
        description: 'Cho âm thanh thiên nhiên'
    },
    bassBoost: {
        name: 'Bass Boost',
        nameZh: '低音',
        nameVi: 'Tăng Bass',
        icon: '🔊',
        // Heavy bass emphasis for EDM/Dance
        gains: [14, 8, 0, 3, 5], // Significantly Boosted (was 10 -> 14)
        description: 'Bass mạnh cho nhạc sôi động'
    },
    nightMode: {
        name: 'Night Mode',
        nameZh: '夜间',
        nameVi: 'Đêm Khuya',
        icon: '🌙',
        // Reduced extremes for quiet late-night listening
        gains: [-6, 3, 5, 3, -8], // More aggressive cut
        description: 'Âm thanh êm dịu để nghe đêm khuya'
    }
};

/**
 * Mood Tag to EQ Preset Mapping for AI Auto-EQ
 * Maps song mood_tags to recommended EQ presets
 */
export const MOOD_TAG_MAPPING: Record<string, EQPresetKey> = {
    // Chinese Traditional / Cổ Phong
    'cổ phong': 'guqin',
    '古风': 'guqin',
    'guqin': 'guqin',
    'cổ cầm': 'guqin',
    'pipa': 'pipa',
    'tỳ bà': 'pipa',
    '琵琶': 'pipa',
    'erhu': 'erhu',
    'nhị': 'erhu',
    '二胡': 'erhu',
    'flute': 'flute',
    'sáo': 'flute',
    '笛子': 'flute',

    // Vocal / Ballad
    'ballad': 'vocal',
    'vocal': 'vocal',
    '抒情': 'vocal',
    'giọng hát': 'vocal',
    'tình ca': 'vocal',
    'sâu lắng': 'vocal',
    'nhớ nhung': 'vocal',
    '情歌': 'vocal',

    // Zen / Meditation
    'thiền': 'zen',
    'zen': 'zen',
    '禅意': 'zen',
    'meditation': 'zen',
    'thanh tĩnh': 'zen',
    'bình yên': 'zen',
    'healing': 'zen',

    // Nature
    'thiên nhiên': 'nature',
    'nature': 'nature',
    '自然': 'nature',
    'mưa': 'nature',
    'rain': 'nature',
    'acoustic': 'nature',

    // Bass / Dance / Energetic
    'sôi động': 'bassBoost',
    'dance': 'bassBoost',
    'edm': 'bassBoost',
    'electronic': 'bassBoost',
    'bass': 'bassBoost',
    'trap': 'bassBoost',
    'hip hop': 'bassBoost',
    'hiphop': 'bassBoost',

    // Night Mode
    'đêm khuya': 'nightMode',
    'late night': 'nightMode',
    'chill': 'nightMode',
    'lofi': 'nightMode',
    'lo-fi': 'nightMode',
    'sleep': 'nightMode',
    'ngủ': 'nightMode'
};

/**
 * Get recommended EQ preset based on song mood tags
 * @param moodTags Array of mood tags from song
 * @returns Recommended EQPresetKey or null if no match
 */
export function getRecommendedPreset(moodTags: string[]): EQPresetKey | null {
    if (!moodTags || moodTags.length === 0) return null;

    // Check each tag against mapping (case-insensitive)
    for (const tag of moodTags) {
        const normalizedTag = tag.toLowerCase().trim();
        if (MOOD_TAG_MAPPING[normalizedTag]) {
            return MOOD_TAG_MAPPING[normalizedTag];
        }
    }

    return null;
}

// Safe helper to get preset keys
export const getPresetKeys = (): EQPresetKey[] => {
    try {
        return Object.keys(EQ_PRESETS) as EQPresetKey[];
    } catch {
        return ['flat'];
    }
};

// Safe helper to get preset entries
export const getPresetEntries = (): [EQPresetKey, EQPreset][] => {
    try {
        return Object.entries(EQ_PRESETS) as [EQPresetKey, EQPreset][];
    } catch {
        return [['flat', EQ_PRESETS.flat]];
    }
};
