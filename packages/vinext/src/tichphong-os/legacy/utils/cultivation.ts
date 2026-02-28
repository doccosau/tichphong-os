/**
 * TichPhong Core 5.1.1 - Cultivation (Tu Vi) Utilities
 * Inspired by "Con Đường Bá Chủ" - Akay Hau
 * 
 * Linh Cảnh Bát Bộ: 8 Major Realms, each with 4 sub-stages
 */

// Sub-stage types
export type SubStage = 'so_ky' | 'trung_ky' | 'hau_ky' | 'vien_man';

export const SUB_STAGE_NAMES: Record<SubStage, string> = {
    so_ky: 'Sơ Kỳ',
    trung_ky: 'Trung Kỳ',
    hau_ky: 'Hậu Kỳ',
    vien_man: 'Viên Mãn'
};

export const SUB_STAGE_PROGRESS: Record<SubStage, number> = {
    so_ky: 0,
    trung_ky: 25,
    hau_ky: 50,
    vien_man: 75
};

// Linh Căn (Spiritual Root) types
export type LinhCan = 'hoa' | 'thuy' | 'moc' | 'kim' | 'tho' | 'loi' | 'hon_don';

export interface LinhCanInfo {
    id: LinhCan;
    name: string;
    element: string;
    icon: string;
    color: string;
    buff: string;
    buffPercent: number;
    musicGenres: string[];
}

export const LINH_CAN_TABLE: LinhCanInfo[] = [
    { id: 'hoa', name: 'Hỏa Linh Căn', element: 'Hỏa', icon: '/assets/icons/roots/root_fire.png', color: 'from-red-400 to-orange-500', buff: 'Nhạc sôi động', buffPercent: 20, musicGenres: ['EDM', 'Rock', 'Pop'] },
    { id: 'thuy', name: 'Thủy Linh Căn', element: 'Thủy', icon: '/assets/icons/roots/root_water.png', color: 'from-blue-400 to-cyan-500', buff: 'Nhạc nhẹ nhàng', buffPercent: 20, musicGenres: ['Ballad', 'Chill', 'Lofi'] },
    { id: 'moc', name: 'Mộc Linh Căn', element: 'Mộc', icon: '/assets/icons/roots/root_wood.png', color: 'from-green-400 to-emerald-500', buff: 'Nhạc folk/acoustic', buffPercent: 20, musicGenres: ['Folk', 'Acoustic', 'Indie'] },
    { id: 'kim', name: 'Kim Linh Căn', element: 'Kim', icon: '/assets/icons/roots/root_metal.png', color: 'from-yellow-300 to-amber-500', buff: 'Nhạc mạnh mẽ', buffPercent: 20, musicGenres: ['Epic', 'Orchestral', 'Metal'] },
    { id: 'tho', name: 'Thổ Linh Căn', element: 'Thổ', icon: '/assets/icons/roots/root_earth.png', color: 'from-amber-600 to-yellow-700', buff: 'Nhạc truyền thống', buffPercent: 20, musicGenres: ['Cổ phong', 'Dân ca', 'Traditional'] },
    { id: 'loi', name: 'Lôi Linh Căn', element: 'Lôi', icon: '/assets/icons/roots/root_lightning.png', color: 'from-purple-400 to-violet-600', buff: 'Tất cả + Giảm kiếp', buffPercent: 15, musicGenres: ['ALL'] },
    { id: 'hon_don', name: 'Hỗn Độn Linh Căn', element: 'Hỗn Độn', icon: '/assets/icons/roots/root_chaos.png', color: 'from-slate-600 to-slate-900', buff: 'Tất cả', buffPercent: 25, musicGenres: ['ALL'] },
];

// World types (4 major worlds)
export type CultivationWorld = 'pham_gioi' | 'tien_gioi' | 'than_gioi' | 'dao_gioi' | 'chung_cuc_gioi';

export interface WorldInfo {
    id: CultivationWorld;
    name: string;
    description: string;
    minLevel: number;
    maxLevel: number;
    unlockLevel: number; // Level required to unlock this world
    isHidden: boolean;
    icon: string;
    gradient: string;
    bgTheme: string;
}

export const CULTIVATION_WORLDS: WorldInfo[] = [
    {
        id: 'pham_gioi',
        name: 'Phàm Giới',
        description: 'Thế giới phàm trần, nơi tu sĩ bắt đầu con đường tu luyện',
        minLevel: 0,
        maxLevel: 8,
        unlockLevel: 0,
        isHidden: false,
        icon: '🌍',
        gradient: 'from-emerald-500 to-teal-600',
        bgTheme: 'mortal'
    },
    {
        id: 'tien_gioi',
        name: 'Tiên Giới',
        description: 'Tiên đình rực rỡ, nơi Chân Tiên cư ngụ',
        minLevel: 9,
        maxLevel: 13,
        unlockLevel: 8, // Unlock after Độ Kiếp Viên Mãn (Level 8)
        isHidden: true,
        icon: '🌟',
        gradient: 'from-amber-400 to-yellow-500',
        bgTheme: 'immortal'
    },
    {
        id: 'than_gioi',
        name: 'Thần Giới',
        description: 'Thần đình cao quý, nơi Thần Tộc cai trị',
        minLevel: 14,
        maxLevel: 17,
        unlockLevel: 13, // Unlock after Tiên Đế Viên Mãn (Level 13)
        isHidden: true,
        icon: '⚡',
        gradient: 'from-purple-500 to-indigo-600',
        bgTheme: 'divine'
    },
    {
        id: 'dao_gioi',
        name: 'Đạo Giới',
        description: 'Chung cực cảnh giới, hợp nhất Đại Đạo',
        minLevel: 18,
        maxLevel: 22,
        unlockLevel: 17, // Unlock after Siêu Thần Viên Mãn (Level 17)
        isHidden: true,
        icon: '🔮',
        gradient: 'from-rose-500 to-pink-600',
        bgTheme: 'dao'
    }
];

