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
};
