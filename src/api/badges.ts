import { apiClient } from './client';
import type { BadgesResponse, StreakCalendarDay, UserStats } from '@/types/types';

export const badgesApi = {
    /** Fetch all badges with live progress */
    getAll: async (): Promise<BadgesResponse> => {
        const { data } = await apiClient.get<BadgesResponse>('/badges');
        return data;
    },

    /** Fetch streak calendar heatmap data (last 365 days) */
    getStreakCalendar: async (): Promise<StreakCalendarDay[]> => {
        const { data } = await apiClient.get<StreakCalendarDay[]>('/badges/streak-calendar');
        return data;
    },
};

export const statsApi = {
    /** Recompute totalDaysActive, totalRevisionsCount, and streak from actual question data.
     *  Use this once to fix accounts created before these fields existed. */
    recalculate: async (): Promise<{ message: string; stats: UserStats }> => {
        const { data } = await apiClient.post<{ message: string; stats: UserStats }>('/stats/recalculate');
        return data;
    },
};