// ========== CÔNG PHÁP (Cultivation Methods) ==========
// Reference: Wiki Con Đường Bá Chủ - https://con-duong-ba-chu.fandom.com/vi/wiki/Công_Pháp
// Cấp bậc: Linh → Thiên → Địa → Huyền → Hoàng

export type CultivationMethodGrade = 'linh' | 'thien' | 'dia' | 'huyen' | 'hoang';

export interface CultivationMethod {
    id: string;
    name: string;
    grade: CultivationMethodGrade;
    description: string;
    multiplier: number;  // XP bonus multiplier
    requiredLevel: number;
    element?: 'hoa' | 'thuy' | 'moc' | 'kim' | 'tho' | 'loi';  // Optional elemental affinity
    icon: string;
    gradient: string;
}

export const CULTIVATION_METHOD_GRADES: Record<CultivationMethodGrade, { name: string; color: string; icon: string }> = {
    linh: { name: 'Linh Cấp', color: 'text-gray-400', icon: '⚪' },
    thien: { name: 'Thiên Cấp', color: 'text-blue-400', icon: '🔵' },
    dia: { name: 'Địa Cấp', color: 'text-green-500', icon: '🟢' },
    huyen: { name: 'Huyền Cấp', color: 'text-purple-400', icon: '🟣' },
    hoang: { name: 'Hoàng Cấp', color: 'text-amber-400', icon: '🟡' },
};

export const CULTIVATION_METHODS: CultivationMethod[] = [
    // === LINH CẤP (Level 0+) ===
    {
        id: 'dan_dao_luyen_khi',
        name: 'Dẫn Đạo Luyện Khí Pháp',
        grade: 'linh',
        description: 'Công pháp cơ bản cho phàm nhân, dẫn khí vào thân, mở rộng kinh mạch.',
        multiplier: 1.0,
        requiredLevel: 0,
        icon: '/assets/icons/methods/basic.png',
        gradient: 'from-gray-400 to-slate-500'
    },
    {
        id: 'bang_thuy_lang_ba',
        name: 'Băng Thủy Lăng Ba Công',
        grade: 'linh',
        description: 'Tu luyện theo hệ Thủy, thi triển như lớp sóng dập dồn.',
        multiplier: 1.1,
        requiredLevel: 1,
        element: 'thuy',
        icon: '/assets/icons/methods/water.png',
        gradient: 'from-blue-400 to-cyan-500'
    },
    {
        id: 'hoa_tam_linh_quyet',
        name: 'Hỏa Tâm Linh Quyết',
        grade: 'linh',
        description: 'Tu luyện theo hệ Hỏa, tâm như lửa hồng, ý chí kiên định.',
        multiplier: 1.1,
        requiredLevel: 1,
        element: 'hoa',
        icon: '/assets/icons/methods/fire.png',
        gradient: 'from-red-400 to-orange-500'
    },
    // === THIÊN CẤP (Level 3+) ===
    {
        id: 'cuu_duong_than_cong',
        name: 'Cửu Dương Thần Công',
        grade: 'thien',
        description: 'Thần công dương khí thuần túy, luyện đến cực đỉnh thì bách độc bất xâm.',
        multiplier: 1.3,
        requiredLevel: 3,
        element: 'hoa',
        icon: '/assets/icons/methods/yang.png',
        gradient: 'from-yellow-400 to-orange-500'
    },
    {
        id: 'cuu_am_than_cong',
        name: 'Cửu Âm Thần Công',
        grade: 'thien',
        description: 'Thần công âm khí u huyền, vận chuyển như cùng lạnh tê tái.',
        multiplier: 1.3,
        requiredLevel: 3,
        element: 'thuy',
        icon: '/assets/icons/methods/yin.png',
        gradient: 'from-indigo-400 to-purple-600'
    },
    // === ĐỊA CẤP (Level 5+) ===
    {
        id: 'dich_can_kinh',
        name: 'Dịch Cân Kinh',
        grade: 'dia',
        description: 'Cải tạo cốt tủy, đổi gân hoán cốt, thể phách siêu phàm.',
        multiplier: 1.5,
        requiredLevel: 5,
        icon: '/assets/icons/methods/tendon.png',
        gradient: 'from-green-400 to-emerald-600'
    },
    {
        id: 'bac_minh_than_cong',
        name: 'Bắc Minh Thần Công',
        grade: 'dia',
        description: 'Hấp thu nội lực người khác, vô cùng bá đạo.',
        multiplier: 1.5,
        requiredLevel: 5,
        icon: '/assets/icons/methods/absorb.png',
        gradient: 'from-teal-400 to-cyan-600'
    },
    // === HUYỀN CẤP (Level 9+) ===
    {
        id: 'bat_hu_dien_sinh_kinh',
        name: 'Bất Hủ Diễn Sinh Kinh',
        grade: 'huyen',
        description: 'Bất hủ tâm pháp tối thượng, luyện thành có thể bất tử bất diệt.',
        multiplier: 2.0,
        requiredLevel: 9,
        icon: '/assets/icons/methods/immortal.png',
        gradient: 'from-purple-500 to-violet-600'
    },
    {
        id: 'hao_thien_loi_than_quyet',
        name: 'Hạo Thiên Lôi Thần Quyết',
        grade: 'huyen',
        description: 'Lôi hệ thần quyết, triệu hoán thiên lôi giáng thế.',
        multiplier: 2.0,
        requiredLevel: 9,
        element: 'loi',
        icon: '/assets/icons/methods/thunder.png',
        gradient: 'from-violet-500 to-purple-700'
    },
    // === HOÀNG CẤP (Level 14+) ===
    {
        id: 'hong_mong_can_khon_kinh',
        name: 'Hồng Mông Càn Khôn Kinh',
        grade: 'hoang',
        description: 'Thượng cổ đại pháp, nắm giữ càn khôn, xoay chuyển vũ trụ.',
        multiplier: 2.5,
        requiredLevel: 14,
        icon: '/assets/icons/methods/cosmos.png',
        gradient: 'from-amber-400 to-yellow-500'
    },
    {
        id: 'hong_mong_dien_dao_quyet',
        name: 'Hồng Mông Diễn Đạo Quyết',
        grade: 'hoang',
        description: 'Chí tôn Đạo Giới công pháp, thấu hiểu Đại Đạo chân ý.',
        multiplier: 3.0,
        requiredLevel: 18,
        icon: '/assets/icons/methods/dao.png',
        gradient: 'from-rose-400 to-pink-600'
    },
];

