import { apiClient } from './client';
import type { SavedFilter, QuestionFilters } from '@/types/types';

export const filtersApi = {
    getAll: async (): Promise<SavedFilter[]> => {
        const { data } = await apiClient.get<SavedFilter[]>('/filters');
        return data;
    },

    create: async (name: string, filters: QuestionFilters): Promise<SavedFilter> => {
        const { data } = await apiClient.post<SavedFilter>('/filters', { name, filters });
        return data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/filters/${id}`);
    },
};
