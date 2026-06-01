import { apiClient } from './client';
import type { AppSettings } from '@/types/types';

export const settingsApi = {
    get: async (): Promise<AppSettings> => {
        const { data } = await apiClient.get<AppSettings>('/settings');
        return data;
    },

    update: async (partial: Partial<AppSettings>): Promise<AppSettings> => {
        const { data } = await apiClient.patch<AppSettings>('/settings', partial);
        return data;
    },
};