// Helper functions for cultivation methods
export function getCultivationMethod(id: string): CultivationMethod | undefined {
    return CULTIVATION_METHODS.find(m => m.id === id);
}

export function getAvailableMethods(level: number): CultivationMethod[] {
    return CULTIVATION_METHODS.filter(m => m.requiredLevel <= level);
}

export function calculateXPWithMethod(baseXP: number, methodId?: string): number {
    if (!methodId) return baseXP;
    const method = getCultivationMethod(methodId);
    return method ? Math.floor(baseXP * method.multiplier) : baseXP;
}

// Tribulation types (extended for all worlds)
export type TribulationType =
    // Phàm Giới tribulations
    | 'tam_ma' | 'noi_ma' | 'tam_tai' | 'ngu_hanh' | 'hu_khong' | 'thien_nhan' | 'cuu_trong'
    // Tiên Giới tribulations
    | 'tien_kiep' | 'kim_tien_kiep' | 'thai_at_kiep' | 'tien_vuong_kiep' | 'phi_thang_than'
    // Thần Giới tribulations
    | 'than_nhan_kiep' | 'than_vuong_kiep' | 'than_de_kiep' | 'phi_thang_dao'
    // Đạo Giới tribulations
    | 'nhap_dao_kiep' | 'cam_ky_kiep'
    | 'dai_dao_kiep' | 'thien_dao_kiep' | 'than_dao_kiep';

export interface TribulationInfo {
    id: TribulationType;
    name: string;
    description: string;
    thunderStrikes: number;
    difficulty: number;
    requiredSongs: number;
    successBonus: number;
    icon: string;
}

