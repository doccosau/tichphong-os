import { IThemePreset } from '../interfaces';

// Helper for mapping ReverbPreset to AmbienceConfig
const getAmbience = (preset: string): { enabled: boolean; type: string; wet: number; decay: number } => {
    switch (preset) {
        case 'SMALL_ROOM': return { enabled: true, type: 'SMALL_ROOM', wet: 0.15, decay: 0.5 };
        case 'MEDIUM_ROOM': return { enabled: true, type: 'MEDIUM_ROOM', wet: 0.2, decay: 1.0 };
        case 'LARGE_ROOM': return { enabled: true, type: 'LARGE_ROOM', wet: 0.25, decay: 1.8 };
        case 'MEDIUM_HALL': return { enabled: true, type: 'MEDIUM_HALL', wet: 0.3, decay: 2.2 };
        case 'LARGE_HALL': return { enabled: true, type: 'LARGE_HALL', wet: 0.35, decay: 3.5 };
        case 'PLATE': return { enabled: true, type: 'PLATE', wet: 0.4, decay: 2.5 };
        default: return { enabled: false, type: 'NONE', wet: 0, decay: 0 };
    }
};

const AMB_OFF = { enabled: false, type: 'NONE', wet: 0, decay: 0 };

const DYN_CINEMA = { threshold: -24, knee: 20, ratio: 2.5, attack: 0.01, release: 0.3, makeupGain: 3 };
const DYN_MUSIC = { threshold: -20, knee: 30, ratio: 1.5, attack: 0.005, release: 0.2, makeupGain: 1 };
const DYN_GAME = { threshold: -18, knee: 10, ratio: 3, attack: 0.001, release: 0.1, makeupGain: 2 };
const DYN_HD = { threshold: -24, knee: 30, ratio: 1.5, attack: 0.003, release: 0.2, makeupGain: 0.5 };

/**
 * Advanced EQ Presets - 5-Band matching Android
 * Frequencies: 60Hz, 250Hz, 1kHz, 4kHz, 16kHz
 * Converted from 10-band to 5-band by taking representative values
 */
