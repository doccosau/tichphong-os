export interface TrendingKeyword {
    keyword: string;
    count: number;
}

export interface ContentStats {
    id: string;
    views: number;
    completionRate: number;
}

class AnalyticsService {
    private static instance: AnalyticsService;

    private constructor() {
        // Mock init
    }

    public static getInstance(): AnalyticsService {
        if (!AnalyticsService.instance) {
            AnalyticsService.instance = new AnalyticsService();
        }
        return AnalyticsService.instance;
    }

    public async getActiveUsers(periodMinutes: number = 5): Promise<number> {
        return 120; // Dummy data
    }

    public async getTrendingKeywords(limit: number = 10): Promise<TrendingKeyword[]> {
        return [
            { keyword: 'tichphong', count: 1500 },
            { keyword: 'os', count: 1200 },
        ];
    }

    public async getContentInsights(): Promise<ContentStats[]> {
        return [
            { id: 'song1', views: 5000, completionRate: 0.8 },
            { id: 'song2', views: 3000, completionRate: 0.6 },
        ];
    }

    public async getTrafficTrend(hours: number = 24): Promise<{ time: string; count: number }[]> {
        const hourlyCounts: { time: string; count: number }[] = [];
        const now = new Date();
        for (let i = 0; i < hours; i++) {
            const d = new Date(now.getTime() - i * 60 * 60 * 1000);
            const hourKey = d.getHours().toString().padStart(2, '0') + ':00';
            hourlyCounts.push({ time: hourKey, count: Math.floor(Math.random() * 100) });
        }
        return hourlyCounts.reverse();
    }
}

export const analyticsService = AnalyticsService.getInstance();