export const TRIBULATIONS: TribulationInfo[] = [
    // Phàm Giới Tribulations
    { id: 'tam_ma', name: 'Tâm Ma Kiếp', description: 'Đánh vào tinh thần, gợi sơ hở tâm cảnh', thunderStrikes: 3, difficulty: 1, requiredSongs: 10, successBonus: 100, icon: '/assets/icons/tribulations/tribulation_tam_ma.png' },
    { id: 'noi_ma', name: 'Nội Ma Kiếp', description: 'Nội đan nứt ra, khảo nghiệm ý chí', thunderStrikes: 5, difficulty: 2, requiredSongs: 30, successBonus: 300, icon: '/assets/icons/tribulations/tribulation_noi_ma.png' },
    { id: 'tam_tai', name: 'Tam Tai Kiếp', description: 'Thiên tai, địa tai, nhân tai', thunderStrikes: 7, difficulty: 3, requiredSongs: 50, successBonus: 800, icon: '/assets/icons/tribulations/tribulation_tam_tai.png' },
    { id: 'ngu_hanh', name: 'Ngũ Hành Kiếp', description: 'Kim Mộc Thủy Hỏa Thổ luân chuyển', thunderStrikes: 9, difficulty: 4, requiredSongs: 80, successBonus: 2000, icon: '/assets/icons/tribulations/tribulation_ngu_hanh.png' },
    { id: 'hu_khong', name: 'Hư Không Kiếp', description: 'Phá toái hư không, lĩnh ngộ không gian', thunderStrikes: 12, difficulty: 5, requiredSongs: 120, successBonus: 5000, icon: '/assets/icons/tribulations/tribulation_hu_khong.png' },
    { id: 'thien_nhan', name: 'Thiên Nhân Ngũ Suy', description: '5 thử thách liên tiếp của Thiên Đạo', thunderStrikes: 15, difficulty: 6, requiredSongs: 200, successBonus: 15000, icon: '/assets/icons/tribulations/tribulation_thien_nhan.png' },
    { id: 'cuu_trong', name: 'Cửu Trọng Lôi Kiếp', description: '81 đợt lôi kiếp, phi thăng tiên giới', thunderStrikes: 81, difficulty: 7, requiredSongs: 500, successBonus: 50000, icon: '/assets/icons/tribulations/tribulation_cuu_trong.png' },
    // Tiên Giới Tribulations
    { id: 'tien_kiep', name: 'Tiên Kiếp', description: 'Thiên đạo thử thách, bước vào Tiên Giới', thunderStrikes: 99, difficulty: 8, requiredSongs: 800, successBonus: 100000, icon: '/assets/icons/tribulations/tribulation_tien.png' },
    { id: 'kim_tien_kiep', name: 'Kim Tiên Kiếp', description: 'Lôi kiếp vàng ròng, tinh luyện Tiên Thể', thunderStrikes: 108, difficulty: 9, requiredSongs: 1200, successBonus: 200000, icon: '/assets/icons/tribulations/tribulation_kim_tien.png' },
    { id: 'thai_at_kiep', name: 'Thái Ất Kiếp', description: 'Thái Ất thần lôi, phá hủy vạn pháp', thunderStrikes: 144, difficulty: 10, requiredSongs: 2000, successBonus: 500000, icon: '/assets/icons/tribulations/tribulation_thai_at.png' },
    { id: 'tien_vuong_kiep', name: 'Tiên Vương Kiếp', description: 'Chín tầng lôi kiếp, đăng cơ Tiên Vương', thunderStrikes: 243, difficulty: 11, requiredSongs: 3500, successBonus: 1000000, icon: '/assets/icons/tribulations/tribulation_tien_vuong.png' },
    { id: 'phi_thang_than', name: 'Phi Thăng Thần Kiếp', description: 'Vượt qua giới hạn Tiên, bước vào Thần Giới', thunderStrikes: 365, difficulty: 12, requiredSongs: 5000, successBonus: 2000000, icon: '/assets/icons/tribulations/tribulation_phi_thang_than.png' },
    // Thần Giới Tribulations
    { id: 'than_nhan_kiep', name: 'Thần Nhân Kiếp', description: 'Thần Kiếp giáng hạ, khai mở Thần Thể', thunderStrikes: 500, difficulty: 13, requiredSongs: 8000, successBonus: 5000000, icon: '/assets/icons/tribulations/tribulation_than_nhan.png' },
    { id: 'than_vuong_kiep', name: 'Thần Vương Kiếp', description: 'Vương giả chi kiếp, thống trị một phương', thunderStrikes: 777, difficulty: 14, requiredSongs: 12000, successBonus: 10000000, icon: '/assets/icons/tribulations/tribulation_than_vuong.png' },
    { id: 'than_de_kiep', name: 'Thần Đế Kiếp', description: 'Đế vương chi kiếp, hợp nhất Thần Luật', thunderStrikes: 999, difficulty: 15, requiredSongs: 20000, successBonus: 25000000, icon: '/assets/icons/tribulations/tribulation_than_de.png' },
    { id: 'phi_thang_dao', name: 'Phi Thăng Đạo Kiếp', description: 'Siêu việt Thần Linh, nhập Đạo Cảnh', thunderStrikes: 1296, difficulty: 16, requiredSongs: 35000, successBonus: 50000000, icon: '/assets/icons/tribulations/tribulation_phi_thang_dao.png' },
    // Đạo Giới Tribulations
    { id: 'nhap_dao_kiep', name: 'Nhập Đạo Kiếp', description: 'Lĩnh ngộ Đại Đạo, bước vào Đạo Cảnh', thunderStrikes: 1728, difficulty: 17, requiredSongs: 50000, successBonus: 100000000, icon: '/assets/icons/tribulations/tribulation_nhap_dao.png' },
    { id: 'cam_ky_kiep', name: 'Cấm Kỵ Kiếp', description: 'Phạm vào Thiên Cấm, thành Cấm Kỵ Cường Giả', thunderStrikes: 2187, difficulty: 18, requiredSongs: 80000, successBonus: 250000000, icon: '/assets/icons/tribulations/tribulation_cam_ky.png' },
    { id: 'dai_dao_kiep', name: 'Đại Đạo Kiếp', description: 'Đại Đạo tẩy lễ, thành tựu Đại Đạo Chi Thể', thunderStrikes: 3000, difficulty: 19, requiredSongs: 150000, successBonus: 1000000000, icon: '/assets/icons/tribulations/tribulation_hong_mong.png' },
    { id: 'thien_dao_kiep', name: 'Thiên Đạo Kiếp', description: 'Khiêu chiến Thiên Đạo, nắm giữ Thiên Quy', thunderStrikes: 5000, difficulty: 20, requiredSongs: 300000, successBonus: 5000000000, icon: '/assets/icons/tribulations/tribulation_chung_cuc.png' },
    { id: 'than_dao_kiep', name: 'Thần Đạo Kiếp', description: 'Siêu thoát Thiên Đạo, thành tựu Thần Đạo', thunderStrikes: 9999, difficulty: 21, requiredSongs: 1000000, successBonus: 9999999999, icon: '/assets/icons/tribulations/tribulation_ba_chu.png' },
];

// Major Cultivation Realm
export interface CultivationRealm {
    level: number;
    id: string;
    name: string;
    title: string;
    description: string;
    minTuVi: number;
    maxTuVi: number;
    tribulation: TribulationType | null;
    world: CultivationWorld; // Which world this realm belongs to
    color: string;
    text: string;
    gradient: string;
    icon: string;
    perks: string[];
}

