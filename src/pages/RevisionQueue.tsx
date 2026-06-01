import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Eye, Clock, ExternalLink, Zap, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuestionDetailsModal } from '@/components/common/QuestionDetailsModal';
import type { DSAQuestion } from '@/types/types';
import {
    CONFIDENCE_LABELS,
    CONFIDENCE_BG,
    DIFFICULTY_COLORS,
    getDaysUntilRevision,
    formatDate,
} from '@/utils/helpers';
import { cn } from '@/lib/utils';

interface RevisionQueueProps {
    dueToday: DSAQuestion[];
    allQuestions: DSAQuestion[];
    onMarkRevised: (id: string) => void;
}

export function RevisionQueue({ dueToday, allQuestions, onMarkRevised }: RevisionQueueProps) {
    const [viewQ, setViewQ] = useState<DSAQuestion | null>(null);
    const [filter, setFilter] = useState<'all' | 'overdue' | 'today'>('all');

    const overdue = dueToday.filter((q) => getDaysUntilRevision(q.nextRevision) < 0);
    const dueNow = dueToday.filter((q) => getDaysUntilRevision(q.nextRevision) === 0);

    const displayed = dueToday.filter((q) => {
        const d = getDaysUntilRevision(q.nextRevision);
        if (filter === 'overdue') return d < 0;
        if (filter === 'today') return d === 0;
        return true;
    }).sort((a, b) => getDaysUntilRevision(a.nextRevision) - getDaysUntilRevision(b.nextRevision));

    const upcoming7 = allQuestions.filter((q) => {
        const d = getDaysUntilRevision(q.nextRevision);
        return d > 0 && d <= 7;
    }).sort((a, b) => getDaysUntilRevision(a.nextRevision) - getDaysUntilRevision(b.nextRevision));

    return (
        <div className="space-y-5">
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Overdue', count: overdue.length, color: 'text-destructive', bg: 'bg-destructive/10' },
                    { label: 'Due Today', count: dueNow.length, color: 'text-warning', bg: 'bg-warning/10' },
                    { label: 'This Week', count: upcoming7.length, color: 'text-success', bg: 'bg-success/10' },
                ].map(({ label, count, color }) => (
                    <motion.div
                        key={label}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -2 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card className="border-border/50 shadow-card">
                            <CardContent className="p-4 text-center">
                                <p className={cn('text-2xl font-bold tabular-nums', color)}>{count}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Filter */}
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-foreground">
                    {displayed.length > 0
                        ? `${displayed.length} question${displayed.length !== 1 ? 's' : ''} to revise`
                        : 'All caught up!'}
                </h2>
                <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                    <SelectTrigger className="h-8 text-xs w-32">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Due</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="today">Due Today</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Empty state */}
            {dueToday.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                >
                    <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                        <TrendingUp className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground text-balance">You're all caught up! 🎉</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs text-pretty">
                        No questions are due for revision today. Keep up the great work!
                    </p>
                </motion.div>
            )}

            {/* Due list */}
            {displayed.length > 0 && (
                <div className="space-y-3">
                    {displayed.map((q, idx) => {
                        const days = getDaysUntilRevision(q.nextRevision);
                        const isOverdue = days < 0;
                        const isToday = days === 0;
                        return (
                            <motion.div
                                key={q.id}
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Card className={cn(
                                    'border shadow-card hover:shadow-hover transition-all',
                                    isOverdue ? 'border-destructive/30 bg-destructive/5' : 'border-warning/30 bg-warning/5'
                                )}>
                                    <CardContent className="p-4">
                                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                                            {/* Urgency indicator */}
                                            <div className={cn(
                                                'w-1 self-stretch rounded-full shrink-0 hidden md:block',
                                                isOverdue ? 'bg-destructive' : 'bg-warning'
                                            )} />

                                            {/* Info */}
                                            <div className="flex-1 min-w-0 space-y-1.5">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-sm font-semibold text-foreground truncate max-w-xs">{q.name}</h3>
                                                    {q.url && (
                                                        <a href={q.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <Badge className={cn('text-[10px] border', DIFFICULTY_COLORS[q.difficulty])}>{q.difficulty}</Badge>
                                                    <Badge className={cn('text-[10px] border', CONFIDENCE_BG[q.confidence])}>
                                                        {CONFIDENCE_LABELS[q.confidence]}
                                                    </Badge>
                                                    <span className="text-[11px] text-muted-foreground">{q.platform}</span>
                                                    {q.tags.slice(0, 3).map((t) => (
                                                        <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3 h-3 text-muted-foreground" />
                                                    <span className={cn(
                                                        'text-xs font-medium',
                                                        isOverdue ? 'text-destructive' : 'text-warning'
                                                    )}>
                                                        {isOverdue
                                                            ? `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} overdue`
                                                            : isToday
                                                                ? 'Due today'
                                                                : `Due in ${days} day${days !== 1 ? 's' : ''}`}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">· Last: {formatDate(q.lastRevised)}</span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setViewQ(q)}
                                                    className="h-8 gap-1.5 text-xs"
                                                >
                                                    <Eye className="w-3 h-3" /> View
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => onMarkRevised(q.id)}
                                                    className="h-8 gap-1.5 text-xs"
                                                >
                                                    <CheckCircle className="w-3 h-3" /> Mark Revised
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Upcoming section */}
            {upcoming7.length > 0 && (
                <div className="pt-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        Upcoming This Week
                    </h3>
                    <div className="space-y-2">
                        {upcoming7.slice(0, 5).map((q) => {
                            const days = getDaysUntilRevision(q.nextRevision);
                            return (
                                <div key={q.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                                    <div className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-foreground truncate">{q.name}</p>
                                        <p className="text-[11px] text-muted-foreground">In {days}d · {q.platform}</p>
                                    </div>
                                    <Badge className={cn('text-[10px] border', CONFIDENCE_BG[q.confidence])}>
                                        {CONFIDENCE_LABELS[q.confidence]}
                                    </Badge>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <QuestionDetailsModal
                question={viewQ}
                open={!!viewQ}
                onClose={() => setViewQ(null)}
                onMarkRevised={(id) => { onMarkRevised(id); setViewQ(null); }}
            />
        </div>
    );
}
