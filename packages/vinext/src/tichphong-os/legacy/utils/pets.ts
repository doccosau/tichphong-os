/**
 * TichPhong Core 5.1.1 - Spirit Pets (Linh Thú) System
 * Companion creatures that provide buffs
 */

import { type LinhCan } from './cultivation';

export type PetId = 'linh_ho' | 'huyen_vu' | 'thanh_xa' | 'kim_bang' |
    'ky_lan' | 'than_long' | 'chu_tuoc' | 'hon_don_thu';

export type PetRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface PetBuff {
    id: string;
    name: string;
    description: string;
    value: number;
    type: 'tuvi_percent' | 'drop_rate' | 'tribulation_resist' | 'all_percent';
}

export interface Pet {
    id: PetId;
    name: string;
    element: LinhCan | null;
    icon: string;
    rarity: PetRarity;
    description: string;
    maxLevel: number;
    buff: PetBuff;
    evolvesTo?: PetId;
    obtainMethod: string;
}

export interface OwnedPet {
    petId: PetId;
    level: number;
    experience: number;
    bond: number; // 0-100, affects buff strength
    obtainedAt: number;
    isActive: boolean;
}

// Pet definitions
export const PETS: Pet[] = [
    {
        id: 'linh_ho',
        name: 'Linh Hồ',
        element: 'hoa',
        icon: '/assets/icons/pets/pet_fox.png',
        rarity: 'common',
        description: 'Hồ ly tinh thông linh, tăng cường may mắn khi nghe nhạc',
        maxLevel: 30,
        buff: { id: 'drop_boost', name: 'Kỳ Ngộ Duyên', description: '+15% tỉ lệ rơi đồ', value: 15, type: 'drop_rate' },
        evolvesTo: 'chu_tuoc',
        obtainMethod: 'Gacha / Kỳ Ngộ'
    },
    {
        id: 'huyen_vu',
        name: 'Huyền Vũ',
        element: 'thuy',
        icon: '/assets/icons/pets/pet_turtle.png',
        rarity: 'rare',
        description: 'Thần quy thượng cổ, hộ thân chống lại kiếp nạn',
        maxLevel: 40,
        buff: { id: 'tribulation_shield', name: 'Huyền Vũ Hộ Thể', description: '-25% sát thương kiếp nạn', value: 25, type: 'tribulation_resist' },
        obtainMethod: '7 ngày đăng nhập liên tiếp'
    },
    {
        id: 'thanh_xa',
        name: 'Thanh Xà',
        element: 'moc',
        icon: '/assets/icons/pets/pet_snake.png',
        rarity: 'rare',
        description: 'Linh xà mộc hệ, tăng sản lượng linh điền',
        maxLevel: 40,
        buff: { id: 'herb_boost', name: 'Linh Điền Phúc', description: '+20% sản lượng linh thảo', value: 20, type: 'drop_rate' },
        obtainMethod: 'Thanh Mộc Cốc môn phái'
    },
    {
        id: 'kim_bang',
        name: 'Kim Bằng',
        element: 'kim',
        icon: '/assets/icons/pets/pet_eagle.png',
        rarity: 'epic',
        description: 'Thần điểu kim dực, tăng tốc độ tu luyện',
        maxLevel: 50,
        buff: { id: 'tuvi_boost', name: 'Kim Bằng Triển Sí', description: '+30% Tu Vi từ phi kiếm', value: 30, type: 'tuvi_percent' },
        obtainMethod: 'Đạt Kim Đan cảnh giới'
    },
    {
        id: 'ky_lan',
        name: 'Kỳ Lân',
        element: 'tho',
        icon: '/assets/icons/pets/pet_buffalo.png',
        rarity: 'epic',
        description: 'Thượng cổ thần thú, tăng sức mạnh trận pháp',
        maxLevel: 50,
        buff: { id: 'formation_boost', name: 'Kỳ Lân Trấn', description: '+40% hiệu quả trận pháp', value: 40, type: 'all_percent' },
        obtainMethod: 'Legendary drop'
    },
    {
        id: 'than_long',
        name: 'Thần Long',
        element: null,
        icon: '/assets/icons/pets/pet_dragon.png',
        rarity: 'legendary',
        description: 'Long tộc chân linh, tăng toàn diện tu luyện',
        maxLevel: 60,
        buff: { id: 'all_boost', name: 'Long Khí Hộ Thể', description: '+20% tất cả', value: 20, type: 'all_percent' },
        obtainMethod: 'Đạt Đại Thừa cảnh giới'
    },
    {
        id: 'chu_tuoc',
        name: 'Chu Tước',
        element: 'hoa',
        icon: '/assets/icons/pets/pet_phoenix.png',
        rarity: 'legendary',
        description: 'Nam phương thần điểu, nhân đôi Tu Vi trong sự kiện',
        maxLevel: 60,
        buff: { id: 'event_boost', name: 'Chu Tước Chi Viêm', description: 'x2 Tu Vi trong event', value: 100, type: 'tuvi_percent' },
        obtainMethod: 'Tiến hóa từ Linh Hồ Lv.30'
    },
    {
        id: 'hon_don_thu',
        name: 'Hỗn Độn Thú',
        element: null,
        icon: '/assets/icons/pets/pet_chaos_beast.png',
        rarity: 'mythic',
        description: 'Hỗn độn sơ khai chi thú, sức mạnh vô biên',
        maxLevel: 99,
        buff: { id: 'chaos_power', name: 'Hỗn Độn Chi Lực', description: '+50% tất cả', value: 50, type: 'all_percent' },
        obtainMethod: '???'
    }
];

