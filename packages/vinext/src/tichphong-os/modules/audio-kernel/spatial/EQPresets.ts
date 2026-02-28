/**
 * EQ Presets - Ported from Android TichPhong App
 * 
 * 5-Band Equalizer for instrument-specific and mood-based tuning.
 * Frequencies: 60Hz, 250Hz, 1kHz, 4kHz, 16kHz
 */

export interface EQPreset {
    id: string;
    name: string;
    nameZh: string;
    nameVi: string;
    icon: string;
    gains: number[];  // 5-band gains in dB
    description: string;
}

// ═══════════════════════════════════════════════════════════════════
// CORE EQ PRESETS (Ported from Android)
// ═══════════════════════════════════════════════════════════════════

export const EQ_FLAT: EQPreset = {
    id: 'flat',
    name: 'Flat',
    nameZh: '原声',
    nameVi: 'Nguyên Âm',
    icon: '📊',
    gains: [0, 0, 0, 0, 0],
    description: 'Âm thanh gốc, không chỉnh sửa'
};

export const EQ_GUQIN: EQPreset = {
    id: 'guqin',
    name: 'Guqin',
    nameZh: '古琴',
    nameVi: 'Cổ Cầm',
    icon: '🎸',
    gains: [6, 10, -3, 5, 3],
    description: 'Âm trầm phong phú cho đàn cổ cầm'
};

export const EQ_PIPA: EQPreset = {
    id: 'pipa',
    name: 'Pipa',
    nameZh: '琵琶',
    nameVi: 'Tỳ Bà',
    icon: '🪕',
    gains: [-3, 5, 8, 10, 5],
    description: 'Âm trong sáng cho dây đàn tỳ bà'
};

export const EQ_ERHU: EQPreset = {
    id: 'erhu',
    name: 'Erhu',
    nameZh: '二胡',
    nameVi: 'Nhị Hồ',
    icon: '🎻',
    gains: [-5, 5, 10, 5, -3],
    description: 'Âm trung ấm áp cho nhị hồ'
};

export const EQ_FLUTE: EQPreset = {
    id: 'flute',
    name: 'Flute',
    nameZh: '笛子',
    nameVi: 'Sáo Trúc',
    icon: '🎺',
    gains: [-8, -2, 7, 12, 9],
    description: 'Âm cao trong trẻo cho sáo trúc'
};

export const EQ_ZEN: EQPreset = {
    id: 'zen',
    name: 'Zen',
    nameZh: '禅意',
    nameVi: 'Thiền Định',
    icon: '🧘',
    gains: [9, 5, -7, -3, 5],
    description: 'Bass sâu, chế độ thiền định'
};

export const EQ_VOCAL: EQPreset = {
    id: 'vocal',
    name: 'Vocal',
    nameZh: '人声',
    nameVi: 'Giọng Hát',
    icon: '🎤',
    gains: [-2, 3, 8, 5, 3],
    description: 'Tăng cường giọng hát'
};

export const EQ_NATURE: EQPreset = {
    id: 'nature',
    name: 'Nature',
    nameZh: '自然',
    nameVi: 'Thiên Nhiên',
    icon: '🌲',
    gains: [7, 0, -3, 5, 9],
    description: 'Cho âm thanh thiên nhiên'
};

export const EQ_BASS_BOOST: EQPreset = {
    id: 'bass_boost',
    name: 'Bass Boost',
    nameZh: '低音',
    nameVi: 'Tăng Bass',
    icon: '🔊',
    gains: [14, 8, 0, 3, 5],
    description: 'Bass mạnh cho nhạc sôi động'
};

export const EQ_NIGHT_MODE: EQPreset = {
    id: 'night_mode',
    name: 'Night Mode',
    nameZh: '夜间',
    nameVi: 'Đêm Khuya',
    icon: '🌙',
    gains: [-6, 3, 5, 3, -8],
    description: 'Âm thanh êm dịu để nghe đêm khuya'
};

// ═══════════════════════════════════════════════════════════════════
// ALL PRESETS
// ═══════════════════════════════════════════════════════════════════

export const ALL_EQ_PRESETS: EQPreset[] = [
    EQ_FLAT,
    EQ_GUQIN,
    EQ_PIPA,
    EQ_ERHU,
    EQ_FLUTE,
    EQ_ZEN,
    EQ_VOCAL,
    EQ_NATURE,
    EQ_BASS_BOOST,
    EQ_NIGHT_MODE
];

export function getEQPresetById(id: string): EQPreset {
    return ALL_EQ_PRESETS.find(p => p.id === id) || EQ_FLAT;
}

// ═══════════════════════════════════════════════════════════════════
// 5-BAND FREQUENCIES (Used by both EQ Presets and Spatial Presets)
// ═══════════════════════════════════════════════════════════════════

export const EQ_FREQUENCIES = [60, 250, 1000, 4000, 16000];
