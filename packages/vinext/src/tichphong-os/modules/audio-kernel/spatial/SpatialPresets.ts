/**
 * Spatial Presets - Ported from Android TichPhong App
 * 
 * Includes: Dolby Atmos, Mi Sound, DTS Headphone:X, Sony Technologies
 * Each preset combines Virtualizer, Reverb, BassBoost, and EQ settings.
 */

export type AudioSource = 'DOLBY' | 'MI_SOUND' | 'DTS' | 'SONY';

export interface SpatialPreset {
    id: string;
    source: AudioSource;
    nameVi: string;
    nameEn: string;
    icon: string;  // Emoji or icon name
    description: string;
    virtualizerStrength: number;  // 0-1000 → normalized to 0-1
    reverbPreset: ReverbPreset;
    bassBoostStrength: number;    // 0-1000 → normalized to 0-1
    eqGains: number[];            // 5-band EQ gains in dB
}

export type ReverbPreset =
    | 'NONE'
    | 'SMALL_ROOM'
    | 'MEDIUM_ROOM'
    | 'LARGE_ROOM'
    | 'MEDIUM_HALL'
    | 'LARGE_HALL'
    | 'PLATE';

// Audio Source Metadata
export const AUDIO_SOURCES: Record<AudioSource, {
    displayName: string;
    icon: string;
    descriptionVi: string;
    techIntro: string;
}> = {
    DOLBY: {
        displayName: 'Dolby Atmos',
        icon: '🎬',
        descriptionVi: 'Âm thanh vòm điện ảnh',
        techIntro: 'Mang rạp chiếu phim về nhà bạn. Công nghệ âm thanh vòm hàng đầu thế giới.'
    },
    MI_SOUND: {
        displayName: 'Mi Sound',
        icon: '🎧',
        descriptionVi: 'Tối ưu hóa thiết bị',
        techIntro: 'Tinh chỉnh độc quyền. Sử dụng thuật toán Dirac HD Sound để tối ưu hóa từng dải âm.'
    },
    DTS: {
        displayName: 'DTS Headphone:X',
        icon: '🎮',
        descriptionVi: 'Âm thanh 3D Gaming',
        techIntro: 'Lợi thế cạnh tranh trong game. Định vị chính xác với giả lập 7.1 kênh.'
    },
    SONY: {
        displayName: 'Sony Technologies',
        icon: '🔊',
        descriptionVi: 'Công nghệ âm thanh Sony',
        techIntro: 'Tái tạo âm thanh đỉnh cao. Phục hồi dải âm cao bị mất với DSEE HX.'
    }
};

// ═══════════════════════════════════════════════════════════════════
// DOLBY ATMOS - Cinematic immersive audio
// ═══════════════════════════════════════════════════════════════════

export const DOLBY_MUSIC: SpatialPreset = {
    id: 'dolby_music',
    source: 'DOLBY',
    nameVi: 'Âm nhạc',
    nameEn: 'Music',
    icon: '🎵',
    description: 'Cân bằng, sống động',
    virtualizerStrength: 700,
    reverbPreset: 'MEDIUM_HALL',
    bassBoostStrength: 500,
    eqGains: [5, 1, -1, 1.5, 4.5]  // 60Hz, 250Hz, 1kHz, 4kHz, 16kHz
};

export const DOLBY_VIDEO: SpatialPreset = {
    id: 'dolby_video',
    source: 'DOLBY',
    nameVi: 'Phim ảnh',
    nameEn: 'Movie',
    icon: '🎬',
    description: 'Điện ảnh, hoành tráng',
    virtualizerStrength: 900,
    reverbPreset: 'LARGE_HALL',
    bassBoostStrength: 600,
    eqGains: [6, 2, 1, 2, 4]
};

export const DOLBY_VOICE: SpatialPreset = {
    id: 'dolby_voice',
    source: 'DOLBY',
    nameVi: 'Podcast',
    nameEn: 'Voice',
    icon: '🎙️',
    description: 'Hội thoại rõ ràng',
    virtualizerStrength: 400,
    reverbPreset: 'SMALL_ROOM',
    bassBoostStrength: 200,
    eqGains: [1, -1.5, 3, 4, 2]
};

export const DOLBY_CLASSIC: SpatialPreset = {
    id: 'dolby_classic',
    source: 'DOLBY',
    nameVi: 'Cổ điển',
    nameEn: 'Classic',
    icon: '🎻',
    description: 'Tự nhiên, tinh tế',
    virtualizerStrength: 500,
    reverbPreset: 'PLATE',
    bassBoostStrength: 250,
    eqGains: [3, 1.5, 0, 1, 3.5]
};

// ═══════════════════════════════════════════════════════════════════
// MI SOUND - Xiaomi audio enhancement (Dirac)
// ═══════════════════════════════════════════════════════════════════

export const MI_DYNAMIC: SpatialPreset = {
    id: 'mi_dynamic',
    source: 'MI_SOUND',
    nameVi: 'Mạnh mẽ',
    nameEn: 'Dynamic',
    icon: '⚡',
    description: 'Năng động, bass mạnh',
    virtualizerStrength: 800,
    reverbPreset: 'MEDIUM_ROOM',
    bassBoostStrength: 700,
    eqGains: [7, 3, 0, 3, 6]
};

export const MI_VOCAL: SpatialPreset = {
    id: 'mi_vocal',
    source: 'MI_SOUND',
    nameVi: 'Giọng hát',
    nameEn: 'Vocal',
    icon: '🎤',
    description: 'Giọng rõ ràng, ấm',
    virtualizerStrength: 400,
    reverbPreset: 'SMALL_ROOM',
    bassBoostStrength: 300,
    eqGains: [2, -1, 1.5, 3.5, 2]
};

