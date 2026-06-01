import { useState, useCallback } from 'react';
import { statsApi } from '@/api/stats';
import type { UserStats } from '@/types/types';

export function useStats(initialStats?: UserStats) {
    const [stats, setStats] = useState<UserStats | null>(initialStats ?? null);

    const refresh = useCallback(async () => {
        try {
            const data = await statsApi.get();
            setStats(data);
        } catch {
            // Silent — auth interceptor handles 401
        }
    }, []);

    const updateStats = useCallback(async (partial: Partial<UserStats>) => {
        try {
            const updated = await statsApi.update(partial);
            setStats(updated);
        } catch {
            // Silent
        }
    }, []);

    /** Called when markRevised returns new stats from the server */
    const setStatsDirectly = useCallback((newStats: UserStats) => {
        setStats(newStats);
    }, []);

    return { stats, refresh, updateStats, setStatsDirectly };
}
