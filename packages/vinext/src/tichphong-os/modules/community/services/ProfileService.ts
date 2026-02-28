import { SyncManager } from '../../sync/sync-manager';
// import { EventType } from '@/services/RealtimeManager';
type EventType = any;

export interface Quest {
    id: string;
    title: string;
    target: number;
    current: number;
    completed: boolean;
    claimed: boolean;
    reward: number;
    rewardItems?: { itemId: string; quantity: number }[];
    icon: string;
    type?: 'daily' | 'streak';
}

export interface ProfileState {
    quests: Record<string, Quest>;
    streak: number;
    lastLogin: number;
    isLoading: boolean;
}

/**
 * ProfileService (Kernel Driver)
 * 
 * Manages User Profile State (Quests, Streak, Stats).
 * - Offloads calculation from React Components.
 * - Uses SyncManager for Authoritative Events.
 * - Implements Optimistic Updates (Client-Side Prediction).
 */
// Default Quests Configuration
const DEFAULT_QUESTS: Record<string, Quest> = {
    // Daily Quests - New (Spirit Stone rewards only, no XP)
    daily_checkin: { id: 'daily_checkin', title: 'Điểm danh hằng ngày', target: 1, current: 0, completed: false, claimed: false, reward: 0, rewardItems: [{ itemId: 'spirit_stone_low', quantity: 1 }], icon: 'calendar', type: 'daily' },
    listen_3: { id: 'listen_3', title: 'Nghe 3 bài nhạc mới', target: 3, current: 0, completed: false, claimed: false, reward: 10, icon: 'music', type: 'daily' },
    listen_10: { id: 'listen_10', title: 'Nghe 10 bài nhạc', target: 10, current: 0, completed: false, claimed: false, reward: 0, rewardItems: [{ itemId: 'spirit_stone_low', quantity: 3 }], icon: 'headphones', type: 'daily' },
    favorite_3: { id: 'favorite_3', title: 'Yêu thích 3 bài hát', target: 3, current: 0, completed: false, claimed: false, reward: 0, rewardItems: [{ itemId: 'spirit_stone_low', quantity: 1 }], icon: 'heart', type: 'daily' },
    share: { id: 'share', title: 'Chia sẻ bí kíp', target: 1, current: 0, completed: false, claimed: false, reward: 15, icon: 'share', type: 'daily' },
    night_owl: { id: 'night_owl', title: 'Tu luyện giờ Tý (23h-1h)', target: 1, current: 0, completed: false, claimed: false, reward: 20, icon: 'moon', type: 'daily' },
    complete_all: { id: 'complete_all', title: 'Hoàn thành tất cả nhiệm vụ', target: 1, current: 0, completed: false, claimed: false, reward: 0, rewardItems: [{ itemId: 'mystery_box', quantity: 1 }], icon: 'trophy', type: 'daily' },

    // Social/Community Quests
    post_1: { id: 'post_1', title: 'Đăng bài lên bảng tin', target: 1, current: 0, completed: false, claimed: false, reward: 0, rewardItems: [{ itemId: 'spirit_stone_low', quantity: 1 }], icon: 'edit', type: 'daily' },
    comment_3: { id: 'comment_3', title: 'Bình luận 3 lần', target: 3, current: 0, completed: false, claimed: false, reward: 0, rewardItems: [{ itemId: 'spirit_stone_low', quantity: 1 }], icon: 'message-circle', type: 'daily' },
    quiz_1: { id: 'quiz_1', title: 'Tham gia Đố Vui', target: 1, current: 0, completed: false, claimed: false, reward: 15, icon: 'help-circle', type: 'daily' },
    playlist_add: { id: 'playlist_add', title: 'Thêm bài vào playlist', target: 1, current: 0, completed: false, claimed: false, reward: 10, icon: 'list-plus', type: 'daily' },

    // v6.1.2: New Social Quests
    follow_3: { id: 'follow_3', title: 'Theo dõi 3 người dùng', target: 3, current: 0, completed: false, claimed: false, reward: 0, rewardItems: [{ itemId: 'spirit_stone_low', quantity: 2 }], icon: 'user-plus', type: 'daily' },
    like_5: { id: 'like_5', title: 'Thích 5 bài viết', target: 5, current: 0, completed: false, claimed: false, reward: 0, rewardItems: [{ itemId: 'spirit_stone_low', quantity: 1 }], icon: 'thumbs-up', type: 'daily' },

    // v6.1.2: Discovery Quests
    ai_search: { id: 'ai_search', title: 'Tìm bài bằng AI', target: 1, current: 0, completed: false, claimed: false, reward: 10, icon: 'sparkles', type: 'daily' },

    // TODO: Enable when Listening Room feature is complete
    // room_join: { id: 'room_join', title: 'Tham gia phòng nghe nhạc', target: 1, current: 0, completed: false, claimed: false, reward: 20, icon: 'headphones', type: 'daily' },
    // room_host: { id: 'room_host', title: 'Host phòng nghe nhạc', target: 1, current: 0, completed: false, claimed: false, reward: 0, rewardItems: [{ itemId: 'spirit_stone_low', quantity: 5 }], icon: 'radio', type: 'daily' },

    // Streak Quests
    streak_3: { id: 'streak_3', title: 'Đăng nhập 3 ngày liên tiếp', target: 3, current: 0, completed: false, claimed: false, reward: 0, rewardItems: [{ itemId: 'spirit_stone_low', quantity: 5 }], icon: 'flame', type: 'streak' },
    streak_7: { id: 'streak_7', title: 'Đăng nhập 7 ngày liên tiếp', target: 7, current: 0, completed: false, claimed: false, reward: 0, rewardItems: [{ itemId: 'spirit_stone_low', quantity: 10 }, { itemId: 'mystery_box', quantity: 1 }], icon: 'zap', type: 'streak' },
    streak_14: { id: 'streak_14', title: 'Đăng nhập 14 ngày liên tiếp', target: 14, current: 0, completed: false, claimed: false, reward: 0, rewardItems: [{ itemId: 'spirit_stone_low', quantity: 20 }, { itemId: 'mystery_box', quantity: 1 }], icon: 'award', type: 'streak' },
    streak_30: { id: 'streak_30', title: 'Đăng nhập 30 ngày liên tiếp', target: 30, current: 0, completed: false, claimed: false, reward: 0, rewardItems: [{ itemId: 'spirit_stone_low', quantity: 50 }, { itemId: 'pet_egg', quantity: 1 }], icon: 'star', type: 'streak' },

    // v6.1.2: Weekly Quests
    weekly_50: { id: 'weekly_50', title: 'Nghe 50 bài trong tuần', target: 50, current: 0, completed: false, claimed: false, reward: 0, rewardItems: [{ itemId: 'spirit_stone_low', quantity: 10 }, { itemId: 'mystery_box', quantity: 1 }], icon: 'calendar-days', type: 'streak' },
    weekly_social: { id: 'weekly_social', title: 'Tương tác 10 lần/tuần', target: 10, current: 0, completed: false, claimed: false, reward: 0, rewardItems: [{ itemId: 'spirit_stone_low', quantity: 5 }], icon: 'users', type: 'streak' },

    // v6.1.2: Event Quests  
    boss_kill: { id: 'boss_kill', title: 'Tham gia Săn Boss', target: 1, current: 0, completed: false, claimed: false, reward: 30, icon: 'swords', type: 'daily' },
    first_blood: { id: 'first_blood', title: 'Người đầu tiên hoàn thành', target: 1, current: 0, completed: false, claimed: false, reward: 0, rewardItems: [{ itemId: 'pet_egg', quantity: 1 }], icon: 'crown', type: 'streak' },
};