export const ADVANCED_PRESETS: IThemePreset[] = [
    // ================= DOLBY ATMOS =================
    {
        id: 'DOLBY_MUSIC',
        name: 'Music',
        description: 'Cân bằng, chi tiết',
        category: 'advanced',
        provider: 'DOLBY',
        eqGains: [4, 1, -1, 2, 4], // 5-band: [60, 250, 1k, 4k, 16k]
        dynamics: DYN_MUSIC,
        ambience: getAmbience('MEDIUM_HALL'),
        spatial: { enabled: true, width: 0.7, crossfeed: 0.2, mode: 'surround' }
    },
    {
        id: 'DOLBY_VIDEO',
        name: 'Video',
        description: 'Rạp phim tại gia',
        category: 'advanced',
        provider: 'DOLBY',
        eqGains: [5, 2, 1, 2, 4], // Cinema boost
        dynamics: DYN_CINEMA,
        ambience: getAmbience('LARGE_HALL'),
        spatial: { enabled: true, width: 0.9, crossfeed: 0.3, mode: 'surround' }
    },
    {
        id: 'DOLBY_PODCAST',
        name: 'Podcast',
        description: 'Giọng nói rõ ràng',
        category: 'advanced',
        provider: 'DOLBY',
        eqGains: [1, -1, 3, 4, 2], // Voice clarity
        dynamics: { ...DYN_MUSIC, ratio: 2.5, threshold: -25 },
        ambience: getAmbience('SMALL_ROOM'),
        spatial: { enabled: true, width: 0.4, crossfeed: 0.1, mode: 'stereo' }
    },
    {
        id: 'DOLBY_CLASSIC',
        name: 'Cổ Điển',
        description: 'Thính phòng',
        category: 'advanced',
        provider: 'DOLBY',
        eqGains: [2, 1, 0, 1, 3], // Warm, balanced
        dynamics: DYN_MUSIC,
        ambience: getAmbience('PLATE'),
        spatial: { enabled: true, width: 0.5, crossfeed: 0.15, mode: 'stereo' }
    },

    // ================= MI SOUND =================
    {
        id: 'MI_DYNAMIC',
        name: 'Mạnh Mẽ',
        description: 'Năng động, sôi nổi',
        category: 'advanced',
        provider: 'MI_SOUND',
        eqGains: [6, 3, 0, 3, 5], // Energetic V-shape
        dynamics: { ...DYN_MUSIC, makeupGain: 2 },
        ambience: getAmbience('MEDIUM_ROOM'),
        spatial: { enabled: true, width: 0.8, crossfeed: 0.25, mode: 'surround' }
    },
    {
        id: 'MI_VOCAL',
        name: 'Giọng Hát',
        description: 'Ấm áp, trong trẻo',
        category: 'advanced',
        provider: 'MI_SOUND',
        eqGains: [1, -1, 2, 3, 2], // Vocal emphasis
        dynamics: DYN_MUSIC,
        ambience: getAmbience('SMALL_ROOM'),
        spatial: { enabled: true, width: 0.4, crossfeed: 0.1, mode: 'stereo' }
    },
    {
        id: 'MI_ROCK',
        name: 'Rock',
        description: 'Sôi động, guitar rõ',
        category: 'advanced',
        provider: 'MI_SOUND',
        eqGains: [4, 2, -1, 4, 5], // Guitar clarity
        dynamics: { ...DYN_MUSIC, ratio: 2, attack: 0.002 },
        ambience: getAmbience('MEDIUM_ROOM'),
        spatial: { enabled: true, width: 0.6, crossfeed: 0.2, mode: 'stereo' }
    },
    {
        id: 'MI_POP',
        name: 'Pop',
        description: 'Bắt tai, hiện đại',
        category: 'advanced',
        provider: 'MI_SOUND',
        eqGains: [3, 1, 0, 3, 4], // Modern pop sound
        dynamics: DYN_MUSIC,
        ambience: getAmbience('MEDIUM_HALL'),
        spatial: { enabled: true, width: 0.55, crossfeed: 0.15, mode: 'stereo' }
    },

    // ================= DTS HEADPHONE:X =================
    {
        id: 'DTS_GAME',
        name: 'Game',
        description: 'Định vị 3D',
        category: 'advanced',
        provider: 'DTS_HPX',
        eqGains: [2, -1, 2, 4, 3], // Footstep clarity
        dynamics: DYN_GAME,
        ambience: getAmbience('LARGE_ROOM'),
        spatial: { enabled: true, width: 1.0, crossfeed: 0.4, mode: 'binaural' }
    },
    {
        id: 'DTS_SURROUND',
        name: 'Surround',
        description: 'Vòm 7.1 ảo',
        category: 'advanced',
        provider: 'DTS_HPX',
        eqGains: [3, 1, 0, 2, 4], // Wide soundstage
        dynamics: DYN_CINEMA,
        ambience: getAmbience('MEDIUM_HALL'),
        spatial: { enabled: true, width: 1.0, crossfeed: 0.35, mode: 'surround' }
    },
    {
        id: 'DTS_CINEMA',
        name: 'Rạp Phim',
        description: 'Bom tấn điện ảnh',
        category: 'advanced',
        provider: 'DTS_HPX',
        eqGains: [5, 2, 2, 3, 4], // Blockbuster sound
        dynamics: { ...DYN_CINEMA, makeupGain: 4 },
        ambience: getAmbience('LARGE_HALL'),
        spatial: { enabled: true, width: 0.9, crossfeed: 0.3, mode: 'surround' }
    },

    // ================= SONY =================
    {
        id: 'SONY_CLEARAUDIO',
        name: 'ClearAudio+',
        description: 'Tự động tối ưu',
        category: 'advanced',
        provider: 'SONY',
        eqGains: [2, 1, 0, 2, 4], // Clear and balanced
        dynamics: { ...DYN_MUSIC, ratio: 1.2, knee: 40 },
        ambience: getAmbience('SMALL_ROOM'),
        spatial: { enabled: true, width: 0.3, crossfeed: 0.1, mode: 'stereo' }
    },
    {
        id: 'SONY_DSEE_HX',
        name: 'DSEE HX',
        description: 'Phục hồi dải cao',
        category: 'advanced',
        provider: 'SONY',
        eqGains: [0, 0, 1, 4, 7], // High frequency restore
        dynamics: DYN_HD,
        ambience: AMB_OFF,
        spatial: { enabled: true, width: 0.1, crossfeed: 0, mode: 'stereo' }
    },
    {
        id: 'SONY_S_FORCE',
        name: 'S-Force Surround',
        description: 'Giả lập vòm phía trước',
        category: 'advanced',
        provider: 'SONY',
        eqGains: [4, 2, -1, 3, 5], // Front surround simulation
        dynamics: DYN_CINEMA,
        ambience: getAmbience('MEDIUM_HALL'),
        spatial: { enabled: true, width: 0.95, crossfeed: 0.3, mode: 'surround' }
    }
];
