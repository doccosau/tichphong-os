/**
 * Loot & Cultivation Utilities
 */
import { LootItem } from "../../modules/music/stores/library";

export interface LootDefinition {
    itemId: string;
    name: string;
    type: 'material' | 'consumable' | 'collectible' | 'artifact' | 'pill';
    rarity: LootItem['rarity'];
    description?: string;
    dropRate: number; // 0.0 - 1.0 (e.g., 0.05 = 5%)
    effect?: string; // Description of effect
    icon?: string; // Emoji or Lucide icon name
    minLevel?: number; // Minimum cultivation level required (default: 0)
    maxLevel?: number; // Maximum cultivation level (default: Infinity)
    xpValue?: number; // Tu Vi bonus when consumed (for pills)
}

export const LOOT_TABLE: LootDefinition[] = [
    // ========== PHÀM GIỚI ITEMS (Level 0-8) ==========
    // Materials - Common
    {
        itemId: 'spirit_stone_low',
        name: 'Hạ Phẩm Linh Thạch',
        type: 'material',
        rarity: 'common',
        dropRate: 0.15,
        description: 'Đá chứa linh khí ít ỏi, dùng để trao đổi.',
        icon: '/assets/items/spirit_stone_low.png',
        minLevel: 0, maxLevel: 8
    },
    {
        itemId: 'herb_common',
        name: 'Linh Thảo',
        type: 'material',
        rarity: 'common',
        dropRate: 0.12,
        description: 'Thảo dược cơ bản để luyện đan.',
        icon: '/assets/items/herb_common.png',
        minLevel: 0, maxLevel: 8
    },
    {
        itemId: 'luyen_khi_phu',
        name: 'Luyện Khí Phù',
        type: 'material',
        rarity: 'common',
        dropRate: 0.10,
        description: 'Phù văn dẫn khí, hỗ trợ tu luyện giai đoạn đầu.',
        icon: '/assets/items/luyen_khi_phu.png',
        minLevel: 1, maxLevel: 8
    },
    {
        itemId: 'truc_co_lenh',
        name: 'Trúc Cơ Lệnh',
        type: 'material',
        rarity: 'rare',
        dropRate: 0.03,
        description: 'Lệnh bài môn phái, chứng nhận Trúc Cơ kỳ.',
        icon: '/assets/items/truc_co_lenh.png',
        minLevel: 2, maxLevel: 8
    },
    // Materials - Rare
    {
        itemId: 'herb_rare',
        name: 'Huyết Sâm',
        type: 'material',
        rarity: 'rare',
        dropRate: 0.04,
        description: 'Sâm ngàn năm, đại bổ nguyên khí.',
        icon: '/assets/items/herb_rare.png',
        minLevel: 0, maxLevel: 8
    },
    {
        itemId: 'spirit_stone_mid',
        name: 'Trung Phẩm Linh Thạch',
        type: 'material',
        rarity: 'rare',
        dropRate: 0.05,
        description: 'Đá chứa linh khí dồi dào, vật phẩm quý.',
        icon: '/assets/items/spirit_stone_mid.png',
        minLevel: 2, maxLevel: 8
    },
    {
        itemId: 'ngung_dan_thach',
        name: 'Ngưng Đan Thạch',
        type: 'material',
        rarity: 'rare',
        dropRate: 0.025,
        description: 'Đá ngưng tụ linh lực, hỗ trợ kết kim đan.',
        icon: '/assets/items/ngung_dan_thach.png',
        minLevel: 3, maxLevel: 8
    },
    // Artifacts - Phàm Giới
    {
        itemId: 'sword_wooden',
        name: 'Mộc Kiếm',
        type: 'artifact',
        rarity: 'common',
        dropRate: 0.01,
        description: 'Kiếm gỗ đào, tăng nhẹ linh khí khi nghe nhạc.',
        effect: '+1 XP/bài',
        icon: '/assets/items/sword_wooden.png',
        minLevel: 0, maxLevel: 8
    },
    {
        itemId: 'nguyen_anh_tinh',
        name: 'Nguyên Anh Tinh',
        type: 'material',
        rarity: 'epic',
        dropRate: 0.01,
        description: 'Tinh hoa Nguyên Anh, cực kỳ quý hiếm.',
        icon: '/assets/items/nguyen_anh_tinh.png',
        minLevel: 4, maxLevel: 8
    },
    {
        itemId: 'hu_khong_phien',
        name: 'Hư Không Phiến',
        type: 'artifact',
        rarity: 'epic',
        dropRate: 0.003,
        description: 'Mảnh không gian hư vô, tăng tỉ lệ kỳ ngộ.',
        effect: '+5% drop rate',
        icon: '/assets/items/hu_khong_phien.png',
        minLevel: 6, maxLevel: 8
    },
    {
        itemId: 'bell_soul',
        name: 'Chiêu Hồn Linh',
        type: 'artifact',
        rarity: 'epic',
        dropRate: 0.002,
        description: 'Lục lạc gọi hồn, tăng tỉ lệ gặp Kỳ Ngộ.',
        effect: '+2% drop rate',
        icon: '/assets/items/bell_soul.png',
        minLevel: 0, maxLevel: 8
    },
    // Collectibles
    {
        itemId: 'scroll_fragment_1',
        name: 'Mảnh Tàn Quyển',
        type: 'collectible',
        rarity: 'rare',
        dropRate: 0.02,
        description: 'Một mảnh của bí kíp thất truyền.',
        icon: '/assets/items/scroll_fragment_1.png',
        minLevel: 0, maxLevel: 8
    },
    {
        itemId: 'can_khon_dai',
        name: 'Túi Càn Khôn',
        type: 'artifact',
        rarity: 'rare',
        dropRate: 0.008,
        description: 'Túi không gian nhỏ, chứa được 10 vật.',
        effect: 'Inventory +10',
        icon: '/assets/items/can_khon_dai.png',
        minLevel: 2, maxLevel: 8
    },
    // Consumables & Pills - Phàm Giới
    {
        itemId: 'mystery_box',
        name: 'Rương Kỳ Bí',
        type: 'consumable',
        rarity: 'epic',
        dropRate: 0.005,
        description: 'Mở ra để nhận vật phẩm ngẫu nhiên.',
        icon: '/assets/items/mystery_box.png',
        minLevel: 0, maxLevel: 8
    },
    {
        itemId: 'spirit_fruit',
        name: 'Linh Quả',
        type: 'consumable',
        rarity: 'common',
        dropRate: 0.08,
        description: 'Thức ăn yêu thích của Linh Thú.',
        icon: '/assets/items/food_spirit_fruit.png',
        minLevel: 0, maxLevel: 8
    },
    {
        itemId: 'spirit_meat',
        name: 'Linh Thú Nhục',
        type: 'consumable',
        rarity: 'rare',
        dropRate: 0.03,
        description: 'Thịt linh thú, đại bổ cho thú cưng.',
        icon: '/assets/items/food_spirit_meat.png',
        minLevel: 0, maxLevel: 8
    },
    {
        itemId: 'bo_nguyen_dan',
        name: 'Bồi Nguyên Đan',
        type: 'pill',
        rarity: 'common',
        dropRate: 0.06,
        description: 'Đan dược cơ bản, phục hồi linh lực.',
        effect: '+20 Tu Vi',
        icon: '/assets/items/bo_nguyen_dan.png',
        minLevel: 0, maxLevel: 8,
        xpValue: 20
    },
    {
        itemId: 'tu_khi_dan',
        name: 'Tụ Khí Đan',
        type: 'pill',
        rarity: 'rare',
        dropRate: 0.02,
        description: 'Tăng tốc hấp thu linh khí.',
        effect: '+50 Tu Vi',
        icon: '/assets/items/tu_khi_dan.png',
        minLevel: 1, maxLevel: 8,
        xpValue: 50
    },
    // Alchemy Pills (crafted items)
    {
        itemId: 'pill_xp_small',
        name: 'Tụ Khí Đan',
        type: 'pill',
        rarity: 'common',
        dropRate: 0,
        description: 'Dùng để tăng 50 điểm Tu Vi.',
        effect: '+50 Tu Vi',
        icon: '/assets/items/pill_xp_small.png',
        minLevel: 0, maxLevel: 8,
        xpValue: 50
    },
    {
        itemId: 'pill_luck_small',
        name: 'Vận Khí Đan',
        type: 'pill',
        rarity: 'rare',
        dropRate: 0,
        description: 'Tăng tỉ lệ rơi đồ.',
        effect: '+5% drop rate 1h',
        icon: '/assets/items/pill_luck_small.png',
        minLevel: 1, maxLevel: 8
    },

    // ========== TIÊN GIỚI ITEMS (Level 9-13) ==========
    {
        itemId: 'tien_linh_thach',
        name: 'Tiên Linh Thạch',
        type: 'material',
        rarity: 'rare',
        dropRate: 0.08,
        description: 'Linh thạch cấp Tiên, chứa tiên khí thuần túy.',
        icon: '/assets/items/tien_linh_thach.png',
        minLevel: 9, maxLevel: 13
    },
    {
        itemId: 'tien_thao',
        name: 'Tiên Thảo',
        type: 'material',
        rarity: 'rare',
        dropRate: 0.06,
        description: 'Thảo dược Tiên Giới, ngàn năm mới nở.',
        icon: '/assets/items/tien_thao.png',
        minLevel: 9, maxLevel: 13
    },
    {
        itemId: 'linh_gioi_chau',
        name: 'Linh Giới Châu',
        type: 'artifact',
        rarity: 'epic',
        dropRate: 0.008,
        description: 'Tứ Linh Vệ Hồn - bảo vật hộ mệnh.',
        effect: '+3 XP/bài, Hộ Thể',
        icon: '/assets/items/linh_gioi_chau.png',
        minLevel: 9, maxLevel: 13
    },
    {
        itemId: 'tien_kiem_phu',
        name: 'Tiên Kiếm Phù',
        type: 'artifact',
        rarity: 'rare',
        dropRate: 0.01,
        description: 'Phù văn tiên kiếm, tăng phi kiếm tốc độ.',
        effect: '+2 XP/bài',
        icon: '/assets/items/tien_kiem_phu.png',
        minLevel: 9, maxLevel: 11
    },
    {
        itemId: 'kim_tien_lo',
        name: 'Kim Tiên Lộ',
        type: 'consumable',
        rarity: 'epic',
        dropRate: 0.005,
        description: 'Giọt sương Kim Tiên, buff Tu Vi 30%.',
        effect: '+30% Tu Vi 1 giờ',
        icon: '/assets/items/kim_tien_lo.png',
        minLevel: 10, maxLevel: 13
    },
    {
        itemId: 'thai_at_loi_chau',
        name: 'Thái Ất Lôi Châu',
        type: 'artifact',
        rarity: 'legendary',
        dropRate: 0.001,
        description: 'Châu ngọc chứa Thái Ất thần lôi.',
        effect: '+10% drop rate',
        icon: '/assets/items/thai_at_loi_chau.png',
        minLevel: 11, maxLevel: 13
    },
    {
        itemId: 'niet_ban_linh_thuy',
        name: 'Niết Bàn Linh Thủy',
        type: 'consumable',
        rarity: 'legendary',
        dropRate: 0.0008,
        description: 'Nước thiên địa, tái sinh từ tro tàn.',
        effect: 'Phục hồi hoàn toàn',
        icon: '/assets/items/niet_ban_linh_thuy.png',
        minLevel: 9, maxLevel: 13
    },
    {
        itemId: 'ma_niem_dan',
        name: 'Ma Niệm Đan',
        type: 'pill',
        rarity: 'epic',
        dropRate: 0.003,
        description: 'Đan dược trấn áp tâm ma, vững cảnh giới.',
        effect: '+500.000 Tu Vi',
        icon: '/assets/items/ma_niem_dan.png',
        minLevel: 9, maxLevel: 13,
        xpValue: 500000
    },
    {
        itemId: 'tien_vuong_lenh',
        name: 'Tiên Vương Lệnh',
        type: 'collectible',
        rarity: 'legendary',
        dropRate: 0.0005,
        description: 'Lệnh bài Tiên Vương, uy áp bát phương.',
        icon: '/assets/items/tien_vuong_lenh.png',
        minLevel: 12, maxLevel: 13
    },
    {
        itemId: 'dragon_pill',
        name: 'Long Đan',
        type: 'pill',
        rarity: 'epic',
        dropRate: 0.001,
        description: 'Kết tinh của Rồng, tăng mạnh Tu Vi cho thú.',
        icon: '/assets/items/food_dragon_pill.png',
        minLevel: 9, maxLevel: 13
    },

    // ========== THẦN GIỚI ITEMS (Level 14-17) ==========
    {
        itemId: 'than_linh_thach',
        name: 'Thần Linh Thạch',
        type: 'material',
        rarity: 'epic',
        dropRate: 0.05,
        description: 'Linh thạch cấp Thần, chứa thần lực.',
        icon: '/assets/items/than_linh_thach.png',
        minLevel: 14, maxLevel: 17
    },
    {
        itemId: 'than_gioi_thao',
        name: 'Thần Giới Thảo Dược',
        type: 'material',
        rarity: 'epic',
        dropRate: 0.04,
        description: 'Thảo dược Thần Giới, vạn năm tinh hoa.',
        icon: '/assets/items/than_gioi_thao.png',
        minLevel: 14, maxLevel: 17
    },
    {
        itemId: 'than_vuong_lenh',
        name: 'Thần Vương Lệnh',
        type: 'artifact',
        rarity: 'epic',
        dropRate: 0.003,
        description: 'Lệnh bài Thần Vương, thống lĩnh một phương.',
        effect: '+3 XP/bài',
        icon: '/assets/items/than_vuong_lenh.png',
        minLevel: 15, maxLevel: 17
    },
    {
        itemId: 'than_de_an',
        name: 'Thần Đế Ấn',
        type: 'artifact',
        rarity: 'legendary',
        dropRate: 0.0005,
        description: 'Ấn tín Thần Đế, chí tôn thần linh.',
        effect: '+15% drop rate, +5 XP/bài',
        icon: '/assets/items/than_de_an.png',
        minLevel: 16, maxLevel: 17
    },
    {
        itemId: 'diem_tam_dinh',
        name: 'Diễm Tâm Đỉnh',
        type: 'artifact',
        rarity: 'legendary',
        dropRate: 0.0003,
        description: 'Lò luyện đan thượng cổ, tăng tỉ lệ luyện đan.',
        effect: '+50% alchemy success',
        icon: '/assets/items/diem_tam_dinh.png',
        minLevel: 14, maxLevel: 17
    },
    {
        itemId: 'di_hoa_hoa_hon',
        name: 'Dị Hỏa - Hỏa Hồn',
        type: 'collectible',
        rarity: 'legendary',
        dropRate: 0.0002,
        description: 'Ngọn lửa dị thường từ Dị Hỏa Bảng.',
        icon: '/assets/items/di_hoa_hoa_hon.png',
        minLevel: 14, maxLevel: 17
    },
    {
        itemId: 'than_luc_dan',
        name: 'Thần Lực Đan',
        type: 'pill',
        rarity: 'legendary',
        dropRate: 0.001,
        description: 'Đan dược cấp Thần, bùng nổ thần lực.',
        effect: '+25.000.000 Tu Vi',
        icon: '/assets/items/than_luc_dan.png',
        minLevel: 14, maxLevel: 17,
        xpValue: 25000000
    },

    // ========== ĐẠO GIỚI ITEMS (Level 18-22) ==========
    {
        itemId: 'dao_van',
        name: 'Đạo Vân',
        type: 'material',
        rarity: 'legendary',
        dropRate: 0.03,
        description: 'Linh vân của Đạo, chứa Đạo Tắc nguyên thủy.',
        icon: '/assets/items/dao_van.png',
        minLevel: 18, maxLevel: 22
    },
    {
        itemId: 'hong_mong_tinh_khi',
        name: 'Hồng Mông Tinh Khí',
        type: 'material',
        rarity: 'legendary',
        dropRate: 0.02,
        description: 'Tinh khí nguyên thủy từ thuở hồng hoang.',
        icon: '/assets/items/hong_mong_tinh_khi.png',
        minLevel: 18, maxLevel: 22
    },
    {
        itemId: 'thien_dao_phien',
        name: 'Thiên Đạo Phiến',
        type: 'artifact',
        rarity: 'legendary',
        dropRate: 0.0002,
        description: 'Mảnh của Thiên Đạo, chứa quy tắc vũ trụ.',
        effect: '+5 XP/bài, +10% drop',
        icon: '/assets/items/thien_dao_phien.png',
        minLevel: 20, maxLevel: 22
    },
    {
        itemId: 'than_dao_nhat_mao',
        name: 'Thần Đạo Nhất Mão',
        type: 'artifact',
        rarity: 'legendary',
        dropRate: 0.0001,
        description: 'Chỉ dành cho Thần Đạo Cảnh, bất tử bất diệt.',
        effect: '+20% tất cả bonus',
        icon: '/assets/items/than_dao_nhat_mao.png',
        minLevel: 22, maxLevel: 22
    },
    {
        itemId: 'cam_ky_chi_luc',
        name: 'Cấm Kỵ Chi Lực',
        type: 'consumable',
        rarity: 'legendary',
        dropRate: 0.001,
        description: 'Sức mạnh cấm kỵ, phạm vào Thiên Cấm.',
        effect: '+1000 XP',
        icon: '/assets/items/cam_ky_chi_luc.png',
        minLevel: 18, maxLevel: 22
    },
    {
        itemId: 'divine_nectar',
        name: 'Thần Lộ',
        type: 'consumable',
        rarity: 'legendary',
        dropRate: 0.0005,
        description: 'Giọt sương thần, tẩy tủy phạt mao.',
        icon: '/assets/items/food_divine_nectar.png',
        minLevel: 18, maxLevel: 22
    },
    {
        itemId: 'dao_chu_an',
        name: 'Đạo Chủ Ấn',
        type: 'artifact',
        rarity: 'legendary',
        dropRate: 0.00005,
        description: 'Ấn tín Đạo Chủ, chí tôn vũ trụ.',
        effect: '+50% tất cả bonus',
        icon: '/assets/items/dao_chu_an.png',
        minLevel: 22, maxLevel: 22
    },

    // ========== THIÊN TÀI ĐỊA BẢO - THẦN THỤ (Divine Trees) ==========
    // Phàm Giới Thần Thụ
    {
        itemId: 'linh_moc_chi',
        name: 'Linh Mộc Chi',
        type: 'material',
        rarity: 'rare',
        dropRate: 0.015,
        description: 'Cành cây linh mộc, chứa linh khí thuần túy.',
        icon: '/assets/items/linh_moc_chi.png',
        minLevel: 2, maxLevel: 8
    },
    {
        itemId: 'thanh_moc_tam',
        name: 'Thanh Mộc Tâm',
        type: 'material',
        rarity: 'epic',
        dropRate: 0.005,
        description: 'Lõi cây Thanh Mộc ngàn năm, đại bổ linh lực.',
        icon: '/assets/items/thanh_moc_tam.png',
        minLevel: 4, maxLevel: 8
    },
    // Tiên Giới Thần Thụ
    {
        itemId: 'ban_dao_qua',
        name: 'Bàn Đào Quả',
        type: 'consumable',
        rarity: 'legendary',
        dropRate: 0.0008,
        description: 'Quả đào từ Bàn Đào Thụ của Tây Vương Mẫu, ăn được trường sinh.',
        effect: '+500 XP, +10% Tu Vi vĩnh viễn',
        icon: '/assets/items/ban_dao_qua.png',
        minLevel: 9, maxLevel: 13
    },
    {
        itemId: 'ban_dao_chi',
        name: 'Bàn Đào Chi',
        type: 'material',
        rarity: 'epic',
        dropRate: 0.003,
        description: 'Cành cây Bàn Đào, có thể dùng luyện Tiên Khí.',
        icon: '/assets/items/ban_dao_chi.png',
        minLevel: 9, maxLevel: 13
    },
    {
        itemId: 'kien_moc_tam',
        name: 'Kiến Mộc Tâm',
        type: 'artifact',
        rarity: 'legendary',
        dropRate: 0.0005,
        description: 'Lõi cây Kiến Mộc (Thế Giới Thụ), nối liền chín tầng trời.',
        effect: '+5 XP/bài, Không Gian +50',
        icon: '/assets/items/kien_moc_tam.png',
        minLevel: 10, maxLevel: 13
    },
    // Thần Giới Thần Thụ
    {
        itemId: 'luan_hoi_qua',
        name: 'Luân Hồi Quả',
        type: 'consumable',
        rarity: 'legendary',
        dropRate: 0.0003,
        description: 'Quả từ Luân Hồi Thụ, chứa ký ức vạn kiếp.',
        effect: '+1000 XP, Tái Sinh 1 lần',
        icon: '/assets/items/luan_hoi_qua.png',
        minLevel: 14, maxLevel: 17
    },
    {
        itemId: 'luan_hoi_chi',
        name: 'Luân Hồi Chi',
        type: 'material',
        rarity: 'legendary',
        dropRate: 0.001,
        description: 'Cành cây Luân Hồi Thụ, xuyên qua sinh tử.',
        icon: '/assets/items/luan_hoi_chi.png',
        minLevel: 14, maxLevel: 17
    },
    {
        itemId: 'bo_de_ye',
        name: 'Bồ Đề Diệp',
        type: 'material',
        rarity: 'epic',
        dropRate: 0.002,
        description: 'Lá cây Bồ Đề thần thánh, giác ngộ tâm linh.',
        icon: '/assets/items/bo_de_ye.png',
        minLevel: 14, maxLevel: 17
    },
    {
        itemId: 'bat_giac_moc',
        name: 'Bát Giác Mộc',
        type: 'artifact',
        rarity: 'legendary',
        dropRate: 0.0004,
        description: 'Gỗ từ cây Bát Giác thần thụ, tám phương quy phục.',
        effect: '+8% tất cả bonus',
        icon: '/assets/items/bat_giac_moc.png',
        minLevel: 15, maxLevel: 17
    },
    // Đạo Giới Thần Thụ
    {
        itemId: 'the_gioi_thu_tam',
        name: 'Thế Giới Thụ Tâm',
        type: 'artifact',
        rarity: 'legendary',
        dropRate: 0.0001,
        description: 'Lõi cây Thế Giới Thụ, chứa nguồn gốc vạn vật.',
        effect: '+15 XP/bài, Thế Giới Chủ',
        icon: '/assets/items/the_gioi_thu_tam.png',
        minLevel: 18, maxLevel: 22
    },
    {
        itemId: 'hong_mong_moc',
        name: 'Hồng Mông Linh Mộc',
        type: 'material',
        rarity: 'legendary',
        dropRate: 0.0008,
        description: 'Gỗ từ thời hồng hoang, tồn tại trước thiên địa.',
        icon: '/assets/items/hong_mong_moc.png',
        minLevel: 18, maxLevel: 22
    },
    {
        itemId: 'thien_dao_thu_qua',
        name: 'Thiên Đạo Thụ Quả',
        type: 'consumable',
        rarity: 'legendary',
        dropRate: 0.00005,
        description: 'Quả từ cây Thiên Đạo, lĩnh ngộ Đạo Tắc tối cao.',
        effect: '+5000 XP, Đạo Quả Viên Mãn',
        icon: '/assets/items/thien_dao_thu_qua.png',
        minLevel: 20, maxLevel: 22
    },
    {
        itemId: 'can_khon_shu_zhi',
        name: 'Càn Khôn Thụ Chi',
        type: 'artifact',
        rarity: 'legendary',
        dropRate: 0.00008,
        description: 'Cành Càn Khôn Thụ, nắm giữ Càn Khôn trong tay.',
        effect: '+30% tất cả bonus, Không Gian ∞',
        icon: '/assets/items/can_khon_shu_zhi.png',
        minLevel: 21, maxLevel: 22
    },

    // ========== MỆNH THIÊN NGUYÊN CHỦNG (Fate Heaven Origin Seeds) ==========
    // Phàm Giới Nguyên Chủng
    {
        itemId: 'moc_linh_chung',
        name: 'Mộc Linh Chủng',
        type: 'material',
        rarity: 'rare',
        dropRate: 0.008,
        description: 'Hạt giống cây linh mộc, có thể trồng thành linh thụ.',
        icon: '/assets/items/moc_linh_chung.png',
        minLevel: 3, maxLevel: 8
    },
    {
        itemId: 'hoa_linh_chung',
        name: 'Hỏa Linh Chủng',
        type: 'material',
        rarity: 'rare',
        dropRate: 0.006,
        description: 'Hạt giống chứa hỏa linh, nảy mầm bằng hỏa lực.',
        icon: '/assets/items/hoa_linh_chung.png',
        minLevel: 4, maxLevel: 8
    },
    {
        itemId: 'thuy_linh_chung',
        name: 'Thủy Linh Chủng',
        type: 'material',
        rarity: 'rare',
        dropRate: 0.006,
        description: 'Hạt giống thủy linh, sinh trưởng dưới nước.',
        icon: '/assets/items/thuy_linh_chung.png',
        minLevel: 4, maxLevel: 8
    },
    // Tiên Giới Nguyên Chủng
    {
        itemId: 'tien_linh_chung',
        name: 'Tiên Linh Chủng',
        type: 'material',
        rarity: 'epic',
        dropRate: 0.003,
        description: 'Hạt giống từ Tiên Giới, chứa tiên khí nguyên thủy.',
        icon: '/assets/items/tien_linh_chung.png',
        minLevel: 9, maxLevel: 13
    },
    {
        itemId: 'phuong_hoang_hoa_chung',
        name: 'Phượng Hoàng Hỏa Chủng',
        type: 'collectible',
        rarity: 'legendary',
        dropRate: 0.0006,
        description: 'Hạt giống từ lửa Phượng Hoàng, tái sinh bất tử.',
        effect: 'Tái Sinh 1 lần',
        icon: '/assets/items/phuong_hoang_hoa_chung.png',
        minLevel: 10, maxLevel: 13
    },
    {
        itemId: 'ban_dao_hat',
        name: 'Bàn Đào Hạt',
        type: 'collectible',
        rarity: 'legendary',
        dropRate: 0.0004,
        description: 'Hạt từ Bàn Đào Thụ, có thể trồng thành cây tiên.',
        effect: 'Gieo trồng Bàn Đào',
        icon: '/assets/items/ban_dao_hat.png',
        minLevel: 11, maxLevel: 13
    },
    // Thần Giới Nguyên Chủng
    {
        itemId: 'long_huyet_chung',
        name: 'Long Huyết Chủng',
        type: 'collectible',
        rarity: 'legendary',
        dropRate: 0.0003,
        description: 'Hạt giống chứa huyết mạch Chân Long.',
        effect: '+5% Long Huyết',
        icon: '/assets/items/long_huyet_chung.png',
        minLevel: 14, maxLevel: 17
    },
    {
        itemId: 'ky_lan_linh_chung',
        name: 'Kỳ Lân Linh Chủng',
        type: 'collectible',
        rarity: 'legendary',
        dropRate: 0.0002,
        description: 'Hạt giống từ lân tinh của Kỳ Lân.',
        effect: '+5% Thụy Khí',
        icon: '/assets/items/ky_lan_linh_chung.png',
        minLevel: 15, maxLevel: 17
    },
    {
        itemId: 'luan_hoi_chung',
        name: 'Luân Hồi Chủng',
        type: 'collectible',
        rarity: 'legendary',
        dropRate: 0.00015,
        description: 'Hạt giống Luân Hồi Thụ, xuyên qua sinh tử.',
        effect: 'Tái Sinh 3 lần',
        icon: '/assets/items/luan_hoi_chung.png',
        minLevel: 16, maxLevel: 17
    },
    // Đạo Giới Nguyên Chủng
    {
        itemId: 'hong_mong_nguyen_chung',
        name: 'Hồng Mông Nguyên Chủng',
        type: 'collectible',
        rarity: 'legendary',
        dropRate: 0.0001,
        description: 'Hạt giống từ thuở hồng hoang, chứa nguồn gốc vạn vật.',
        effect: 'Sáng Tạo Vạn Vật',
        icon: '/assets/items/hong_mong_nguyen_chung.png',
        minLevel: 18, maxLevel: 22
    },
    {
        itemId: 'thien_dao_chung',
        name: 'Thiên Đạo Chủng',
        type: 'collectible',
        rarity: 'legendary',
        dropRate: 0.00005,
        description: 'Hạt giống của Thiên Đạo, chứa quy tắc vũ trụ.',
        effect: 'Lĩnh Ngộ Thiên Đạo',
        icon: '/assets/items/thien_dao_chung.png',
        minLevel: 20, maxLevel: 22
    },
    {
        itemId: 'menh_thien_nguyen_chung',
        name: 'Mệnh Thiên Nguyên Chủng',
        type: 'artifact',
        rarity: 'legendary',
        dropRate: 0.00001,
        description: 'Chí tôn nguyên chủng, hợp nhất mệnh vận với thiên địa.',
        effect: '+100% tất cả bonus, Mệnh Thiên Nhất Thể',
        icon: '/assets/items/menh_thien_nguyen_chung.png',
        minLevel: 22, maxLevel: 22
    }
];