// 8 Major Realms (Linh Cảnh Bát Bộ), each with 4 sub-stages
export const CULTIVATION_REALMS: CultivationRealm[] = [
    {
        level: 0,
        id: 'pham_nhan',
        name: 'Phàm Nhân',
        title: 'Phàm Nhân',
        description: 'Võ Giả phàm tục, chưa bước vào tu đạo',
        minTuVi: 0,
        maxTuVi: 49,
        tribulation: null,
        world: 'pham_gioi',
        color: 'gray',
        text: 'text-gray-600',
        gradient: 'from-gray-400 to-gray-500',
        icon: '/assets/icons/realms/realm_mortal.png',
        perks: ['Có Linh Căn mới tu tiên được']
    },
    {
        level: 1,
        id: 'luyen_khi',
        name: 'Luyện Khí',
        title: 'Luyện Khí Kỳ',
        description: 'Dẫn khí nhập thể, hấp thu thiên địa linh khí',
        minTuVi: 50,
        maxTuVi: 199,
        tribulation: 'tam_ma',
        world: 'pham_gioi',
        color: 'green',
        text: 'text-green-600',
        gradient: 'from-green-400 to-emerald-500',
        icon: '/assets/icons/realms/realm_qi_condensation.png',
        perks: ['+10% Tu Vi', 'Cảm nhận Linh Khí']
    },
    {
        level: 2,
        id: 'truc_co',
        name: 'Trúc Cơ',
        title: 'Trúc Cơ Kỳ',
        description: 'Linh Lực tinh luyện thân thể, không còn tạp chất',
        minTuVi: 200,
        maxTuVi: 799,
        tribulation: 'noi_ma',
        world: 'pham_gioi',
        color: 'blue',
        text: 'text-blue-600',
        gradient: 'from-blue-400 to-sky-500',
        icon: '/assets/icons/realms/realm_foundation.png',
        perks: ['Gia nhập Môn Phái', 'Luyện Đan cơ bản', '+15% Tu Vi']
    },
    {
        level: 3,
        id: 'kim_dan',
        name: 'Kim Đan',
        title: 'Kim Đan Kỳ',
        description: 'Lực lượng ngưng tụ thành nội đan vàng kim',
        minTuVi: 800,
        maxTuVi: 2999,
        tribulation: 'tam_tai',
        world: 'pham_gioi',
        color: 'yellow',
        text: 'text-yellow-600',
        gradient: 'from-yellow-400 to-amber-500',
        icon: '/assets/icons/realms/realm_golden_core.png',
        perks: ['Phi Kiếm', 'Động Phủ', '+20% Tu Vi']
    },
    {
        level: 4,
        id: 'nguyen_anh',
        name: 'Nguyên Anh',
        title: 'Nguyên Anh Kỳ',
        description: 'Nội đan nứt ra, nuôi dưỡng Nguyên Anh',
        minTuVi: 3000,
        maxTuVi: 9999,
        tribulation: 'ngu_hanh',
        world: 'pham_gioi',
        color: 'orange',
        text: 'text-orange-600',
        gradient: 'from-orange-400 to-red-500',
        icon: '/assets/icons/realms/realm_golden_core.png',
        perks: ['Thần Thức', 'Linh Thú slot 1', '+25% Tu Vi']
    },
    {
        level: 5,
        id: 'hoa_than',
        name: 'Hóa Thần',
        title: 'Hóa Thần Kỳ',
        description: 'Thần thức hóa vạn, ngao du thái hư',
        minTuVi: 10000,
        maxTuVi: 34999,
        tribulation: 'hu_khong',
        world: 'pham_gioi',
        color: 'red',
        text: 'text-red-600',
        gradient: 'from-red-400 to-rose-600',
        icon: '/assets/icons/realms/realm_golden_core.png',
        perks: ['Phân Thân', 'Linh Thú slot 2', '+30% Tu Vi']
    },
    {
        level: 6,
        id: 'luyen_hu',
        name: 'Luyện Hư',
        title: 'Luyện Hư Kỳ',
        description: 'Lĩnh ngộ hư không, phản phác quy chân',
        minTuVi: 35000,
        maxTuVi: 119999,
        tribulation: 'thien_nhan',
        world: 'pham_gioi',
        color: 'purple',
        text: 'text-purple-600',
        gradient: 'from-purple-400 to-violet-600',
        icon: '/assets/icons/realms/realm_golden_core.png',
        perks: ['Không Gian Trữ Vật lớn', '+35% Tu Vi']
    },
    {
        level: 7,
        id: 'hop_the',
        name: 'Hợp Thể',
        title: 'Hợp Thể Kỳ',
        description: 'Hợp nhất thể hồn, chuẩn bị phi thăng',
        minTuVi: 120000,
        maxTuVi: 399999,
        tribulation: 'cuu_trong',
        world: 'pham_gioi',
        color: 'pink',
        text: 'text-pink-600',
        gradient: 'from-pink-400 to-fuchsia-600',
        icon: '/assets/icons/realms/realm_golden_core.png',
        perks: ['Tiên Phủ', 'Phi Thăng eligible', '+40% Tu Vi']
    },
    {
        level: 8,
        id: 'do_kiep',
        name: 'Độ Kiếp',
        title: 'Độ Kiếp Kỳ',
        description: 'Vượt Cửu Trọng Lôi Kiếp, phi thăng tiên giới',
        minTuVi: 400000,
        maxTuVi: 999999,
        tribulation: 'tien_kiep',
        world: 'pham_gioi',
        color: 'indigo',
        text: 'text-indigo-600',
        gradient: 'from-indigo-500 to-violet-700',
        icon: '/assets/icons/realms/realm_golden_core.png',
        perks: ['PHI THĂNG TIÊN GIỚI 🌟', '+50% Tu Vi']
    },

    // ========== TIÊN GIỚI (Levels 9-13) ==========
    {
        level: 9,
        id: 'chan_tien',
        name: 'Chân Tiên',
        title: 'Chân Tiên Cảnh',
        description: 'Bước vào Tiên Giới, thọ mệnh vô hạn',
        minTuVi: 1000000,
        maxTuVi: 2999999,
        tribulation: 'kim_tien_kiep',
        world: 'tien_gioi',
        color: 'amber',
        text: 'text-amber-500',
        gradient: 'from-amber-400 to-yellow-500',
        icon: '/assets/icons/realms/realm_immortal.png',
        perks: ['Tiên Thể', 'Bất Tử', '+60% Tu Vi']
    },
    {
        level: 10,
        id: 'kim_tien',
        name: 'Kim Tiên',
        title: 'Kim Tiên Cảnh',
        description: 'Kim Tiên bất hoại, pháp lực thông thiên',
        minTuVi: 3000000,
        maxTuVi: 7999999,
        tribulation: 'thai_at_kiep',
        world: 'tien_gioi',
        color: 'yellow',
        text: 'text-yellow-500',
        gradient: 'from-yellow-400 to-orange-500',
        icon: '/assets/icons/realms/realm_golden_immortal.png',
        perks: ['Kim Thân', 'Tiên Thuật', '+70% Tu Vi']
    },
    {
        level: 11,
        id: 'thai_at',
        name: 'Thái Ất',
        title: 'Thái Ất Kim Tiên',
        description: 'Thái Ất Đạo Quả, thống lĩnh tiên binh',
        minTuVi: 8000000,
        maxTuVi: 19999999,
        tribulation: 'tien_vuong_kiep',
        world: 'tien_gioi',
        color: 'orange',
        text: 'text-orange-500',
        gradient: 'from-orange-400 to-red-500',
        icon: '/assets/icons/realms/realm_thai_at.png',
        perks: ['Đạo Quả', 'Thống Lĩnh Tiên Binh', '+80% Tu Vi']
    },
    {
        level: 12,
        id: 'tien_vuong',
        name: 'Tiên Vương',
        title: 'Tiên Vương Cảnh',
        description: 'Vương giả Tiên Giới, chiếu diệu bát phương',
        minTuVi: 20000000,
        maxTuVi: 49999999,
        tribulation: 'phi_thang_than',
        world: 'tien_gioi',
        color: 'rose',
        text: 'text-rose-500',
        gradient: 'from-rose-400 to-pink-600',
        icon: '/assets/icons/realms/realm_immortal_king.png',
        perks: ['Tiên Vương Lĩnh Địa', 'Vương Giả Chi Tôn', '+90% Tu Vi']
    },
    {
        level: 13,
        id: 'tien_de',
        name: 'Tiên Đế',
        title: 'Tiên Đế Cảnh',
        description: 'Đế vương Tiên Giới, chí tôn vô thượng',
        minTuVi: 50000000,
        maxTuVi: 99999999,
        tribulation: 'than_nhan_kiep',
        world: 'tien_gioi',
        color: 'fuchsia',
        text: 'text-fuchsia-500',
        gradient: 'from-fuchsia-500 to-purple-600',
        icon: '/assets/icons/realms/realm_immortal_emperor.png',
        perks: ['PHI THĂNG THẦN GIỚI ⚡', 'Tiên Đế Uy Áp', '+100% Tu Vi']
    },

    // ========== THẦN GIỚI (Levels 14-17) ==========
    {
        level: 14,
        id: 'than_nhan',
        name: 'Thần Nhân',
        title: 'Thần Nhân Cảnh',
        description: 'Bước vào Thần Giới, khai mở Thần Thể',
        minTuVi: 100000000,
        maxTuVi: 299999999,
        tribulation: 'than_vuong_kiep',
        world: 'than_gioi',
        color: 'purple',
        text: 'text-purple-500',
        gradient: 'from-purple-500 to-indigo-600',
        icon: '/assets/icons/realms/realm_divine.png',
        perks: ['Thần Thể', 'Thần Lực', '+120% Tu Vi']
    },
    {
        level: 15,
        id: 'than_vuong',
        name: 'Thần Vương',
        title: 'Thần Vương Cảnh',
        description: 'Vương giả Thần Giới, chưởng quản một vùng',
        minTuVi: 300000000,
        maxTuVi: 799999999,
        tribulation: 'than_de_kiep',
        world: 'than_gioi',
        color: 'indigo',
        text: 'text-indigo-500',
        gradient: 'from-indigo-500 to-blue-600',
        icon: '/assets/icons/realms/realm_divine_king.png',
        perks: ['Thần Vương Lãnh Thổ', 'Thần Vương Chi Quyền', '+150% Tu Vi']
    },
    {
        level: 16,
        id: 'than_de',
        name: 'Thần Đế',
        title: 'Thần Đế Cảnh',
        description: 'Đế vương Thần Giới, chí tôn thần linh',
        minTuVi: 800000000,
        maxTuVi: 1999999999,
        tribulation: 'phi_thang_dao',
        world: 'than_gioi',
        color: 'blue',
        text: 'text-blue-500',
        gradient: 'from-blue-500 to-cyan-600',
        icon: '/assets/icons/realms/realm_divine_emperor.png',
        perks: ['Thần Đế Chi Tôn', 'Thống Lĩnh Thần Tộc', '+180% Tu Vi']
    },
    {
        level: 17,
        id: 'sieu_than',
        name: 'Siêu Thần',
        title: 'Siêu Thần Cảnh',
        description: 'Siêu việt Thần Linh, chạm đến Đại Đạo',
        minTuVi: 2000000000,
        maxTuVi: 4999999999,
        tribulation: 'nhap_dao_kiep',
        world: 'than_gioi',
        color: 'cyan',
        text: 'text-cyan-500',
        gradient: 'from-cyan-500 to-teal-600',
        icon: '/assets/icons/realms/realm_transcendent.png',
        perks: ['PHI THĂNG ĐẠO GIỚI 🔮', 'Siêu Việt Thần Linh', '+200% Tu Vi']
    },

    // ========== ĐẠO GIỚI (Levels 18-22) ==========
    {
        level: 18,
        id: 'chi_ton',
        name: 'Chí Tôn',
        title: 'Chí Tôn Cảnh',
        description: 'Chí tôn vô thượng, bắt đầu lĩnh ngộ Đạo',
        minTuVi: 5000000000,
        maxTuVi: 14999999999,
        tribulation: 'cam_ky_kiep',
        world: 'dao_gioi',
        color: 'rose',
        text: 'text-rose-600',
        gradient: 'from-rose-500 to-pink-600',
        icon: '/assets/icons/realms/realm_dao.png',
        perks: ['Chí Tôn Thể', 'Lĩnh Ngộ Sơ Bộ', '+250% Tu Vi']
    },
    {
        level: 19,
        id: 'dao_canh',
        name: 'Đạo Cảnh',
        title: 'Đạo Cảnh',
        description: 'Chính thức bước vào Đạo Cảnh, dung hợp Đạo Tắc',
        minTuVi: 15000000000,
        maxTuVi: 34999999999,
        tribulation: 'dai_dao_kiep',
        world: 'dao_gioi',
        color: 'pink',
        text: 'text-pink-600',
        gradient: 'from-pink-500 to-red-600',
        icon: '/assets/icons/realms/realm_forbidden.png',
        perks: ['Đạo Tắc Chi Lực', 'Cấm Kỵ Chi Thân', '+300% Tu Vi']
    },
    {
        level: 20,
        id: 'dai_dao',
        name: 'Đại Đạo',
        title: 'Đại Đạo Cảnh',
        description: 'Đại Đạo viên mãn, Hộ Pháp cấp bậc',
        minTuVi: 35000000000,
        maxTuVi: 99999999999,
        tribulation: 'thien_dao_kiep',
        world: 'dao_gioi',
        color: 'red',
        text: 'text-red-600',
        gradient: 'from-red-500 to-orange-600',
        icon: '/assets/icons/realms/realm_primordial.png',
        perks: ['Đại Đạo Thể', 'Hộ Pháp Chi Uy', '+400% Tu Vi']
    },
    {
        level: 21,
        id: 'thien_dao',
        name: 'Thiên Đạo',
        title: 'Thiên Đạo Cảnh',
        description: 'Nắm giữ Thiên Đạo, Trưởng Lão cấp bậc',
        minTuVi: 100000000000,
        maxTuVi: 499999999999,
        tribulation: 'than_dao_kiep',
        world: 'dao_gioi',
        color: 'slate',
        text: 'text-slate-400',
        gradient: 'from-slate-600 to-gray-800',
        icon: '/assets/icons/realms/realm_ultimate.png',
        perks: ['Thiên Đạo Chi Lực', 'Trưởng Lão Chi Quyền', '+500% Tu Vi']
    },
    {
        level: 22,
        id: 'than_dao',
        name: 'Thần Đạo',
        title: 'Thần Đạo Cảnh',
        description: 'Thần Đạo chí tôn, Đạo Chủ cấp bậc',
        minTuVi: 500000000000,
        maxTuVi: Infinity,
        tribulation: null,
        world: 'dao_gioi',
        color: 'white',
        text: 'text-white',
        gradient: 'from-gray-900 to-black',
        icon: '/assets/icons/realms/realm_hegemon.png',
        perks: ['Thần Đạo Chi Chủ', 'Bất Tử Bất Diệt', '∞ Tu Vi']
    },
];


