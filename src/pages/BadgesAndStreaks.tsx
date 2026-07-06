import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Flame,
    Trophy,
    Zap,
    Calendar,
    Award,
    Target,
    Star,
    TrendingUp,
    Sparkles,
    Filter,
    X,
    ChevronRight,
    Lock,
    Info,
    RotateCcw,
    Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge as BadgeUI } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { StreakHeatmap } from '@/components/common/StreakHeatmap';
import { BadgeCard } from '@/components/common/BadgeCard';
import { badgesApi, statsApi } from '@/api/badges';
import { statsApi as mainStatsApi } from '@/api/stats';
import type { Badge, BadgeCategory, BadgeTier, StreakCalendarDay } from '@/types/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── Category metadata ─────────────────────────────────────────────────────────

const CATEGORIES: { value: BadgeCategory | 'all'; label: string; icon: React.ElementType }[] = [
    { value: 'all', label: 'All', icon: Award },
    { value: 'streak', label: 'Streak', icon: Flame },
    { value: 'volume', label: 'Volume', icon: Target },
    { value: 'mastery', label: 'Mastery', icon: Star },
    { value: 'consistency', label: 'Consistency', icon: TrendingUp },
    { value: 'special', label: 'Special', icon: Sparkles },
];

const TIER_ORDER: BadgeTier[] = ['platinum', 'gold', 'silver', 'bronze'];

const TIER_COLORS: Record<BadgeTier, string> = {
    bronze: 'text-amber-600 dark:text-amber-400',
    silver: 'text-slate-500 dark:text-slate-300',
    gold: 'text-yellow-600 dark:text-yellow-400',
    platinum: 'text-violet-600 dark:text-violet-400',
};

const TIER_BG: Record<BadgeTier, string> = {
    bronze: 'bg-amber-500/10',
    silver: 'bg-slate-400/10',
    gold: 'bg-yellow-500/10',
    platinum: 'bg-violet-500/10',
};

// ── Streak motivational text ──────────────────────────────────────────────────