export const MI_ROCK: SpatialPreset = {
    id: 'mi_rock',
    source: 'MI_SOUND',
    nameVi: 'Rock',
    nameEn: 'Rock',
    icon: '🤘',
    description: 'Guitar mạnh, drums punch',
    virtualizerStrength: 600,
    reverbPreset: 'MEDIUM_ROOM',
    bassBoostStrength: 600,
    eqGains: [5, 2, -1, 4, 5]
};

export const MI_POP: SpatialPreset = {
    id: 'mi_pop',
    source: 'MI_SOUND',
    nameVi: 'Pop',
    nameEn: 'Pop',
    icon: '🎶',
    description: 'Sáng, bắt tai',
    virtualizerStrength: 550,
    reverbPreset: 'MEDIUM_HALL',
    bassBoostStrength: 450,
    eqGains: [4, 1, 0.5, 3, 4]
};

// ═══════════════════════════════════════════════════════════════════
// DTS HEADPHONE:X - 3D Spatial positioning
// ═══════════════════════════════════════════════════════════════════

export const DTS_GAME: SpatialPreset = {
    id: 'dts_game',
    source: 'DTS',
    nameVi: 'Trò chơi',
    nameEn: 'Game',
    icon: '🎮',
    description: '3D chính xác, footsteps',
    virtualizerStrength: 1000,
    reverbPreset: 'LARGE_ROOM',
    bassBoostStrength: 400,
    eqGains: [3, -0.5, 2, 4, 3.5]
};

export const DTS_SURROUND: SpatialPreset = {
    id: 'dts_surround',
    source: 'DTS',
    nameVi: 'Bao quanh',
    nameEn: 'Surround',
    icon: '🔈',
    description: '7.1 ảo, rộng mở',
    virtualizerStrength: 1000,
    reverbPreset: 'MEDIUM_HALL',
    bassBoostStrength: 500,
    eqGains: [4, 1, 0, 2.5, 5]
};

export const DTS_MOVIE: SpatialPreset = {
    id: 'dts_movie',
    source: 'DTS',
    nameVi: 'Rạp phim',
    nameEn: 'Cinema',
    icon: '🎞️',
    description: 'LFE mạnh, dialogue rõ',
    virtualizerStrength: 900,
    reverbPreset: 'LARGE_HALL',
    bassBoostStrength: 650,
    eqGains: [6, 1.5, 2, 3, 4]
};

// ═══════════════════════════════════════════════════════════════════
// SONY TECHNOLOGIES - ClearAudio+, DSEE HX, S-Force
// ═══════════════════════════════════════════════════════════════════

export const SONY_CLEARAUDIO: SpatialPreset = {
    id: 'sony_clearaudio',
    source: 'SONY',
    nameVi: 'ClearAudio+',
    nameEn: 'ClearAudio+',
    icon: '✨',
    description: 'Tự động cân bằng, chi tiết',
    virtualizerStrength: 300,
    reverbPreset: 'SMALL_ROOM',
    bassBoostStrength: 400,
    eqGains: [3, 1, 0, 2, 5]
};

export const SONY_DSEE_HX: SpatialPreset = {
    id: 'sony_dsee_hx',
    source: 'SONY',
    nameVi: 'DSEE HX',
    nameEn: 'DSEE HX',
    icon: '📀',
    description: 'Phục hồi âm cao, Hi-Res',
    virtualizerStrength: 100,
    reverbPreset: 'NONE',
    bassBoostStrength: 200,
    eqGains: [0, 0, 1, 4, 8]  // High frequency boost for upscaling
};

export const SONY_S_FORCE: SpatialPreset = {
    id: 'sony_s_force',
    source: 'SONY',
    nameVi: 'S-Force Surround',
    nameEn: 'S-Force Front Surround',
    icon: '🔊',
    description: 'Giả lập vòm phía trước',
    virtualizerStrength: 950,
    reverbPreset: 'MEDIUM_HALL',
    bassBoostStrength: 500,
    eqGains: [5, 2, -1, 3, 5]
};

// ═══════════════════════════════════════════════════════════════════
// GROUPED PRESETS
// ═══════════════════════════════════════════════════════════════════

export const DOLBY_PRESETS: SpatialPreset[] = [DOLBY_MUSIC, DOLBY_VIDEO, DOLBY_VOICE, DOLBY_CLASSIC];
export const MI_SOUND_PRESETS: SpatialPreset[] = [MI_DYNAMIC, MI_VOCAL, MI_ROCK, MI_POP];
export const DTS_PRESETS: SpatialPreset[] = [DTS_GAME, DTS_SURROUND, DTS_MOVIE];
export const SONY_PRESETS: SpatialPreset[] = [SONY_CLEARAUDIO, SONY_DSEE_HX, SONY_S_FORCE];

export const ALL_SPATIAL_PRESETS: SpatialPreset[] = [
    ...DOLBY_PRESETS,
    ...MI_SOUND_PRESETS,
    ...DTS_PRESETS,
    ...SONY_PRESETS
];

export function getSpatialPresetById(id: string): SpatialPreset {
    return ALL_SPATIAL_PRESETS.find(p => p.id === id) || DOLBY_MUSIC;
}

export function getSpatialPresetsBySource(source: AudioSource): SpatialPreset[] {
    switch (source) {
        case 'DOLBY': return DOLBY_PRESETS;
        case 'MI_SOUND': return MI_SOUND_PRESETS;
        case 'DTS': return DTS_PRESETS;
        case 'SONY': return SONY_PRESETS;
    }
}