// Legacy compatibility: CULTIVATION_LEVELS for existing code
export interface CultivationLevel {
    level: number;
    name: string;
    title: string;
    min: number;
    max: number;
    color: string;
    text: string;
    gradient: string;
}

export const CULTIVATION_LEVELS: CultivationLevel[] = CULTIVATION_REALMS.map(realm => ({
    level: realm.level,
    name: realm.name,
    title: realm.title,
    min: realm.minTuVi,
    max: realm.maxTuVi,
    color: realm.color,
    text: realm.text,
    gradient: realm.gradient,
}));

// Extended cultivation info
export interface CultivationInfo {
    // Realm info
    realm: CultivationRealm;
    // Sub-stage info
    subStage: SubStage;
    subStageName: string;
    // Progress
    progress: number;
    progressInSubStage: number;
    // Full display
    fullTitle: string;
    // Next level
    nextRealm: CultivationRealm | null;
    nextRealmPoints: number;
    // Legacy compatibility
    level: number;
    name: string;
    title: string;
    min: number;
    max: number;
    color: string;
    text: string;
    gradient: string;
    nextLevel: CultivationLevel | null;
    nextLevelPoints: number;
}

/**
 * Calculate sub-stage from progress percentage
 */
export const getSubStage = (progress: number): SubStage => {
    if (progress >= 75) return 'vien_man';
    if (progress >= 50) return 'hau_ky';
    if (progress >= 25) return 'trung_ky';
    return 'so_ky';
};