class ProfileService {
    private static instance: ProfileService;
    private syncManager: SyncManager;
    private state: ProfileState = {
        quests: DEFAULT_QUESTS, // Initialize with defaults
        streak: 0,
        lastLogin: 0,
        isLoading: false // Ready immediately for optimistic UI
    };
    private listeners: Set<() => void> = new Set();

    private constructor() {
        this.syncManager = SyncManager.getInstance();
        // TODO: Load initial state from D1 (via SyncManager or API)
    }

    public static getInstance(): ProfileService {
        if (!ProfileService.instance) {
            ProfileService.instance = new ProfileService();
        }
        return ProfileService.instance;
    }

    /**
     * Subscribe to State Changes (React Integration)
     */
    public subscribe = (listener: () => void) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    };

    public getSnapshot = () => {
        return this.state;
    };

    /**
     * Update State (Internal/Optimistic)
     */
    private setState(partial: Partial<ProfileState>) {
        this.state = { ...this.state, ...partial };
        this.emitChange();
    }

    private emitChange() {
        this.listeners.forEach(l => l());
    }

    /**
     * Actions (Headless Logic)
     */

    // Update Quest Progress (Optimistic + Event)
    public updateQuestProgress(questId: string, amount: number = 1) {
        const quest = this.state.quests[questId];
        if (!quest || quest.completed) return;

        const newCurrent = Math.min(quest.current + amount, quest.target);
        const isCompleted = newCurrent >= quest.target;

        // Optimistic Update
        this.setState({
            quests: {
                ...this.state.quests,
                [questId]: { ...quest, current: newCurrent, completed: isCompleted }
            }
        });

        // Emit Event to Kernel/Worker
        this.syncManager.emit('PROGRESS_UPDATE', {
            questId,
            progress: newCurrent,
            completed: isCompleted,
            timestamp: Date.now()
        }, { urgent: isCompleted }); // Flush immediately if completed
    }

    // Claim Quest Reward
    public claimQuestReward(questId: string) {
        const quest = this.state.quests[questId];
        if (!quest || !quest.completed || quest.claimed) return;

        // Optimistic Update
        this.setState({
            quests: {
                ...this.state.quests,
                [questId]: { ...quest, claimed: true }
            }
        });

        // Emit Event
        this.syncManager.emit('ACHIEVEMENT_CLAIM', {
            questId,
            timestamp: Date.now()
        }, { authoritative: true });
    }

    // Initialize/Sync Data (Called by Auth/Boot)
    public initData(data: Partial<ProfileState>) {
        this.setState({
            ...data,
            isLoading: false
        });
    }
}

export const profileService = ProfileService.getInstance();