// Helper functions
export const getPetById = (id: PetId): Pet | undefined => PETS.find(p => p.id === id);

export const getPetRarityColor = (rarity: PetRarity): string => {
    switch (rarity) {
        case 'common': return 'from-gray-400 to-gray-500';
        case 'rare': return 'from-blue-400 to-cyan-500';
        case 'epic': return 'from-purple-400 to-violet-500';
        case 'legendary': return 'from-amber-400 to-orange-500';
        case 'mythic': return 'from-rose-500 to-red-600';
    }
};

export const getPetRarityLabel = (rarity: PetRarity): string => {
    switch (rarity) {
        case 'common': return 'Thường';
        case 'rare': return 'Hiếm';
        case 'epic': return 'Sử Thi';
        case 'legendary': return 'Truyền Thuyết';
        case 'mythic': return 'Thần Thoại';
    }
};

export const calculatePetExpForLevel = (level: number): number => {
    // Exponential growth
    return Math.floor(100 * Math.pow(1.5, level - 1));
};

export const calculatePetBuffValue = (pet: Pet, ownedPet: OwnedPet): number => {
    // Buff scales with level and bond
    const levelMultiplier = 1 + (ownedPet.level - 1) * 0.02; // +2% per level
    const bondMultiplier = 1 + (ownedPet.bond / 100) * 0.5; // Up to +50% at max bond
    return Math.round(pet.buff.value * levelMultiplier * bondMultiplier);
};

export const canEvolvePet = (pet: Pet, ownedPet: OwnedPet): boolean => {
    return !!pet.evolvesTo && ownedPet.level >= pet.maxLevel;
};

// Feed items for pets
export interface PetFood {
    id: string;
    name: string;
    icon: string;
    expGain: number;
    bondGain: number;
    rarity: PetRarity;
}

export const PET_FOODS: PetFood[] = [
    { id: 'spirit_fruit', name: 'Linh Quả', icon: '/assets/items/food_spirit_fruit.png', expGain: 50, bondGain: 5, rarity: 'common' },
    { id: 'spirit_meat', name: 'Linh Thú Nhục', icon: '/assets/items/food_spirit_meat.png', expGain: 100, bondGain: 10, rarity: 'rare' },
    { id: 'dragon_pill', name: 'Long Đan', icon: '/assets/items/food_dragon_pill.png', expGain: 500, bondGain: 20, rarity: 'epic' },
    { id: 'divine_nectar', name: 'Thần Lộ', icon: '/assets/items/food_divine_nectar.png', expGain: 2000, bondGain: 50, rarity: 'legendary' }
];