/**
 * Get cultivation info from Tu Vi points
 */
export const getCultivationInfo = (tuVi: number): CultivationInfo => {
    const points = Math.max(0, tuVi || 0);

    // Find current realm
    let realm = CULTIVATION_REALMS[0];
    for (let i = CULTIVATION_REALMS.length - 1; i >= 0; i--) {
        if (points >= CULTIVATION_REALMS[i].minTuVi) {
            realm = CULTIVATION_REALMS[i];
            break;
        }
    }

    // Calculate progress within realm
    const realmRange = realm.maxTuVi - realm.minTuVi;
    const pointsInRealm = points - realm.minTuVi;
    const progress = realmRange > 0 && realmRange !== Infinity
        ? Math.min(100, (pointsInRealm / realmRange) * 100)
        : (realm.level === 8 ? 100 : 0);

    // Calculate sub-stage
    const subStage = getSubStage(progress);
    const subStageName = SUB_STAGE_NAMES[subStage];

    // Calculate progress within sub-stage
    const subStageStart = SUB_STAGE_PROGRESS[subStage];
    const subStageEnd = subStage === 'vien_man' ? 100 : subStageStart + 25;
    const progressInSubStage = ((progress - subStageStart) / (subStageEnd - subStageStart)) * 100;

    // Next realm
    const nextRealm = CULTIVATION_REALMS[realm.level + 1] || null;
    const nextRealmPoints = nextRealm?.minTuVi || realm.maxTuVi;

    // Full title
    const fullTitle = realm.level === 0 ? realm.title : `${realm.name} ${subStageName}`;

    // Legacy compatibility
    const legacyLevel = CULTIVATION_LEVELS.find(l => l.level === realm.level) || CULTIVATION_LEVELS[0];
    const nextLegacyLevel = CULTIVATION_LEVELS.find(l => l.level === realm.level + 1) || null;

    return {
        realm,
        subStage,
        subStageName,
        progress,
        progressInSubStage: Math.min(100, Math.max(0, progressInSubStage)),
        fullTitle,
        nextRealm,
        nextRealmPoints,
        // Legacy
        level: legacyLevel.level,
        name: legacyLevel.name,
        title: legacyLevel.title,
        min: legacyLevel.min,
        max: legacyLevel.max,
        color: legacyLevel.color,
        text: legacyLevel.text,
        gradient: legacyLevel.gradient,
        nextLevel: nextLegacyLevel,
        nextLevelPoints: nextLegacyLevel?.min || legacyLevel.max,
    };
};

