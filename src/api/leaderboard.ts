import { apiClient } from './client';

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    username: string;
    totalXP: number;
    level: number;
    currentStreak: number;
    longestStreak: number;
    totalQuestionsSolved: number;
    totalRevisionsCount: number;
    badgeCount: number;
}

export interface LeaderboardResponse {
    leaderboard: LeaderboardEntry[];
    currentUserId: string;
}

export interface UserProfile {
    userId: string;
    username: string;
    totalXP: number;
    level: number;
    currentStreak: number;
    longestStreak: number;
    totalQuestionsSolved: number;
    totalRevisionsCount: number;
    badges: {
        id: string;
        title: string;
        icon: string;
        tier: string;
        unlockedAt: string;
    }[];
    difficultyStats: {
        Easy: number;
        Medium: number;
        Hard: number;
    };
    recentQuestions: {
        id: string;
        title: string;
        difficulty: 'Easy' | 'Medium' | 'Hard';
        confidence: number;
        platform: string;
        lastRevised: string;
    }[];
}

export const leaderboardApi = {
    getAll: async (search?: string): Promise<LeaderboardResponse> => {
        const params = search ? { search } : {};
        const { data } = await apiClient.get<LeaderboardResponse>('/leaderboard', { params });
        return data;
    },
    getProfile: async (userId: string): Promise<UserProfile> => {
        const { data } = await apiClient.get<UserProfile>(`/leaderboard/${userId}`);
        return data;
    },
};
