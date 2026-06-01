import { useState, useEffect, useCallback } from 'react';
import { settingsApi } from '@/api/settings';

export function useTheme(initialTheme?: 'light' | 'dark') {
    const [theme, setThemeState] = useState<'light' | 'dark'>(initialTheme ?? 'light');

    // Apply theme class to DOM whenever theme changes
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    const setTheme = useCallback(async (t: 'light' | 'dark') => {
        setThemeState(t); // Instant local feedback
        try {
            await settingsApi.update({ theme: t });
        } catch {
            // Non-critical — theme already applied locally
        }
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    }, [theme, setTheme]);

    return { theme, setTheme, toggleTheme };
}