/**
 * Get points needed for next realm
 */
export const getPointsToNextLevel = (tuVi: number): number => {
    const info = getCultivationInfo(tuVi);
    return Math.max(0, info.nextRealmPoints - tuVi);
};

/**
 * Get points needed for next sub-stage
 */
export const getPointsToNextSubStage = (tuVi: number): number => {
    const info = getCultivationInfo(tuVi);
    const { realm, subStage } = info;

    if (subStage === 'vien_man') {
        // Need to break through to next realm
        return getPointsToNextLevel(tuVi);
    }

    const realmRange = realm.maxTuVi - realm.minTuVi;
    const nextSubStageProgress = SUB_STAGE_PROGRESS[subStage] + 25;
    const nextSubStagePoints = realm.minTuVi + (realmRange * nextSubStageProgress / 100);

    return Math.max(0, Math.ceil(nextSubStagePoints - tuVi));
};

/**
 * Check if points qualify for realm up
 */
export const isLevelUpPoint = (tuVi: number): boolean => {
    return CULTIVATION_REALMS.some(realm => realm.minTuVi === tuVi);
};

/**
 * Get tribulation info for current realm
 */
export const getTribulationForRealm = (realmLevel: number): TribulationInfo | null => {
    const realm = CULTIVATION_REALMS.find(r => r.level === realmLevel);
    if (!realm?.tribulation) return null;
    return TRIBULATIONS.find(t => t.id === realm.tribulation) || null;
};

/**
 * Calculate Tu Vi bonus based on Linh Căn and music genre
 */
export const calculateLinhCanBonus = (linhCanList: LinhCan[], musicGenre: string): number => {
    let bonus = 0;

    for (const linhCanId of linhCanList) {
        const linhCan = LINH_CAN_TABLE.find(l => l.id === linhCanId);
        if (!linhCan) continue;

        if (linhCan.musicGenres.includes('ALL') || linhCan.musicGenres.includes(musicGenre)) {
            bonus += linhCan.buffPercent;
        }
    }

    return bonus;
};

/**
 * Format Tu Vi with Vietnamese units
 */
export const formatTuVi = (tuVi: number): string => {
    if (tuVi >= 1000000000) return `${(tuVi / 1000000000).toFixed(1)}B`;
    if (tuVi >= 1000000) return `${(tuVi / 1000000).toFixed(1)}M`;
    if (tuVi >= 1000) return `${(tuVi / 1000).toFixed(1)}K`;
    return tuVi.toLocaleString('vi-VN');
};

// ========== MULTI-WORLD UTILITY FUNCTIONS ==========

/**
 * Get the current world based on realm level
 */
export const getCurrentWorld = (realmLevel: number): WorldInfo => {
    for (let i = CULTIVATION_WORLDS.length - 1; i >= 0; i--) {
        const world = CULTIVATION_WORLDS[i];
        if (realmLevel >= world.minLevel) {
            return world;
        }
    }
    return CULTIVATION_WORLDS[0];
};

/**
 * Get realms belonging to a specific world
 */
export const getRealmsForWorld = (worldId: CultivationWorld): CultivationRealm[] => {
    return CULTIVATION_REALMS.filter(realm => realm.world === worldId);
};

/**
 * Check if a world is unlocked based on current realm level
 */
export const isWorldUnlocked = (worldId: CultivationWorld, currentLevel: number): boolean => {
    const world = CULTIVATION_WORLDS.find(w => w.id === worldId);
    if (!world) return false;
    return currentLevel >= world.unlockLevel;
};

/**
 * Get visible realms for current user (only shows current world + unlocked worlds)
 */
export const getVisibleRealms = (currentLevel: number): CultivationRealm[] => {
    const currentWorld = getCurrentWorld(currentLevel);

    // Get all realms from current world and previously unlocked worlds
    return CULTIVATION_REALMS.filter(realm => {
        const realmWorld = CULTIVATION_WORLDS.find(w => w.id === realm.world);
        if (!realmWorld) return false;

        // Show if it's the current world or a previous world (already unlocked)
        return realmWorld.minLevel <= currentWorld.maxLevel;
    });
};

/**
 * Get hidden worlds (worlds not yet unlocked)
 */
export const getHiddenWorlds = (currentLevel: number): WorldInfo[] => {
    return CULTIVATION_WORLDS.filter(world => !isWorldUnlocked(world.id, currentLevel) && world.isHidden);
};

/**
 * Check if user can phi thăng (ascend) to next world
 */
export const canAscendToNextWorld = (tuVi: number): { canAscend: boolean; nextWorld: WorldInfo | null } => {
    const info = getCultivationInfo(tuVi);
    const currentWorld = getCurrentWorld(info.realm.level);

    // Check if at max realm of current world and at Viên Mãn stage
    const isMaxRealmOfWorld = info.realm.level === currentWorld.maxLevel;
    const isVienMan = info.subStage === 'vien_man';

    // Find next world
    const worldIndex = CULTIVATION_WORLDS.findIndex(w => w.id === currentWorld.id);
    const nextWorld = CULTIVATION_WORLDS[worldIndex + 1] || null;

    return {
        canAscend: isMaxRealmOfWorld && isVienMan && nextWorld !== null,
        nextWorld
    };
};
