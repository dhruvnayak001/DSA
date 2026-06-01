import { apiClient, TOKEN_KEY } from './client';
import type { UserStats, AppSettings } from '@/types/types';

export interface AuthUser {
    id: string;
    username: string;
    stats: UserStats;
    settings: AppSettings;
    createdAt: string;
}

export interface AuthResponse {
    token: string;
    user: AuthUser;
}

export const authApi = {
    signup: async (username: string, password: string): Promise<AuthResponse> => {
        const { data } = await apiClient.post<AuthResponse>('/auth/signup', { username, password });
        localStorage.setItem(TOKEN_KEY, data.token);
        return data;
    },

    login: async (username: string, password: string): Promise<AuthResponse> => {
        const { data } = await apiClient.post<AuthResponse>('/auth/login', { username, password });
        localStorage.setItem(TOKEN_KEY, data.token);
        return data;
    },

    logout: async (): Promise<void> => {
        try {
            await apiClient.post('/auth/logout');
        } finally {
            localStorage.removeItem(TOKEN_KEY);
        }
    },

    me: async (): Promise<AuthUser> => {
        const { data } = await apiClient.get<{ user: AuthUser }>('/auth/me');
        return data.user;
    },

    getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
};
