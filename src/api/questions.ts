import { apiClient } from './client';
import type { DSAQuestion, QuestionFormData } from '@/types/types';

export interface RevisePayload {
    confidence: number;
}

export interface ReviseResponse {
    question: DSAQuestion;
    stats: import('@/types/types').UserStats;
}

export interface ImportResponse {
    message: string;
    questions: DSAQuestion[];
}

export const questionsApi = {
    getAll: async (): Promise<DSAQuestion[]> => {
        const { data } = await apiClient.get<DSAQuestion[]>('/questions');
        return data;
    },

    add: async (questionData: QuestionFormData): Promise<DSAQuestion> => {
        const { data } = await apiClient.post<DSAQuestion>('/questions', questionData);
        return data;
    },

    update: async (question: DSAQuestion): Promise<DSAQuestion> => {
        const { data } = await apiClient.put<DSAQuestion>(`/questions/${question.id}`, question);
        return data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/questions/${id}`);
    },

    duplicate: async (id: string): Promise<DSAQuestion> => {
        const { data } = await apiClient.post<DSAQuestion>(`/questions/${id}/duplicate`);
        return data;
    },

    revise: async (id: string, confidence: number): Promise<ReviseResponse> => {
        const { data } = await apiClient.post<ReviseResponse>(`/questions/${id}/revise`, { confidence });
        return data;
    },

    importQuestions: async (questions: DSAQuestion[]): Promise<ImportResponse> => {
        const { data } = await apiClient.post<ImportResponse>('/questions/import', { questions });
        return data;
    },
};
