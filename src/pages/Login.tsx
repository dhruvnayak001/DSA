import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Eye, EyeOff, Loader2, ArrowRight, BookOpen, Flame, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type Mode = 'login' | 'signup';

const FEATURES = [
    { icon: BookOpen, label: 'Track DSA problems with full metadata' },
    { icon: Flame, label: 'Spaced repetition & streak tracking' },
    { icon: BarChart3, label: 'Analytics, heatmaps & mistake intelligence' },
    { icon: Zap, label: 'XP system, levels & achievements' },
];

export function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signIn, signUp } = useAuth();

    const [mode, setMode] = useState<Mode>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const from = (location.state as { from?: string })?.from ?? '/';

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!username.trim() || !password.trim()) {
            setError('Please enter both username and password');
            return;
        }

        setLoading(true);
        const fn = mode === 'login' ? signIn : signUp;
        const { error: authError } = await fn(username.trim(), password);
        setLoading(false);

        if (authError) {
            setError(authError);
        } else {
            navigate(from, { replace: true });
        }
    }

    function switchMode(m: Mode) {
        setMode(m);
        setError(null);
        setPassword('');
    }

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left — Branding panel (desktop only) */}
            <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 bg-primary/5 border-r border-border p-10">
                <div>
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                            <Zap className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                            <p className="text-base font-bold text-foreground">DSA Tracker</p>
                            <p className="text-xs text-muted-foreground">Pro</p>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <h2 className="text-2xl font-bold text-foreground text-balance mb-2">
                            Never forget a DSA problem again.
                        </h2>
                        <p className="text-sm text-muted-foreground text-pretty">
                            Your progress, your data — synced across all devices.
                        </p>
                    </motion.div>

                    <div className="mt-10 space-y-5">
                        {FEATURES.map(({ icon: Icon, label }, i) => (
                            <motion.div
                                key={label}
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                                className="flex items-center gap-3"
                            >
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <Icon className="w-4 h-4 text-primary" />
                                </div>
                                <p className="text-sm text-foreground">{label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <p className="text-xs text-muted-foreground">
                    Built with React, TypeScript & MongoDB Atlas
                </p>
            </div>

            {/* Right — Auth form */}
            <div className="flex-1 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-sm"
                >
                    {/* Mobile logo */}
                    <div className="flex items-center gap-3 mb-8 lg:hidden">
                        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                            <Zap className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <p className="text-base font-bold text-foreground">DSA Tracker Pro</p>
                    </div>

                    {/* Mode tabs */}
                    <div className="flex bg-muted rounded-lg p-1 mb-8">
                        {(['login', 'signup'] as Mode[]).map((m) => (
                            <button
                                key={m}
                                onClick={() => switchMode(m)}
                                className={cn(
                                    'flex-1 py-2 text-sm font-medium rounded-md transition-all',
                                    mode === m
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                {m === 'login' ? 'Log In' : 'Sign Up'}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={mode}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                        >
                            <h1 className="text-xl font-bold text-foreground mb-1">
                                {mode === 'login' ? 'Welcome back' : 'Create your account'}
                            </h1>
                            <p className="text-sm text-muted-foreground mb-6">
                                {mode === 'login'
                                    ? 'Log in to access your DSA progress'
                                    : 'Start tracking your DSA journey today'}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="username" className="text-sm font-medium">
                                Username
                            </Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="e.g. dhruv_nayak"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete={mode === 'login' ? 'username' : 'new-username'}
                                autoFocus
                                disabled={loading}
                                className="h-10"
                            />
                            {mode === 'signup' && (
                                <p className="text-xs text-muted-foreground">
                                    Letters, numbers and underscores only. Min 3 characters.
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-sm font-medium">
                                Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                    disabled={loading}
                                    className="h-10 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                                >
                                    <p className="text-sm text-destructive">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Button
                            type="submit"
                            className="w-full h-10 gap-2 font-medium"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {mode === 'login' ? 'Logging in...' : 'Creating account...'}
                                </>
                            ) : (
                                <>
                                    {mode === 'login' ? 'Log In' : 'Create Account'}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-xs text-muted-foreground mt-6">
                        {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                        <button
                            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                            className="text-primary hover:underline font-medium"
                        >
                            {mode === 'login' ? 'Sign up' : 'Log in'}
                        </button>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
