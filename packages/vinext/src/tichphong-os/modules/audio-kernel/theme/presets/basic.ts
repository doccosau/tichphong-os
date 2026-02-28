import { IThemePreset } from '../interfaces';

// Standard Dynamics (Transparent)
const DYN_STANDARD = {
    threshold: -20,
    knee: 40,
    ratio: 1, // 1:1 = No compression
    attack: 0.01,
    release: 0.25,
    makeupGain: 0
};

// HD Audio Dynamics (Audiophile Glue)
const DYN_HD = {
    threshold: -24,
    knee: 30,
    ratio: 1.5, // Gentle
    attack: 0.003,
    release: 0.2,
    makeupGain: 0.5
};

// Night Mode Dynamics (Compressed)
const DYN_NIGHT = {
    threshold: -30,
    knee: 20,
    ratio: 4,
    attack: 0.002,
    release: 0.3,
    makeupGain: 3
};

// Basic Ambience (Off)
const AMB_OFF = { enabled: false, type: 'NONE', wet: 0, decay: 0 };

// Basic Spatial (Off)
const SPATIAL_OFF = { enabled: false, width: 0, crossfeed: 0, mode: 'stereo' as const };

/**
 * Basic EQ Presets - 5-Band matching Android exactly
 * Frequencies: 60Hz, 250Hz, 1kHz, 4kHz, 16kHz
 * Values from Android: EQPresets.kt
 */
export const BASIC_PRESETS: IThemePreset[] = [
    // ================= MODES =================
    {
        id: 'TP_AI_AUTO_EQ',
        name: 'TP AI Auto EQ',
        description: 'Cân bằng âm thanh thông minh (Beta)',
        category: 'basic',
        provider: 'TP_MI',
        eqGains: [0, 0, 0, 0, 0], // Placeholder for AI
        dynamics: DYN_STANDARD,
        ambience: AMB_OFF,
        spatial: SPATIAL_OFF
    },
    {
        id: 'TP_432_HZ',
        name: 'TP 432 Hz',
        description: 'Tần số chữa lành tự nhiên',
        category: 'basic',
        provider: 'TP_MI',
        eqGains: [0, 0, 0, 0, 0],
        dynamics: DYN_STANDARD,
        ambience: AMB_OFF,
        spatial: SPATIAL_OFF,
        playbackRate: 0.981818, // 432/440
        preservePitch: false
    },
    {
        id: 'TP_HD_AUDIO',
        name: 'TP HD Audio',
        description: 'Âm thanh độ phân giải cao',
        category: 'basic',
        provider: 'TP_MI',
        eqGains: [0, 0, 0, 1, 2], // Slight air boost
        dynamics: DYN_HD,
        ambience: AMB_OFF,
        spatial: SPATIAL_OFF
    },

    // ================= EQ PRESETS (from Android EQPresets.kt) =================
    // 5-band: [60Hz, 250Hz, 1kHz, 4kHz, 16kHz]
    {
        id: 'FLAT',
        name: 'Flat',
        description: 'Nguyên bản',
        category: 'basic',
        eqGains: [0, 0, 0, 0, 0],
        dynamics: DYN_STANDARD,
        ambience: AMB_OFF,
        spatial: SPATIAL_OFF
    },
    {
        id: 'GUQIN',
        name: 'Cổ Cầm (古琴)',
        description: 'Trầm ấm - Cổ phong',
        category: 'basic',
        eqGains: [6, 10, -3, 5, 3], // Android: [6, 10, -3, 5, 3]
        dynamics: DYN_STANDARD,
        ambience: AMB_OFF,
        spatial: SPATIAL_OFF
    },
    {
        id: 'PIPA',
        name: 'Tỳ Bà (琵琶)',
        description: 'Trong trẻo - Ré rắt',
        category: 'basic',
        eqGains: [-3, 5, 8, 10, 5], // Android: [-3, 5, 8, 10, 5]
        dynamics: DYN_STANDARD,
        ambience: AMB_OFF,
        spatial: SPATIAL_OFF
    },
    {
        id: 'ERHU',
        name: 'Nhị Hồ (二胡)',
        description: 'Da diết - Sâu lắng',
        category: 'basic',
        eqGains: [-5, 5, 10, 5, -3], // Android: [-5, 5, 10, 5, -3]
        dynamics: DYN_STANDARD,
        ambience: AMB_OFF,
        spatial: SPATIAL_OFF
    },
    {
        id: 'FLUTE',
        name: 'Sáo Trúc (笛子)',
        description: 'Cao vút - Thanh thoát',
        category: 'basic',
        eqGains: [-8, -2, 7, 12, 9], // Android: [-8, -2, 7, 12, 9]
        dynamics: DYN_STANDARD,
        ambience: AMB_OFF,
        spatial: SPATIAL_OFF
    },
    {
        id: 'ZEN',
        name: 'Thiền (禅)',
        description: 'Tĩnh tâm - An lạc',
        category: 'basic',
        eqGains: [9, 5, -7, -3, 5], // Android: [9, 5, -7, -3, 5]
        dynamics: DYN_STANDARD,
        ambience: AMB_OFF,
        spatial: SPATIAL_OFF
    },
    {
        id: 'VOCAL',
        name: 'Giọng Hát (人声)',
        description: 'Nổi bật giọng ca',
        category: 'basic',
        eqGains: [-2, 3, 8, 5, 3], // Android: [-2, 3, 8, 5, 3]
        dynamics: DYN_STANDARD,
        ambience: AMB_OFF,
        spatial: SPATIAL_OFF
    },
    {
        id: 'NATURE',
        name: 'Thiên Nhiên (自然)',
        description: 'Mô phỏng không gian mở',
        category: 'basic',
        eqGains: [7, 0, -3, 5, 9], // Android: [7, 0, -3, 5, 9]
        dynamics: DYN_HD,
        ambience: { enabled: true, type: 'SMALL_ROOM', wet: 0.1, decay: 0.5 },
        spatial: { enabled: true, width: 0.2, crossfeed: 0, mode: 'stereo' }
    },
    {
        id: 'BASS_BOOST',
        name: 'Bass Boost',
        description: 'Sôi động',
        category: 'basic',
        eqGains: [14, 8, 0, 3, 5], // Android: [14, 8, 0, 3, 5]
        dynamics: { ...DYN_HD, ratio: 2.5, makeupGain: 2 },
        ambience: AMB_OFF,
        spatial: SPATIAL_OFF
    },
    {
        id: 'NIGHT_MODE',
        name: 'Night Mode',
        description: 'Êm dịu',
        category: 'basic',
        eqGains: [-6, 3, 5, 3, -8], // Android: [-6, 3, 5, 3, -8]
        dynamics: DYN_NIGHT,
        ambience: AMB_OFF,
        spatial: SPATIAL_OFF
    }
];