export interface Recipe {
    id: string;
    name: string;
    description: string;
    ingredients: { itemId: string; quantity: number }[];
    result: Partial<LootDefinition> & { itemId: string; quantity: number };
    successRate: number;
    requiredLevel?: number; // 0: Phàm Nhân, 1: Luyện Khí, etc.
}

export const ALCHEMY_RECIPES: Recipe[] = [
    {
        id: 'pill_xp_small',
        name: 'Tụ Khí Đan',
        description: 'Tăng 50 Tu Vi ngay lập tức.',
        ingredients: [
            { itemId: 'herb_common', quantity: 3 },
            { itemId: 'spirit_stone_low', quantity: 1 }
        ],
        result: {
            itemId: 'pill_xp_small',
            name: 'Tụ Khí Đan',
            type: 'pill',
            rarity: 'common',
            description: 'Dùng để tăng 50 điểm Tu Vi.',
            icon: '/assets/items/pill_xp_small.png',
            quantity: 1,
            xpValue: 50
        },
        successRate: 0.9,
        requiredLevel: 0 // Phàm Nhân
    },
    {
        id: 'pill_luck_small',
        name: 'Vận Khí Đan',
        description: 'Tăng may mắn trong 1 giờ.',
        ingredients: [
            { itemId: 'herb_rare', quantity: 1 },
            { itemId: 'herb_common', quantity: 5 }
        ],
        result: {
            itemId: 'pill_luck_small',
            name: 'Vận Khí Đan',
            type: 'pill',
            rarity: 'rare',
            description: 'Tăng tỉ lệ rơi đồ.',
            icon: '/assets/items/pill_luck_small.png',
            quantity: 1
        },
        successRate: 0.7,
        requiredLevel: 1 // Luyện Khí
    },
    {
        id: 'pill_breakthrough_1',
        name: 'Trúc Cơ Đan',
        description: 'Tẩy kinh phạt tủy, đúc thành tiên cơ.',
        ingredients: [
            { itemId: 'herb_rare', quantity: 3 },
            { itemId: 'spirit_stone_mid', quantity: 1 }
        ],
        result: {
            itemId: 'pill_breakthrough_1',
            name: 'Trúc Cơ Đan',
            type: 'pill',
            rarity: 'epic',
            description: 'Giúp tu sĩ Luyện Khí kỳ đột phá Trúc Cơ.',
            icon: '/assets/items/pill_breakthrough_1.png',
            quantity: 1,
            xpValue: 100
        },
        successRate: 0.4,
        requiredLevel: 1 // Luyện Khí -> Trúc Cơ
    },
    {
        id: 'pill_breakthrough_2',
        name: 'Kết Kim Đan',
        description: 'Ngưng tụ linh lực, kết thành Kim Đan.',
        ingredients: [
            { itemId: 'herb_rare', quantity: 10 },
            { itemId: 'spirit_stone_mid', quantity: 5 }
        ],
        result: {
            itemId: 'pill_breakthrough_2',
            name: 'Kết Kim Đan',
            type: 'pill',
            rarity: 'legendary',
            description: 'Gia tăng xác suất kết đan thành công.',
            icon: '/assets/items/pill_breakthrough_2.png',
            quantity: 1,
            xpValue: 300
        },
        successRate: 0.3,
        requiredLevel: 2 // Trúc Cơ -> Kim Đan
    },
    {
        id: 'pill_breakthrough_3',
        name: 'Ngưng Anh Đan',
        description: 'Phá toái hư không, ngưng tụ Nguyên Anh.',
        ingredients: [
            { itemId: 'herb_rare', quantity: 20 },
            { itemId: 'spirit_stone_mid', quantity: 10 },
            { itemId: 'bell_soul', quantity: 1 }
        ],
        result: {
            itemId: 'pill_breakthrough_3',
            name: 'Ngưng Anh Đan',
            type: 'pill',
            rarity: 'legendary',
            description: 'Vật phẩm thiết yếu để đột phá Nguyên Anh.',
            icon: '/assets/items/pill_breakthrough_3.png',
            quantity: 1,
            xpValue: 1000
        },
        successRate: 0.2,
        requiredLevel: 3 // Kim Đan -> Nguyên Anh
    },
    {
        id: 'pill_breakthrough_4',
        name: 'Hóa Thần Đan',
        description: 'Thần thức hóa ngàn, ngao du thái hư.',
        ingredients: [
            { itemId: 'herb_rare', quantity: 50 },
            { itemId: 'spirit_stone_mid', quantity: 20 }
        ],
        result: {
            itemId: 'pill_breakthrough_4',
            name: 'Hóa Thần Đan',
            type: 'pill',
            rarity: 'legendary',
            description: 'Giúp Nguyên Anh hóa thần, đạt được thọ nguyên ngàn năm.',
            icon: '/assets/items/pill_breakthrough_4.png',
            quantity: 1,
            xpValue: 3500
        },
        successRate: 0.15,
        requiredLevel: 4 // Nguyên Anh -> Hóa Thần
    },
    {
        id: 'pill_breakthrough_5',
        name: 'Hư Linh Đan',
        description: 'Cảm ngộ hư không, phản phác quy chân.',
        ingredients: [
            { itemId: 'herb_rare', quantity: 100 },
            { itemId: 'spirit_stone_mid', quantity: 50 }
        ],
        result: {
            itemId: 'pill_breakthrough_5',
            name: 'Hư Linh Đan',
            type: 'pill',
            rarity: 'legendary',
            description: 'Đan dược thượng cổ, giúp đột phá Luyện Hư.',
            icon: '/assets/items/pill_breakthrough_5.png',
            quantity: 1,
            xpValue: 12000
        },
        successRate: 0.1,
        requiredLevel: 5 // Hóa Thần -> Luyện Hư
    },
    {
        id: 'pill_breakthrough_6',
        name: 'Thiên Nguyên Đan',
        description: 'Hợp nhất thiên địa, vạn pháp quy tông.',
        ingredients: [
            { itemId: 'herb_rare', quantity: 200 },
            { itemId: 'spirit_stone_mid', quantity: 100 }
        ],
        result: {
            itemId: 'pill_breakthrough_6',
            name: 'Thiên Nguyên Đan',
            type: 'pill',
            rarity: 'legendary',
            description: 'Hỗ trợ tu sĩ Luyện Hư tiến giai Hợp Thể.',
            icon: '/assets/items/pill_breakthrough_6.png',
            quantity: 1,
            xpValue: 40000
        },
        successRate: 0.05,
        requiredLevel: 6 // Luyện Hư -> Hợp Thể
    },
    {
        id: 'pill_breakthrough_7',
        name: 'Độ Kiếp Đan',
        description: 'Chống đỡ lôi kiếp, phi thăng tiên giới.',
        ingredients: [
            { itemId: 'herb_rare', quantity: 500 },
            { itemId: 'spirit_stone_mid', quantity: 200 },
            { itemId: 'mystery_box', quantity: 5 }
        ],
        result: {
            itemId: 'pill_breakthrough_7',
            name: 'Độ Kiếp Đan',
            type: 'pill',
            rarity: 'legendary',
            description: 'Vật phẩm nghịch thiên, tăng khả năng độ kiếp Đại Thừa.',
            icon: '/assets/items/pill_breakthrough_7.png',
            quantity: 1,
            xpValue: 125000
        },
        successRate: 0.01,
        requiredLevel: 7 // Hợp Thể -> Đại Thừa
    },
    {
        id: 'pill_god',
        name: 'Cửu Chuyển Tiên Đan',
        description: 'Dành cho bậc Chí Tôn.',
        ingredients: [
            { itemId: 'herb_rare', quantity: 999 },
            { itemId: 'spirit_stone_mid', quantity: 999 }
        ],
        result: {
            itemId: 'pill_god',
            name: 'Cửu Chuyển Tiên Đan',
            type: 'pill',
            rarity: 'legendary',
            description: 'Chỉ dành cho Đại Thừa kỳ.',
            icon: '/assets/items/pill_god.png',
            quantity: 1,
            xpValue: 400000
        },
        successRate: 0.001,
        requiredLevel: 8 // Đại Thừa
    }
];

