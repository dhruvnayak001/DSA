import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { authApi, type AuthUser } from '@/api/auth';
import { TOKEN_KEY } from '@/api/client';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    signUp: (username: string, password: string) => Promise<{ error: string | null }>;
    signIn: (username: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    /** Validate stored token on mount */
    const refreshUser = useCallback(async () => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }
        try {
            const userData = await authApi.me();
            setUser(userData);
        } catch {
            // Token invalid or expired
            localStorage.removeItem(TOKEN_KEY);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const signUp = useCallback(async (username: string, password: string) => {
        try {
            const { user: userData } = await authApi.signup(username, password);
            setUser(userData);
            return { error: null };
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })
                ?.response?.data?.message ?? 'Signup failed';
            return { error: msg };
        }
    }, []);

    const signIn = useCallback(async (username: string, password: string) => {
        try {
            const { user: userData } = await authApi.login(username, password);
            setUser(userData);
            return { error: null };
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })
                ?.response?.data?.message ?? 'Login failed';
            return { error: msg };
        }
    }, []);

    const signOut = useCallback(async () => {
        await authApi.logout();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
