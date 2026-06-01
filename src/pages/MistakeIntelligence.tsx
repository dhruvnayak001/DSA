import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingDown, Brain, Lightbulb, Target, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { DSAQuestion, MistakePattern, WeakTopicInsight } from '@/types/types';
import { CONFIDENCE_LABELS, groupBy } from '@/utils/helpers';
import { cn } from '@/lib/utils';

interface MistakeIntelligenceProps {
    questions: DSAQuestion[];
}

const MISTAKE_PATTERNS = [
    { key: 'edge_case', label: 'Edge Case Errors', keywords: ['edge case', 'edge', 'boundary', 'null', 'empty', 'zero', 'single'] },
    { key: 'binary_search', label: 'Binary Search Mistakes', keywords: ['binary search', 'binary', 'mid', 'overflow', 'left', 'right pointer'] },
    { key: 'dp_state', label: 'DP State Errors', keywords: ['dp', 'dynamic', 'state', 'transition', 'memoization', 'tabulation', 'subproblem'] },
    { key: 'greedy', label: 'Greedy Mistakes', keywords: ['greedy', 'optimal', 'local optimal', 'globally'] },
    { key: 'graph', label: 'Graph Traversal Errors', keywords: ['graph', 'bfs', 'dfs', 'visited', 'cycle', 'traversal', 'topological'] },
    { key: 'recursion', label: 'Recursion Errors', keywords: ['recursion', 'recursive', 'base case', 'stack overflow', 'call stack'] },
    { key: 'off_by_one', label: 'Off-by-One Errors', keywords: ['off-by-one', 'off by one', 'index', 'length - 1', 'n-1', 'n+1', 'boundary check'] },
    { key: 'complexity', label: 'Complexity Optimization', keywords: ['brute force', 'o(n²)', 'o(n^2)', 'slow', 'tle', 'time limit', 'optimize'] },
];