// Base probability to trigger a drop event per song
const BASE_DROP_CHANCE = 0.05; // 5% per song

/**
 * Check for loot drop based on luck modifier and player's cultivation level
 * @param luckModifier - Percentage bonus to drop rate (e.g., 15 = +15%)
 * @param playerLevel - Player's current cultivation level (0-22)
 * @returns LootDefinition if drop occurs, null otherwise
 */
export const checkLootDrop = (luckModifier = 0, playerLevel = 0): LootDefinition | null => {
    // 1. Check if drop occurs
    // luckModifier is percentage, e.g. 15 means +15% drop rate
    // Multiplier = 1 + (luckModifier / 100)
    const multiplier = 1 + (luckModifier / 100);

    if (Math.random() > BASE_DROP_CHANCE * multiplier) {
        return null;
    }

    // 2. Filter items by player's cultivation level
    const availableItems = LOOT_TABLE.filter(item => {
        const minLevel = item.minLevel ?? 0;
        const maxLevel = item.maxLevel ?? Infinity;
        return playerLevel >= minLevel && playerLevel <= maxLevel;
    });

    if (availableItems.length === 0) {
        return null;
    }

    // 3. Determine which item - Weighted random selection
    const totalWeight = availableItems.reduce((sum, item) => sum + item.dropRate, 0);
    let random = Math.random() * totalWeight;

    for (const item of availableItems) {
        if (random < item.dropRate) {
            return item;
        }
        random -= item.dropRate;
    }

    return availableItems[0]; // Fallback to first available item
};

export const getLootDef = (itemId: string) => LOOT_TABLE.find(i => i.itemId === itemId);

export const getLootIcon = (rarity: string) => {
    switch (rarity) {
        case 'legendary': return '🌟';
        case 'epic': return '🟣';
        case 'rare': return '🔵';
        default: return '⚪';
    }
};
