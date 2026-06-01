import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    BookOpen,
    Clock,
    AlertTriangle,
    TrendingUp,
    Zap,
    Flame,
    Star,
    Calendar,
    ArrowRight,
    Target,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import type { DSAQuestion, UserStats } from '@/types/types';
import { CONFIDENCE_LABELS } from '@/utils/helpers';
import { formatDate } from '@/utils/helpers';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    delay?: number;
    subtitle?: string;
}

function StatCard({ title, value, icon: Icon, color, bgColor, delay = 0, subtitle }: StatCardProps) {
    const animated = useAnimatedCounter(value);
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay, ease: 'easeOut' }}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
        >
            <Card className="glass-card border-border/50 shadow-card hover:shadow-hover transition-shadow h-full">
                <CardContent className="p-4 md:p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-muted-foreground mb-1 truncate">{title}</p>
                            <p className={cn('text-2xl md:text-3xl font-bold tabular-nums', color)}>{animated}</p>
                            {subtitle && <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>}
                        </div>
                        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', bgColor)}>
                            <Icon className={cn('w-4 h-4', color)} />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

interface DashboardProps {
    questions: DSAQuestion[];
    dueToday: DSAQuestion[];
    stats: UserStats;
}

export function Dashboard({ questions, dueToday, stats }: DashboardProps) {
    const weakQuestions = questions.filter((q) => q.confidence <= 2);
    const mediumQuestions = questions.filter((q) => q.confidence === 3);
    const strongQuestions = questions.filter((q) => q.confidence >= 4);
    const avgConfidence =
        questions.length > 0
            ? questions.reduce((s, q) => s + q.confidence, 0) / questions.length
            : 0;

    const upcoming7 = questions.filter((q) => {
        const days = Math.ceil(
            (new Date(q.nextRevision).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return days > 0 && days <= 7;
    });

    const recentRevisions = [...questions]
        .filter((q) => q.lastRevised)
        .sort((a, b) => new Date(b.lastRevised).getTime() - new Date(a.lastRevised).getTime())
        .slice(0, 5);

    const unlockedAchievements = stats.achievements.filter((a) => a.unlockedAt);

    const statCards = [
        {
            title: 'Total Questions',
            value: questions.length,
            icon: BookOpen,
            color: 'text-primary',
            bgColor: 'bg-primary/10',
            subtitle: 'tracked problems',
        },
        {
            title: 'Due Today',
            value: dueToday.length,
            icon: Clock,
            color: dueToday.length > 0 ? 'text-destructive' : 'text-success',
            bgColor: dueToday.length > 0 ? 'bg-destructive/10' : 'bg-success/10',
            subtitle: dueToday.length > 0 ? 'need revision' : 'all clear!',
        },
        {
            title: 'Weak Questions',
            value: weakQuestions.length,
            icon: AlertTriangle,
            color: 'text-destructive',
            bgColor: 'bg-destructive/10',
            subtitle: 'confidence ≤ 2',
        },
        {
            title: 'Strong Questions',
            value: strongQuestions.length,
            icon: TrendingUp,
            color: 'text-success',
            bgColor: 'bg-success/10',
            subtitle: 'confidence ≥ 4',
        },
        {
            title: 'Revision Streak',
            value: stats.currentStreak,
            icon: Flame,
            color: 'text-warning',
            bgColor: 'bg-warning/10',
            subtitle: `best: ${stats.longestStreak} days`,
        },
        {
            title: 'Avg Confidence',
            value: Math.round(avgConfidence * 10) / 10,
            icon: Star,
            color: 'text-primary',
            bgColor: 'bg-primary/10',
            subtitle: `out of 5`,
        },
        {
            title: 'Upcoming (7d)',
            value: upcoming7.length,
            icon: Calendar,
            color: 'text-info',
            bgColor: 'bg-info/10',
            subtitle: 'due in 7 days',
        },
        {
            title: 'Medium Questions',
            value: mediumQuestions.length,
            icon: Target,
            color: 'text-warning',
            bgColor: 'bg-warning/10',
            subtitle: 'confidence = 3',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Welcome banner */}
            {questions.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-5 md:p-6 bg-primary/5 border border-primary/20"
                >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base font-semibold text-foreground text-balance">Welcome to DSA Revision Tracker Pro 🎯</h2>
                            <p className="text-sm text-muted-foreground mt-1 text-pretty">
                                Start tracking your first DSA problem. Use spaced repetition to build long-term retention.
                            </p>
                        </div>
                        <Link to="/questions">
                            <Button size="sm" className="gap-2 shrink-0">
                                Add First Question <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {statCards.map((card, i) => (
                    <StatCard key={card.title} {...card} delay={i * 0.05} />
                ))}
            </div>

            {/* XP & Level Progress */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <Card className="border-border/50 shadow-card">
                    <CardHeader className="pb-3 pt-4 px-5">
                        <div className="flex items-center justify-between gap-4">
                            <CardTitle className="text-sm font-semibold text-balance">Level Progress</CardTitle>
                            <div className="flex items-center gap-2 shrink-0">
                                <Zap className="w-4 h-4 text-primary" />
                                <span className="text-sm font-bold text-primary">{stats.totalXP} XP</span>
                                <Badge variant="secondary" className="text-xs">Lvl {stats.level}</Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-5 pb-4">
                        <Progress value={(stats.totalXP % 100)} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1.5">
                            {100 - (stats.totalXP % 100)} XP to Level {stats.level + 1}
                        </p>
                    </CardContent>
                </Card>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Due Today list */}
                <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 }}
                >
                    <Card className="border-border/50 shadow-card h-full flex flex-col">
                        <CardHeader className="pb-3 pt-4 px-5">
                            <div className="flex items-center justify-between gap-2">
                                <CardTitle className="text-sm font-semibold text-balance">Due for Revision</CardTitle>
                                {dueToday.length > 0 && (
                                    <Link to="/revision">
                                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary hover:text-primary">
                                            View all <ArrowRight className="w-3 h-3" />
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="px-5 pb-4 flex-1">
                            {dueToday.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mb-2">
                                        <TrendingUp className="w-5 h-5 text-success" />
                                    </div>
                                    <p className="text-sm font-medium text-foreground">All caught up!</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">No revisions due today.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {dueToday.slice(0, 5).map((q) => {
                                        const days = Math.ceil(
                                            (new Date(q.nextRevision).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                                        );
                                        return (
                                            <div key={q.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                                                <div className={cn(
                                                    'w-1.5 h-1.5 rounded-full shrink-0',
                                                    days < 0 ? 'bg-destructive' : 'bg-warning'
                                                )} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-foreground truncate">{q.name}</p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {days < 0 ? `${Math.abs(days)}d overdue` : 'Due today'} · {q.difficulty}
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className="text-[10px] shrink-0">
                                                    {CONFIDENCE_LABELS[q.confidence]}
                                                </Badge>
                                            </div>
                                        );
                                    })}
                                    {dueToday.length > 5 && (
                                        <p className="text-xs text-muted-foreground text-center pt-1">
                                            +{dueToday.length - 5} more
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Achievements */}
                <motion.div
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Card className="border-border/50 shadow-card h-full flex flex-col">
                        <CardHeader className="pb-3 pt-4 px-5">
                            <div className="flex items-center justify-between gap-2">
                                <CardTitle className="text-sm font-semibold text-balance">Achievements</CardTitle>
                                <Badge variant="secondary" className="text-xs">
                                    {unlockedAchievements.length}/{stats.achievements.length}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="px-5 pb-4 flex-1">
                            <div className="grid grid-cols-3 gap-2">
                                {stats.achievements.slice(0, 9).map((ach) => (
                                    <div
                                        key={ach.id}
                                        className={cn(
                                            'flex flex-col items-center gap-1 p-2 rounded-lg border transition-all',
                                            ach.unlockedAt
                                                ? 'border-primary/30 bg-primary/5'
                                                : 'border-border/30 bg-muted/30 opacity-40 grayscale'
                                        )}
                                        title={ach.description}
                                    >
                                        <span className="text-lg">{ach.icon}</span>
                                        <p className="text-[10px] font-medium text-center leading-tight text-foreground line-clamp-2">{ach.title}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Recent revisions */}
            {recentRevisions.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65 }}
                >
                    <Card className="border-border/50 shadow-card">
                        <CardHeader className="pb-3 pt-4 px-5">
                            <CardTitle className="text-sm font-semibold text-balance">Recent Revisions</CardTitle>
                        </CardHeader>
                        <CardContent className="px-5 pb-4">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-max text-xs">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground whitespace-nowrap">Question</th>
                                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground whitespace-nowrap">Platform</th>
                                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground whitespace-nowrap">Confidence</th>
                                            <th className="text-left py-2 font-medium text-muted-foreground whitespace-nowrap">Last Revised</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentRevisions.map((q) => (
                                            <tr key={q.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                                                <td className="py-2 pr-4 font-medium text-foreground whitespace-nowrap max-w-[180px] truncate">{q.name}</td>
                                                <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">{q.platform}</td>
                                                <td className="py-2 pr-4 whitespace-nowrap">
                                                    <span className="font-medium text-foreground">{q.confidence}</span>
                                                    <span className="text-muted-foreground"> / 5</span>
                                                </td>
                                                <td className="py-2 text-muted-foreground whitespace-nowrap">{formatDate(q.lastRevised)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    );
}