export function MistakeIntelligence({ questions: allQuestions }: MistakeIntelligenceProps) {
    const questionsWithMistakes = allQuestions.filter((q) => q.mistakeNotes?.trim());

    const patterns: MistakePattern[] = useMemo(() => {
        return MISTAKE_PATTERNS.map((pattern) => {
            const matched = questionsWithMistakes.filter((q) =>
                pattern.keywords.some((kw) => q.mistakeNotes.toLowerCase().includes(kw))
            );
            return {
                pattern: pattern.label,
                count: matched.length,
                percentage:
                    questionsWithMistakes.length > 0
                        ? Math.round((matched.length / questionsWithMistakes.length) * 100)
                        : 0,
                questions: matched.map((q) => q.name),
            };
        })
            .filter((p) => p.count > 0)
            .sort((a, b) => b.count - a.count);
    }, [questionsWithMistakes]);

    const weakTopics: WeakTopicInsight[] = useMemo(() => {
        const topicMap: Record<string, DSAQuestion[]> = {};
        allQuestions.forEach((q) => {
            q.tags.forEach((tag) => {
                if (!topicMap[tag]) topicMap[tag] = [];
                topicMap[tag].push(q);
            });
        });
        return Object.entries(topicMap)
            .map(([topic, qs]) => {
                const weakCount = qs.filter((q) => q.confidence <= 2).length;
                const avgConfidence = qs.reduce((s, q) => s + q.confidence, 0) / qs.length;
                const mistakeCounts: Record<string, number> = {};
                qs.forEach((q) => {
                    if (!q.mistakeNotes) return;
                    MISTAKE_PATTERNS.forEach((p) => {
                        if (p.keywords.some((kw) => q.mistakeNotes.toLowerCase().includes(kw))) {
                            mistakeCounts[p.label] = (mistakeCounts[p.label] ?? 0) + 1;
                        }
                    });
                });
                const topMistake = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'None';
                return { topic, weakCount, avgConfidence, topMistake };
            })
            .filter((t) => t.weakCount > 0)
            .sort((a, b) => b.weakCount - a.weakCount)
            .slice(0, 8);
    }, [allQuestions]);

    const weakestTopic = weakTopics[0];
    const topPattern = patterns[0];

    const lowestConfCat = useMemo(() => {
        const tagConf: Record<string, number[]> = {};
        allQuestions.forEach((q) => {
            q.tags.forEach((t) => {
                if (!tagConf[t]) tagConf[t] = [];
                tagConf[t].push(q.confidence);
            });
        });
        let lowest = { topic: '', avg: 5 };
        Object.entries(tagConf).forEach(([topic, confs]) => {
            if (confs.length < 2) return;
            const avg = confs.reduce((a, b) => a + b, 0) / confs.length;
            if (avg < lowest.avg) lowest = { topic, avg };
        });
        return lowest;
    }, [allQuestions]);

    // Auto-insights
    const insights = useMemo(() => {
        const list: string[] = [];
        if (topPattern && topPattern.percentage >= 20) {
            list.push(`⚠️ "${topPattern.pattern}" appears in ${topPattern.percentage}% of your mistake notes.`);
        }
        if (weakestTopic && weakestTopic.weakCount >= 2) {
            const pct = Math.round((weakestTopic.weakCount / allQuestions.filter((q) => q.tags.includes(weakestTopic.topic)).length) * 100);
            list.push(`📉 "${weakestTopic.topic}" has ${weakestTopic.weakCount} weak questions (${pct}% of that topic).`);
        }
        if (lowestConfCat.topic) {
            list.push(`🎯 "${lowestConfCat.topic}" has the lowest average confidence: ${lowestConfCat.avg.toFixed(1)} / 5.`);
        }
        const edgeCases = questionsWithMistakes.filter((q) =>
            q.mistakeNotes.toLowerCase().includes('edge case')
        ).length;
        if (edgeCases >= 2) {
            list.push(`🔍 You frequently miss edge cases — found in ${edgeCases} questions.`);
        }
        const weakQs = allQuestions.filter((q) => q.confidence <= 2);
        if (weakQs.length > 0) {
            const topWeakTag = Object.entries(groupBy(weakQs, (q) => q.tags[0] ?? 'Other'))
                .sort((a, b) => b[1].length - a[1].length)[0];
            if (topWeakTag) {
                list.push(`💡 "${topWeakTag[0]}" dominates your weak question list with ${topWeakTag[1].length} problems.`);
            }
        }
        if (list.length === 0) list.push('✅ Not enough data yet — keep adding questions and mistake notes!');
        return list;
    }, [topPattern, weakestTopic, lowestConfCat, questionsWithMistakes, allQuestions]);

    if (allQuestions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Brain className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground text-balance">No data yet</h3>
                <p className="text-sm text-muted-foreground mt-1 text-pretty">Add questions with mistake notes to see intelligent insights.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* AI-style insights */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-primary/20 bg-primary/5 shadow-card">
                    <CardHeader className="pb-2 pt-4 px-5">
                        <CardTitle className="text-sm font-semibold text-balance flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-primary" />
                            AI-Style Insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-4 space-y-2">
                        {insights.map((ins, i) => (
                            <motion.p
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="text-sm text-foreground leading-relaxed text-pretty"
                            >
                                {ins}
                            </motion.p>
                        ))}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Key metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    {
                        label: 'Most Common Weak Topic',
                        value: weakestTopic?.topic ?? 'None',
                        sub: weakestTopic ? `${weakestTopic.weakCount} weak questions` : 'Great job!',
                        icon: TrendingDown,
                        color: 'text-destructive',
                        bg: 'bg-destructive/10',
                    },
                    {
                        label: 'Top Mistake Pattern',
                        value: topPattern?.pattern ?? 'None detected',
                        sub: topPattern ? `${topPattern.count} occurrences` : 'Add more notes',
                        icon: AlertTriangle,
                        color: 'text-warning',
                        bg: 'bg-warning/10',
                    },
                    {
                        label: 'Lowest Confidence Topic',
                        value: lowestConfCat.topic || 'None',
                        sub: lowestConfCat.topic ? `Avg: ${lowestConfCat.avg.toFixed(1)} / 5` : 'No data',
                        icon: Target,
                        color: 'text-info',
                        bg: 'bg-info/10',
                    },
                ].map(({ label, value, sub, icon: Icon, color, bg }, i) => (
                    <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <Card className="border-border/50 shadow-card h-full">
                            <CardContent className="p-4 flex items-start gap-3">
                                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', bg)}>
                                    <Icon className={cn('w-4 h-4', color)} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-medium text-muted-foreground mb-0.5">{label}</p>
                                    <p className="text-sm font-semibold text-foreground truncate" title={value}>{value}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Mistake patterns */}
                <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="border-border/50 shadow-card h-full flex flex-col">
                        <CardHeader className="pb-2 pt-4 px-5">
                            <CardTitle className="text-sm font-semibold text-balance flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-primary" />
                                Mistake Pattern Analysis
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                From {questionsWithMistakes.length} questions with mistake notes
                            </p>
                        </CardHeader>
                        <CardContent className="px-5 pb-5 flex-1 space-y-3">
                            {patterns.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-pretty">No mistake patterns detected yet. Add mistake notes to questions.</p>
                            ) : (
                                patterns.map((p) => (
                                    <div key={p.pattern} className="space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-medium text-foreground truncate">{p.pattern}</span>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-xs text-muted-foreground">{p.count}</span>
                                                <Badge variant="outline" className="text-[10px]">{p.percentage}%</Badge>
                                            </div>
                                        </div>
                                        <Progress value={p.percentage} className="h-1.5" />
                                        {p.questions.length > 0 && (
                                            <p className="text-[10px] text-muted-foreground truncate">
                                                e.g. {p.questions.slice(0, 2).join(', ')}
                                                {p.questions.length > 2 ? ` +${p.questions.length - 2} more` : ''}
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Weak topics */}
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
                    <Card className="border-border/50 shadow-card h-full flex flex-col">
                        <CardHeader className="pb-2 pt-4 px-5">
                            <CardTitle className="text-sm font-semibold text-balance flex items-center gap-2">
                                <Brain className="w-4 h-4 text-destructive" />
                                Weak Topic Detector
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-5 pb-5 flex-1 space-y-2">
                            {weakTopics.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-pretty">No weak topics found. Keep revising!</p>
                            ) : (
                                weakTopics.map((topic, _i) => (
                                    <div key={topic.topic} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                                        <span className="text-xs font-bold text-muted-foreground w-5 text-right shrink-0">{_i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-medium text-foreground truncate">{topic.topic}</span>
                                                <span className="text-[10px] font-medium text-destructive shrink-0">{topic.weakCount} weak</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-muted-foreground">Avg: {topic.avgConfidence.toFixed(1)}/5</span>
                                                {topic.topMistake !== 'None' && (
                                                    <>
                                                        <span className="text-muted-foreground">·</span>
                                                        <span className="text-[10px] text-muted-foreground truncate">{topic.topMistake}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* All weak questions list */}
            {allQuestions.filter((q) => q.confidence <= 2).length > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Card className="border-border/50 shadow-card">
                        <CardHeader className="pb-2 pt-4 px-5">
                            <CardTitle className="text-sm font-semibold text-balance">Questions Needing Attention</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">Confidence ≤ 2</p>
                        </CardHeader>
                        <CardContent className="px-5 pb-5">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-max text-xs">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground whitespace-nowrap">Question</th>
                                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground whitespace-nowrap">Topic</th>
                                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground whitespace-nowrap">Confidence</th>
                                            <th className="text-left py-2 font-medium text-muted-foreground whitespace-nowrap">Primary Mistake</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allQuestions
                                            .filter((q) => q.confidence <= 2)
                                            .sort((a, b) => a.confidence - b.confidence)
                                            .map((q) => {
                                                const mainPattern = MISTAKE_PATTERNS.find((p) =>
                                                    p.keywords.some((kw) => (q.mistakeNotes ?? '').toLowerCase().includes(kw))
                                                );
                                                return (
                                                    <tr key={q.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                                                        <td className="py-2 pr-4 font-medium text-foreground whitespace-nowrap max-w-[160px] truncate">{q.name}</td>
                                                        <td className="py-2 pr-4 whitespace-nowrap">
                                                            <div className="flex gap-1">
                                                                {q.tags.slice(0, 2).map((t) => (
                                                                    <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="py-2 pr-4 whitespace-nowrap">
                                                            <span className="font-medium text-destructive">{q.confidence}</span>
                                                            <span className="text-muted-foreground"> ({CONFIDENCE_LABELS[q.confidence]})</span>
                                                        </td>
                                                        <td className="py-2 text-muted-foreground whitespace-nowrap max-w-[160px] truncate">
                                                            {mainPattern?.label ?? (q.mistakeNotes ? q.mistakeNotes.slice(0, 40) + '...' : '—')}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
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
