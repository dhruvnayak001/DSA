import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Layout } from '@/components/layouts/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { QuestionBank } from '@/pages/QuestionBank';
import { RevisionQueue } from '@/pages/RevisionQueue';
import { Analytics } from '@/pages/Analytics';
import { MistakeIntelligence } from '@/pages/MistakeIntelligence';
import { Settings } from '@/pages/Settings';
import { Login } from '@/pages/Login';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useQuestions } from '@/hooks/useQuestions';
import { useTheme } from '@/hooks/useTheme';
import { useStats } from '@/hooks/useStats';
import type { DSAQuestion, UserStats } from '@/types/types';
import { Loader2 } from 'lucide-react';

// ── Auth Guard ────────────────────────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading your session...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    return <>{children}</>;
}

// ── Main App Content (inside auth context) ────────────────────────────────────
function AppContent() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Initialize hooks with user data from login (no extra API call needed)
    const { theme, toggleTheme } = useTheme(user?.settings?.theme ?? 'light');
    const { stats, setStatsDirectly } = useStats(user?.stats ?? undefined);

    const {
        questions,
        dueToday,
        loading: questionsLoading,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        duplicateQuestion,
        markRevised,
        importQuestions,
        resetAll,
        refresh,
    } = useQuestions();

    const [addFormOpen, setAddFormOpen] = useState(false);

    // Sync theme when user changes (e.g., after login with different account)
    useEffect(() => {
        if (user?.settings?.theme) {
            const root = document.documentElement;
            if (user.settings.theme === 'dark') root.classList.add('dark');
            else root.classList.remove('dark');
        }
    }, [user?.settings?.theme]);

    const handleMarkRevised = useCallback(async (id: string, confidence?: number) => {
        const newStats = await markRevised(id, confidence);
        if (newStats) setStatsDirectly(newStats);
    }, [markRevised, setStatsDirectly]);

    const handleImport = useCallback(async (qs: DSAQuestion[]) => {
        await importQuestions(qs);
        await refresh();
    }, [importQuestions, refresh]);

    const handleReset = useCallback(async () => {
        await resetAll();
    }, [resetAll]);

    // Effective stats: prefer live stats, fall back to user.stats from login
    const effectiveStats = stats ?? user?.stats ?? {
        currentStreak: 0, longestStreak: 0, lastRevisionDate: '',
        totalXP: 0, level: 1, achievements: [],
    };

    return (
        <Layout
            questions={questions}
            dueToday={dueToday}
            stats={effectiveStats}
            theme={theme}
            onToggleTheme={toggleTheme}
            onAddQuestion={() => setAddFormOpen(true)}
        >
            <Routes>
                <Route
                    path="/"
                    element={
                        <Dashboard
                            questions={questions}
                            dueToday={dueToday}
                            stats={effectiveStats}
                        />
                    }
                />
                <Route
                    path="/questions"
                    element={
                        <QuestionBank
                            questions={questions}
                            onAdd={addQuestion}
                            onUpdate={updateQuestion}
                            onDelete={deleteQuestion}
                            onDuplicate={duplicateQuestion}
                            onMarkRevised={handleMarkRevised}
                            addFormOpen={addFormOpen}
                            setAddFormOpen={setAddFormOpen}
                        />
                    }
                />
                <Route
                    path="/revision"
                    element={
                        <RevisionQueue
                            dueToday={dueToday}
                            allQuestions={questions}
                            onMarkRevised={handleMarkRevised}
                        />
                    }
                />
                <Route
                    path="/analytics"
                    element={<Analytics questions={questions} />}
                />
                <Route
                    path="/mistakes"
                    element={<MistakeIntelligence questions={questions} />}
                />
                <Route
                    path="/settings"
                    element={
                        <Settings
                            theme={theme}
                            onToggleTheme={toggleTheme}
                            questionCount={questions.length}
                            onImport={handleImport}
                            onReset={handleReset}
                        />
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Layout>
    );
}

// ── Root App ──────────────────────────────────────────────────────────────────
const App: React.FC = () => {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Public route */}
                    <Route path="/login" element={<LoginRedirect />} />

                    {/* All other routes require auth */}
                    <Route
                        path="/*"
                        element={
                            <RequireAuth>
                                <AppContent />
                            </RequireAuth>
                        }
                    />
                </Routes>
                <Toaster position="bottom-right" richColors />
            </AuthProvider>
        </Router>
    );
};

/** Redirect already-logged-in users away from /login */
function LoginRedirect() {
    const { user, loading } = useAuth();
    const location = useLocation();
    const from = (location.state as { from?: string })?.from ?? '/';

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (user) return <Navigate to={from} replace />;
    return <Login />;
}

export default App;
