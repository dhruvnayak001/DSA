import { apiClient } from './client';
import type { UserStats } from '@/types/types';

export const statsApi = {
    get: async (): Promise<UserStats> => {
        const { data } = await apiClient.get<UserStats>('/stats');
        return data;
    },

    update: async (partial: Partial<UserStats>): Promise<UserStats> => {
        const { data } = await apiClient.patch<UserStats>('/stats', partial);
        return data;
    },

    restoreStreak: async (): Promise<{ message: string; stats: UserStats; restoresRemaining: number }> => {
        const { data } = await apiClient.post<{ message: string; stats: UserStats; restoresRemaining: number }>('/stats/restore-streak');
        return data;
    },
};
