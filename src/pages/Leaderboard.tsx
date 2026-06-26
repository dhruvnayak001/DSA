import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy,
    Search,
    Flame,
    Zap,
    Users,
    Award,
    RotateCcw,
    BookOpen,
    CheckCircle2,
    Activity,
    Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/use-debounce';
import { leaderboardApi, type LeaderboardEntry, type LeaderboardResponse, type UserProfile } from '@/api/leaderboard.ts';
import { cn } from '@/lib/utils';

// ── Avatar colors ─────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-blue-600',
    'from-fuchsia-500 to-purple-600',
    'from-lime-500 to-green-600',
];

function getAvatarColor(username: string): string {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── Medal config ──────────────────────────────────────────────────────────────

const MEDALS: Record<number, { emoji: string; gradient: string; ring: string; shadow: string }> = {
    1: {
        emoji: '🥇',
        gradient: 'from-yellow-400 via-amber-300 to-yellow-500',
        ring: 'ring-yellow-400/50',
        shadow: 'shadow-[0_0_30px_-5px_rgba(250,204,21,0.4)]',
    },
    2: {
        emoji: '🥈',
        gradient: 'from-slate-300 via-gray-200 to-slate-400',
        ring: 'ring-slate-300/50',
        shadow: 'shadow-[0_0_24px_-5px_rgba(148,163,184,0.4)]',
    },
    3: {
        emoji: '🥉',
        gradient: 'from-amber-600 via-orange-400 to-amber-700',
        ring: 'ring-amber-500/50',
        shadow: 'shadow-[0_0_24px_-5px_rgba(217,119,6,0.4)]',
    },
};

// ── Stat pill component ───────────────────────────────────────────────────────

function StatPill({ icon: Icon, value, label, className }: {
    icon: React.ElementType;
    value: string | number;
    label: string;
    className?: string;
}) {
    return (
        <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium', className)}>
            <Icon className="w-3 h-3" />
            <span>{value}</span>
            <span className="opacity-60 hidden sm:inline">{label}</span>
        </div>
    );
}

// ── Podium Card ───────────────────────────────────────────────────────────────

function PodiumCard({ entry, rank, isCurrentUser, onClick }: {
    entry: LeaderboardEntry;
    rank: number;
    isCurrentUser: boolean;
    onClick?: () => void;
}) {
    const medal = MEDALS[rank];
    const isFirst = rank === 1;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: rank === 1 ? 0 : rank === 2 ? 0.15 : 0.3, type: 'spring', stiffness: 120 }}
            className={cn(
                'relative flex flex-col items-center w-[31%] min-w-[120px] sm:min-w-[140px] max-w-[220px]',
                rank === 1 ? 'order-2 -mt-4 md:-mt-8' : rank === 2 ? 'order-1 mt-2 md:mt-0' : 'order-3 mt-2 md:mt-0',
                onClick && 'cursor-pointer group'
            )}
            onClick={onClick}
        >
            <div className={cn(
                'relative p-4 md:p-6 rounded-2xl border backdrop-blur-sm w-full',
                'bg-gradient-to-b from-card/80 to-card',
                isCurrentUser && 'ring-2 ring-primary border-primary/30',
                onClick && 'transition-all duration-200 group-hover:shadow-[0_0_40px_-10px_rgba(var(--primary-rgb),0.3)] group-hover:-translate-y-1',
                medal.shadow,
            )}>
                {/* Medal badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl md:text-3xl">
                    {medal.emoji}
                </div>

                {/* Avatar */}
                <div className="flex flex-col items-center mt-3">
                    <div className={cn(
                        'rounded-full flex items-center justify-center ring-2 mb-2',
                        `bg-gradient-to-br ${getAvatarColor(entry.username)}`,
                        medal.ring,
                        isFirst ? 'w-16 h-16 md:w-20 md:h-20 text-xl md:text-2xl' : 'w-12 h-12 md:w-16 md:h-16 text-lg md:text-xl',
                    )}>
                        <span className="text-white font-bold">
                            {entry.username.charAt(0).toUpperCase()}
                        </span>
                    </div>

                    {/* Username */}
                    <p className={cn(
                        'font-bold text-foreground truncate max-w-[120px]',
                        isFirst ? 'text-base md:text-lg' : 'text-sm md:text-base',
                        isCurrentUser && 'text-primary',
                    )}>
                        {entry.username}
                    </p>

                    {/* Level */}
                    <span className="text-[10px] text-muted-foreground font-medium">
                        Level {entry.level}
                    </span>

                    {/* XP */}
                    <div className="flex items-center gap-1 mt-2">
                        <Zap className={cn('text-warning', isFirst ? 'w-4 h-4' : 'w-3.5 h-3.5')} />
                        <span className={cn(
                            'font-bold tabular-nums text-foreground',
                            isFirst ? 'text-lg md:text-xl' : 'text-sm md:text-base',
                        )}>
                            {entry.totalXP.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground">XP</span>
                    </div>

                    {/* Stats row */}
                    <div className="flex flex-wrap items-center justify-center gap-1 mt-2">
                        {entry.currentStreak > 0 && (
                            <StatPill icon={Flame} value={entry.currentStreak} label="streak" className="bg-warning/10 text-warning" />
                        )}
                        <StatPill icon={BookOpen} value={entry.totalQuestionsSolved} label="solved" className="bg-emerald-500/10 text-emerald-500" />
                        <StatPill icon={Award} value={entry.badgeCount} label="badges" className="bg-primary/10 text-primary" />
                    </div>
                </div>

                {/* Current user indicator */}
                {isCurrentUser && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full uppercase tracking-wider whitespace-nowrap">
                        You
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ── Leaderboard Row ───────────────────────────────────────────────────────────

function LeaderboardRow({ entry, isCurrentUser, index, onClick }: {
    entry: LeaderboardEntry;
    isCurrentUser: boolean;
    index: number;
    onClick?: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.5) }}
            className={cn(
                'group flex items-center gap-3 md:gap-4 px-3 md:px-5 py-3 rounded-xl transition-all duration-200',
                onClick ? 'hover:bg-muted/60 cursor-pointer' : 'hover:bg-muted/60',
                isCurrentUser
                    ? 'bg-primary/5 ring-1 ring-primary/20 border border-primary/10'
                    : 'border border-transparent',
            )}
            onClick={onClick}
        >
            {/* Rank */}
            <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                entry.rank <= 10
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground',
            )}>
                {entry.rank}
            </div>

            {/* Avatar */}
            <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                `bg-gradient-to-br ${getAvatarColor(entry.username)}`,
            )}>
                <span className="text-white text-sm font-bold">
                    {entry.username.charAt(0).toUpperCase()}
                </span>
            </div>

            {/* Username + Level */}
            <div className="min-w-0 flex-1">
                <p className={cn(
                    'text-sm font-semibold truncate',
                    isCurrentUser ? 'text-primary' : 'text-foreground',
                )}>
                    {entry.username}
                    {isCurrentUser && (
                        <span className="ml-1.5 text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider">
                            You
                        </span>
                    )}
                </p>
                <p className="text-[11px] text-muted-foreground">Level {entry.level}</p>
            </div>

            {/* Stats — responsive grid */}
            <div className="hidden md:flex items-center gap-5">
                {/* XP */}
                <div className="flex items-center gap-1.5 min-w-[70px]">
                    <Zap className="w-3.5 h-3.5 text-warning" />
                    <span className="text-sm font-semibold tabular-nums text-foreground">{entry.totalXP.toLocaleString()}</span>
                </div>

                {/* Current Streak */}
                <div className="flex items-center gap-1.5 min-w-[55px]">
                    <Flame className={cn('w-3.5 h-3.5', entry.currentStreak > 0 ? 'text-warning' : 'text-muted-foreground/40')} />
                    <span className={cn('text-sm font-medium tabular-nums', entry.currentStreak > 0 ? 'text-foreground' : 'text-muted-foreground')}>
                        {entry.currentStreak}
                    </span>
                </div>

                {/* Longest Streak */}
                <div className="flex items-center gap-1.5 min-w-[55px]">
                    <Trophy className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    <span className="text-sm font-medium tabular-nums text-foreground">{entry.longestStreak}</span>
                </div>

                {/* Problems Solved */}
                <div className="flex items-center gap-1.5 min-w-[45px]">
                    <span className="text-sm font-medium tabular-nums text-foreground">{entry.totalQuestionsSolved}</span>
                    <span className="text-[10px] text-muted-foreground">solved</span>
                </div>

                {/* Revisions */}
                <div className="flex items-center gap-1.5 min-w-[45px]">
                    <span className="text-sm font-medium tabular-nums text-foreground">{entry.totalRevisionsCount}</span>
                    <span className="text-[10px] text-muted-foreground">revisions</span>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1.5 min-w-[40px]">
                    <Award className="w-3.5 h-3.5 text-primary" />
                    <span className="text-sm font-medium tabular-nums text-foreground">{entry.badgeCount}</span>
                </div>
            </div>

            {/* Mobile: condensed stats */}
            <div className="flex md:hidden items-center gap-2">
                <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-warning" />
                    <span className="text-xs font-semibold tabular-nums">{entry.totalXP.toLocaleString()}</span>
                </div>
                {entry.currentStreak > 0 && (
                    <div className="flex items-center gap-0.5">
                        <Flame className="w-3 h-3 text-warning" />
                        <span className="text-xs font-medium tabular-nums">{entry.currentStreak}</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ── User Profile Modal ──────────────────────────────────────────────────────────

function UserProfileModal({
    isOpen,
    onClose,
    userId,
}: {
    isOpen: boolean;
    onClose: () => void;
    userId: string | null;
}) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !userId) {
            setProfile(null);
            return;
        }
        let mounted = true;
        async function fetchProfile() {
            try {
                setLoading(true);
                const data = await leaderboardApi.getProfile(userId!);
                if (mounted) setProfile(data);
            } catch (err) {
                console.error("Failed to load user profile:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        fetchProfile();
        return () => { mounted = false; };
    }, [isOpen, userId]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-border/50">
                {loading || !profile ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                            <Trophy className="w-8 h-8 text-primary" />
                        </motion.div>
                        <p className="text-sm text-muted-foreground mt-4">Loading profile...</p>
                    </div>
                ) : (
                    <>
                        <div className="relative p-6 pb-0 pt-8 flex flex-col items-center">
                            {/* Decorative background */}
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
                            
                            <div className={cn(
                                'w-20 h-20 rounded-full flex items-center justify-center ring-4 ring-background mb-3 shadow-xl z-10',
                                `bg-gradient-to-br ${getAvatarColor(profile.username)}`,
                            )}>
                                <span className="text-white text-3xl font-bold">
                                    {profile.username.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            
                            <DialogTitle className="text-2xl font-bold text-center z-10">
                                {profile.username}
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground font-medium mt-1 mb-4 z-10">
                                Level {profile.level} · {profile.totalXP.toLocaleString()} XP
                            </p>

                            {/* Stat row */}
                            <div className="flex items-center gap-6 mb-6 z-10 w-full justify-center">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1.5 mb-1 text-foreground">
                                        <BookOpen className="w-4 h-4 text-emerald-500" />
                                        <span className="font-bold text-lg leading-none">{profile.totalQuestionsSolved}</span>
                                    </div>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Solved</p>
                                </div>
                                <div className="w-px h-8 bg-border" />
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1.5 mb-1 text-foreground">
                                        <Flame className={cn('w-4 h-4', profile.currentStreak > 0 ? 'text-warning' : 'text-muted-foreground/40')} />
                                        <span className="font-bold text-lg leading-none">{profile.currentStreak}</span>
                                    </div>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Streak</p>
                                </div>
                                <div className="w-px h-8 bg-border" />
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1.5 mb-1 text-foreground">
                                        <Award className="w-4 h-4 text-primary" />
                                        <span className="font-bold text-lg leading-none">{profile.badges.length}</span>
                                    </div>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Badges</p>
                                </div>
                            </div>
                        </div>

                        <div className="h-[300px] overflow-y-auto px-6 pb-6 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                            {/* Badges Section */}
                            {profile.badges.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                        <Award className="w-3.5 h-3.5" /> Recent Badges
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.badges.slice(0, 5).map(badge => (
                                            <div key={badge.id} className="flex items-center gap-2 bg-muted/50 rounded-lg px-2.5 py-1.5 border border-border/50">
                                                <span className="text-lg">{badge.icon}</span>
                                                <span className="text-xs font-medium">{badge.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent Questions Section */}
                            <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                    <Activity className="w-3.5 h-3.5" /> Recent Revisions
                                </h4>
                                {profile.recentQuestions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                                ) : (
                                    <div className="space-y-2">
                                        {profile.recentQuestions.map(q => (
                                            <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors">
                                                <div className="min-w-0 flex-1 mb-2 sm:mb-0">
                                                    <p className="text-sm font-medium text-foreground truncate">{q.title}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={cn(
                                                            'text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm',
                                                            q.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-500' :
                                                            q.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                                                            'bg-rose-500/10 text-rose-500'
                                                        )}>
                                                            {q.difficulty}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(q.lastRevised).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function Leaderboard() {
    const { user } = useAuth();
    const [data, setData] = useState<LeaderboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const debouncedSearch = useDebounce(searchInput, 300);

    const fetchLeaderboard = useCallback(async (search?: string) => {
        try {
            setLoading(true);
            const result = await leaderboardApi.getAll(search || undefined);
            setData(result);
        } catch (err) {
            console.error('Failed to load leaderboard:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    // Search effect
    useEffect(() => {
        fetchLeaderboard(debouncedSearch);
    }, [debouncedSearch, fetchLeaderboard]);

    const top3 = useMemo(() => data?.leaderboard.slice(0, 3) ?? [], [data]);
    const rest = useMemo(() => data?.leaderboard.slice(3) ?? [], [data]);
    const currentUserId = data?.currentUserId;

    // Find current user's rank
    const currentUserEntry = useMemo(() =>
        data?.leaderboard.find(e => e.userId === currentUserId),
        [data, currentUserId]);

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                        <Trophy className="w-8 h-8 text-primary" />
                    </motion.div>
                    <p className="text-sm text-muted-foreground">Loading leaderboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ── Header ───────────────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-primary" />
                            Leaderboard
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {data?.leaderboard.length ?? 0} users competing
                            {currentUserEntry && (
                                <span className="ml-2 text-primary font-medium">
                                    · You're ranked #{currentUserEntry.rank}
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Search */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="leaderboard-search"
                            placeholder="Search users..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-9 h-9 text-sm"
                        />
                        {searchInput && (
                            <button
                                onClick={() => setSearchInput('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* ── Podium (Top 3) ────────────────────────────────────────────────── */}
            {!searchInput && top3.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Card className="border-border/50 shadow-card overflow-hidden relative">
                        {/* Decorative gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-warning/5 pointer-events-none" />

                        <CardContent className="relative p-5 md:p-8">
                            <div className="flex flex-wrap justify-center gap-3 md:gap-6 max-w-2xl mx-auto items-end">
                                {top3.map((entry) => (
                                    <PodiumCard
                                        key={entry.userId}
                                        entry={entry}
                                        rank={entry.rank}
                                        isCurrentUser={entry.userId === currentUserId}
                                        onClick={() => setSelectedUserId(entry.userId)}
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* ── Full Rankings ─────────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <Card className="border-border/50 shadow-card">
                    <CardHeader className="pb-3 pt-4 px-5">
                        <div className="flex items-center justify-between gap-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                {searchInput ? 'Search Results' : 'Full Rankings'}
                            </CardTitle>

                            {/* Column headers (desktop) */}
                            <div className="hidden md:flex items-center gap-5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                                <span className="min-w-[70px]">XP</span>
                                <span className="min-w-[55px]">Streak</span>
                                <span className="min-w-[55px]">Best</span>
                                <span className="min-w-[45px]">Solved</span>
                                <span className="min-w-[45px]">Revisions</span>
                                <span className="min-w-[40px]">Badges</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-3 md:px-5 pb-5">
                        {(searchInput ? data?.leaderboard : rest)?.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Users className="w-10 h-10 text-muted-foreground/40 mb-3" />
                                <p className="text-sm font-medium text-muted-foreground">
                                    {searchInput ? 'No users found matching your search' : 'No more users to show'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <AnimatePresence>
                                    {(searchInput ? data?.leaderboard ?? [] : rest).map((entry, i) => (
                                        <LeaderboardRow
                                            key={entry.userId}
                                            entry={entry}
                                            isCurrentUser={entry.userId === currentUserId}
                                            index={i}
                                            onClick={() => setSelectedUserId(entry.userId)}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* ── Your Stats Summary (if user is not in top 3) ──────────────────── */}
            {currentUserEntry && currentUserEntry.rank > 3 && !searchInput && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <Card className="border-primary/20 shadow-card bg-primary/5">
                        <CardContent className="p-4 md:p-5">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
                                    `bg-gradient-to-br ${getAvatarColor(currentUserEntry.username)}`,
                                )}>
                                    <span className="text-white text-lg font-bold">
                                        {currentUserEntry.username.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-primary">
                                        Your Rank: #{currentUserEntry.rank}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {currentUserEntry.totalXP.toLocaleString()} XP · Level {currentUserEntry.level} · {currentUserEntry.currentStreak} day streak
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                    <div className="text-center">
                                        <p className="font-bold text-foreground tabular-nums">{currentUserEntry.totalQuestionsSolved}</p>
                                        <p className="text-muted-foreground">Solved</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-foreground tabular-nums">{currentUserEntry.totalRevisionsCount}</p>
                                        <p className="text-muted-foreground">Revisions</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-foreground tabular-nums">{currentUserEntry.badgeCount}</p>
                                        <p className="text-muted-foreground">Badges</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            <UserProfileModal
                isOpen={selectedUserId !== null}
                onClose={() => setSelectedUserId(null)}
                userId={selectedUserId}
            />
        </div>
    );
}