function getStreakMessage(streak: number): string {
    if (streak === 0) return "Start your streak today! 💪";
    if (streak < 3) return "Building momentum! Keep going!";
    if (streak < 7) return "You're on fire! 🔥";
    if (streak < 14) return "Incredible consistency! 🌟";
    if (streak < 30) return "Absolute beast mode! 💪🔥";
    if (streak < 100) return "You're unstoppable! 🏆";
    return "LEGENDARY streak! 👑✨";
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function BadgesAndStreaks() {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [calendarData, setCalendarData] = useState<StreakCalendarDay[]>([]);
    const [streakStats, setStreakStats] = useState({
        currentStreak: 0,
        longestStreak: 0,
        totalDaysActive: 0,
        totalRevisionsCount: 0,
        totalXP: 0,
        level: 1,
        streakRestoresUsed: 0,
        streakRestoresMonth: '',
        streakBeforeBreak: 0,
    });
    const [restoring, setRestoring] = useState(false);
    const [loading, setLoading] = useState(true);
    const [recalculating, setRecalculating] = useState(false);
    const [activeCategory, setActiveCategory] = useState<BadgeCategory | 'all'>('all');
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

    // Fetch data
    useEffect(() => {
        async function load() {
            try {
                const [badgesRes, calRes, fullStats] = await Promise.all([
                    badgesApi.getAll(),
                    badgesApi.getStreakCalendar(),
                    mainStatsApi.get(),
                ]);
                setBadges(badgesRes.badges);
                setCalendarData(calRes);

                // Auto-recalculate if active days is 0 but heatmap has data
                // (this happens for accounts created before these fields existed)
                const activeDaysFromCal = calRes.filter((d) => d.count > 0).length;
                if (badgesRes.stats.totalDaysActive === 0 && activeDaysFromCal > 0) {
                    try {
                        const result = await statsApi.recalculate();
                        setStreakStats((prev) => ({ ...prev, ...result.stats }));
                    } catch {
                        setStreakStats((prev) => ({ ...prev, ...badgesRes.stats, ...fullStats }));
                    }
                } else {
                    setStreakStats((prev) => ({ ...prev, ...badgesRes.stats, ...fullStats }));
                }
            } catch (err) {
                console.error('Failed to load badges:', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    async function handleRecalculate() {
        setRecalculating(true);
        try {
            const result = await statsApi.recalculate();
            setStreakStats((prev) => ({ ...prev, ...result.stats }));
            // Reload calendar and badges too
            const [badgesRes, calRes] = await Promise.all([
                badgesApi.getAll(),
                badgesApi.getStreakCalendar(),
            ]);
            setBadges(badgesRes.badges);
            setCalendarData(calRes);
            toast.success('Stats recalculated!', { description: `${result.stats.totalDaysActive} active days, ${result.stats.currentStreak} day streak.` });
        } catch {
            toast.error('Failed to recalculate stats');
        } finally {
            setRecalculating(false);
        }
    }

    async function handleRestoreStreak() {
        setRestoring(true);
        try {
            const result = await mainStatsApi.restoreStreak();
            setStreakStats((prev) => ({
                ...prev,
                currentStreak: result.stats.currentStreak,
                longestStreak: result.stats.longestStreak,
                streakRestoresUsed: result.stats.streakRestoresUsed ?? prev.streakRestoresUsed + 1,
                streakRestoresMonth: result.stats.streakRestoresMonth ?? prev.streakRestoresMonth,
                streakBeforeBreak: 0,
            }));
            toast.success(`🔥 Streak restored!`, {
                description: `${result.stats.currentStreak}-day streak is back. ${result.restoresRemaining} restore${result.restoresRemaining === 1 ? '' : 's'} left this month.`,
                duration: 5000,
            });
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to restore streak';
            toast.error(msg);
        } finally {
            setRestoring(false);
        }
    }

    // Filter badges by category
    const filteredBadges = useMemo(() => {
        const filtered = activeCategory === 'all'
            ? badges
            : badges.filter((b) => b.category === activeCategory);

        // Sort: unlocked first (newest first), then locked (highest progress first)
        return [...filtered].sort((a, b) => {
            if (a.unlockedAt && !b.unlockedAt) return -1;
            if (!a.unlockedAt && b.unlockedAt) return 1;
            if (a.unlockedAt && b.unlockedAt) {
                return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
            }
            return b.progress - a.progress;
        });
    }, [badges, activeCategory]);

    const unlockedCount = badges.filter((b) => b.unlockedAt).length;
    const totalCount = badges.length;

    // Stats for heatmap
    const totalRevisions = calendarData.reduce((sum, d) => sum + d.count, 0);
    const activeDays = calendarData.filter((d) => d.count > 0).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                        <Award className="w-8 h-8 text-primary" />
                    </motion.div>
                    <p className="text-sm text-muted-foreground">Loading badges...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ── Section 1: Streak Hero ──────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="border-border/50 shadow-card overflow-hidden relative">
                    {/* Background gradient effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-warning/5 pointer-events-none" />

                    <CardContent className="relative p-5 md:p-8">
                        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                            {/* Streak flame */}
                            <div className="relative">
                                <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-orange-500/15 via-red-500/10 to-yellow-500/15 flex items-center justify-center relative">
                                    {/* Floating particles */}
                                    <div className="absolute -top-2 left-4 text-xs animate-float" style={{ animationDelay: '0s' }}>🔥</div>
                                    <div className="absolute -top-1 right-6 text-xs animate-float" style={{ animationDelay: '1s' }}>✨</div>
                                    <div className="absolute top-2 -right-1 text-xs animate-float" style={{ animationDelay: '0.5s' }}>⚡</div>

                                    <div className="text-center">
                                        <motion.span
                                            className="text-5xl md:text-6xl block animate-flame-pulse"
                                            initial={{ scale: 0.8 }}
                                            animate={{ scale: 1 }}
                                            transition={{ duration: 0.4, type: 'spring' }}
                                        >
                                            🔥
                                        </motion.span>
                                    </div>
                                </div>
                                {/* Streak count overlay */}
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-background border border-border rounded-full px-4 py-1 shadow-md">
                                    <motion.span
                                        className="text-lg font-bold text-foreground tabular-nums"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        {streakStats.currentStreak}
                                    </motion.span>
                                    <span className="text-xs text-muted-foreground ml-1">days</span>
                                </div>
                            </div>

                            {/* Streak info */}
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1">
                                    {streakStats.currentStreak > 0 ? 'Current Streak' : 'Start Your Streak'}
                                </h2>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {getStreakMessage(streakStats.currentStreak)}
                                </p>

                            {/* Mini stat pills */}
                                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-warning/10 border border-warning/20 rounded-full">
                                        <Flame className="w-3.5 h-3.5 text-warning" />
                                        <span className="text-xs font-medium text-warning">{streakStats.longestStreak} best</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                                        <Calendar className="w-3.5 h-3.5 text-primary" />
                                        <span className="text-xs font-medium text-primary">{streakStats.totalDaysActive} active days</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-success/10 border border-success/20 rounded-full">
                                        <TrendingUp className="w-3.5 h-3.5 text-success" />
                                        <span className="text-xs font-medium text-success">{streakStats.totalRevisionsCount} revisions</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-info/10 border border-info/20 rounded-full">
                                        <Zap className="w-3.5 h-3.5 text-info" />
                                        <span className="text-xs font-medium text-info">Lvl {streakStats.level} · {streakStats.totalXP} XP</span>
                                    </div>
                                </div>

                                {/* Recalculate button */}
                                <button
                                    onClick={handleRecalculate}
                                    disabled={recalculating}
                                    className="mt-3 text-[11px] text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors disabled:opacity-50"
                                >
                                    {recalculating ? 'Recalculating…' : 'Recalculate stats from history'}
                                </button>
                            </div>
                        </div>

                        {/* ── Streak Restore Banner ─────────────────────── */}
                        <AnimatePresence>
                            {streakStats.streakBeforeBreak > 0 && streakStats.streakBeforeBreak > streakStats.currentStreak && (() => {
                                const MAX = 2;
                                const now = new Date();
                                const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                                const usedThisMonth = streakStats.streakRestoresMonth === currentMonth
                                    ? (streakStats.streakRestoresUsed ?? 0)
                                    : 0;
                                const remaining = MAX - usedThisMonth;
                                const canRestore = remaining > 0;

                                return (
                                    <motion.div
                                        key="restore-banner"
                                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                        animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
                                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                                        className="overflow-hidden"
                                    >
                                        <div className={cn(
                                            'relative rounded-xl border p-4 overflow-hidden',
                                            canRestore
                                                ? 'border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-red-500/5 to-yellow-500/10'
                                                : 'border-border/50 bg-muted/30'
                                        )}>
                                            {/* Subtle glow */}
                                            {canRestore && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent pointer-events-none" />
                                            )}

                                            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                                {/* Icon */}
                                                <div className={cn(
                                                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                                                    canRestore ? 'bg-orange-500/15' : 'bg-muted'
                                                )}>
                                                    <Shield className={cn('w-5 h-5', canRestore ? 'text-orange-500' : 'text-muted-foreground')} />
                                                </div>

                                                {/* Text */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {canRestore ? 'Restore your streak? 🔥' : 'No restores left this month'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {canRestore
                                                            ? `Your ${streakStats.streakBeforeBreak}-day streak broke. Use a restore to bring it back!`
                                                            : `You've used both restores this month. Resets on the 1st.`
                                                        }
                                                    </p>
                                                    {/* Token dots */}
                                                    <div className="flex items-center gap-1.5 mt-2">
                                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Restores left:</span>
                                                        {Array.from({ length: MAX }).map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className={cn(
                                                                    'w-2.5 h-2.5 rounded-full transition-colors',
                                                                    i < remaining ? 'bg-orange-500' : 'bg-muted-foreground/25'
                                                                )}
                                                            />
                                                        ))}
                                                        <span className="text-[10px] text-muted-foreground font-medium ml-0.5">{remaining}/{MAX}</span>
                                                    </div>
                                                </div>

                                                {/* Button */}
                                                <button
                                                    id="restore-streak-btn"
                                                    onClick={handleRestoreStreak}
                                                    disabled={!canRestore || restoring}
                                                    className={cn(
                                                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex-shrink-0',
                                                        canRestore && !restoring
                                                            ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-orange-500/25 hover:scale-105 active:scale-95'
                                                            : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                                                    )}
                                                >
                                                    <RotateCcw className={cn('w-4 h-4', restoring && 'animate-spin')} />
                                                    {restoring ? 'Restoring…' : 'Restore Streak'}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })()}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </motion.div>

            {/* ── Section 2: Activity Heatmap ────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <Card className="border-border/50 shadow-card">
                    <CardHeader className="pb-3 pt-4 px-5">
                        <div className="flex items-center justify-between gap-3">
                            <CardTitle className="text-sm font-semibold">Activity Heatmap</CardTitle>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{totalRevisions} total revisions</span>
                                <span>·</span>
                                <span>{activeDays} active days</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-5 pb-4">
                        <StreakHeatmap data={calendarData} />
                    </CardContent>
                </Card>
            </motion.div>

            {/* ── Section 3: Badge Showcase ───────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <Card className="border-border/50 shadow-card">
                    <CardHeader className="pb-3 pt-4 px-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <CardTitle className="text-sm font-semibold">Badge Collection</CardTitle>
                                <BadgeUI variant="secondary" className="text-xs">
                                    {unlockedCount}/{totalCount} unlocked
                                </BadgeUI>
                            </div>

                            {/* Overall progress */}
                            <div className="flex items-center gap-2 min-w-[140px]">
                                <Progress value={totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0} className="h-1.5 flex-1" />
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                        {/* Category tabs */}
                        <div className="mb-5 overflow-x-auto">
                            <div className="flex gap-1.5 min-w-max">
                                {CATEGORIES.map(({ value, label, icon: Icon }) => {
                                    const isActive = activeCategory === value;
                                    const count = value === 'all'
                                        ? badges.length
                                        : badges.filter((b) => b.category === value).length;
                                    const unlocked = value === 'all'
                                        ? unlockedCount
                                        : badges.filter((b) => b.category === value && b.unlockedAt).length;
                                    return (
                                        <button
                                            key={value}
                                            onClick={() => setActiveCategory(value)}
                                            className={cn(
                                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                                                isActive
                                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                            )}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            {label}
                                            <span className={cn(
                                                'text-[10px] tabular-nums',
                                                isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                            )}>
                                                {unlocked}/{count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Badge grid */}
                        {filteredBadges.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Award className="w-10 h-10 text-muted-foreground/40 mb-3" />
                                <p className="text-sm font-medium text-muted-foreground">No badges in this category</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                                {filteredBadges.map((badge, i) => (
                                    <BadgeCard
                                        key={badge.id}
                                        badge={badge}
                                        index={i}
                                        onClick={setSelectedBadge}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* ── Section 4: Tier Legend ──────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <Card className="border-border/50 shadow-card">
                    <CardHeader className="pb-3 pt-4 px-5">
                        <CardTitle className="text-sm font-semibold">Badge Tiers</CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {TIER_ORDER.map((tier) => {
                                const tierBadges = badges.filter((b) => b.tier === tier);
                                const tierUnlocked = tierBadges.filter((b) => b.unlockedAt).length;
                                return (
                                    <div
                                        key={tier}
                                        className={cn(
                                            'rounded-lg border p-3 text-center',
                                            TIER_BG[tier],
                                            `badge-glow-${tier}`
                                        )}
                                    >
                                        <p className={cn('text-sm font-bold capitalize', TIER_COLORS[tier])}>
                                            {tier}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            {tierUnlocked}/{tierBadges.length} earned
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* ── Badge Detail Modal ─────────────────────────────────────────── */}
            <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    {selectedBadge && (
                        <BadgeDetailModal badge={selectedBadge} />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ── Badge Detail Modal Content ────────────────────────────────────────────────

function BadgeDetailModal({ badge }: { badge: Badge }) {
    const isUnlocked = !!badge.unlockedAt;

    return (
        <>
            <DialogHeader>
                <DialogTitle className="sr-only">{badge.title}</DialogTitle>
                <DialogDescription className="sr-only">{badge.description}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-4 py-4">
                {/* Large badge icon */}
                <motion.div
                    className={cn(
                        'w-24 h-24 rounded-full flex items-center justify-center relative',
                        isUnlocked ? 'animate-badge-unlock' : ''
                    )}
                >
                    {isUnlocked && (
                        <div className={cn(
                            'absolute inset-0 rounded-full bg-gradient-to-br opacity-25',
                            badge.tier === 'bronze' && 'from-amber-500 to-yellow-600',
                            badge.tier === 'silver' && 'from-slate-300 to-slate-500',
                            badge.tier === 'gold' && 'from-yellow-400 to-amber-500',
                            badge.tier === 'platinum' && 'from-violet-400 to-indigo-500',
                        )} />
                    )}
                    <span className={cn(
                        'text-5xl z-10',
                        !isUnlocked && 'grayscale opacity-40'
                    )}>
                        {badge.icon}
                    </span>
                </motion.div>

                {/* Title & tier */}
                <div className="text-center">
                    <h3 className="text-lg font-bold text-foreground">{badge.title}</h3>
                    <p className={cn(
                        'text-xs font-semibold uppercase tracking-wider mt-0.5',
                        TIER_COLORS[badge.tier]
                    )}>
                        {badge.tier}
                    </p>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground text-center max-w-[280px]">
                    {badge.description}
                </p>

                {/* Category */}
                <BadgeUI variant="outline" className="text-xs capitalize">
                    {badge.category}
                </BadgeUI>

                {/* Progress or unlock date */}
                {isUnlocked ? (
                    <div className="flex items-center gap-2 text-xs text-success">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Unlocked on {new Date(badge.unlockedAt!).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                        })}</span>
                    </div>
                ) : (
                    <div className="w-full max-w-[240px] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium text-foreground">{badge.current}/{badge.target}</span>
                        </div>
                        <Progress value={badge.progress} className="h-2" />
                        <p className="text-[11px] text-muted-foreground text-center">
                            {badge.target - badge.current} more to go!
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
