import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DSAQuestion } from '@/types/types';
import { CONFIDENCE_LABELS, groupBy } from '@/utils/helpers';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Filler
);

interface AnalyticsProps {
    questions: DSAQuestion[];
}

const CHART_COLORS = [
    'rgba(99,102,241,0.8)',
    'rgba(34,197,94,0.8)',
    'rgba(245,158,11,0.8)',
    'rgba(239,68,68,0.8)',
    'rgba(14,165,233,0.8)',
    'rgba(168,85,247,0.8)',
    'rgba(236,72,153,0.8)',
    'rgba(20,184,166,0.8)',
];

const BASE_CHART_OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom' as const,
            labels: { font: { size: 11 }, padding: 12, boxWidth: 12 },
        },
        tooltip: { bodyFont: { size: 11 }, titleFont: { size: 12 } },
    },
};

function ChartCard({
    title,
    children,
    height = 220,
    delay = 0,
}: {
    title: string;
    children: React.ReactNode;
    height?: number;
    delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
        >
            <Card className="border-border/50 shadow-card h-full flex flex-col">
                <CardHeader className="pb-2 pt-4 px-5">
                    <CardTitle className="text-sm font-semibold text-balance">{title}</CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 flex-1">
                    <div style={{ height }}>{children}</div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export function Analytics({ questions }: AnalyticsProps) {
    const topicData = useMemo(() => {
        const counts: Record<string, number> = {};
        questions.forEach((q) => q.tags.forEach((t) => { counts[t] = (counts[t] ?? 0) + 1; }));
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
        return {
            labels: sorted.map(([t]) => t),
            datasets: [{
                data: sorted.map(([, c]) => c),
                backgroundColor: CHART_COLORS,
                borderWidth: 0,
            }],
        };
    }, [questions]);

    const confidenceData = useMemo(() => ({
        labels: [1, 2, 3, 4, 5].map((n) => CONFIDENCE_LABELS[n as 1]),
        datasets: [{
            label: 'Questions',
            data: [1, 2, 3, 4, 5].map((n) => questions.filter((q) => q.confidence === n).length),
            backgroundColor: [
                'rgba(239,68,68,0.8)',
                'rgba(245,158,11,0.8)',
                'rgba(14,165,233,0.8)',
                'rgba(34,197,94,0.8)',
                'rgba(99,102,241,0.8)',
            ],
            borderRadius: 4,
            borderWidth: 0,
        }],
    }), [questions]);

    const platformData = useMemo(() => {
        const counts = groupBy(questions, (q) => q.platform);
        const entries = Object.entries(counts).sort((a, b) => b[1].length - a[1].length);
        return {
            labels: entries.map(([p]) => p),
            datasets: [{
                data: entries.map(([, qs]) => qs.length),
                backgroundColor: CHART_COLORS,
                borderWidth: 0,
            }],
        };
    }, [questions]);

    const difficultyData = useMemo(() => ({
        labels: ['Easy', 'Medium', 'Hard'],
        datasets: [{
            label: 'Questions',
            data: ['Easy', 'Medium', 'Hard'].map((d) => questions.filter((q) => q.difficulty === d).length),
            backgroundColor: ['rgba(34,197,94,0.8)', 'rgba(245,158,11,0.8)', 'rgba(239,68,68,0.8)'],
            borderRadius: 4,
            borderWidth: 0,
        }],
    }), [questions]);

    const revisionActivityData = useMemo(() => {
        const last30: string[] = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last30.push(d.toISOString().split('T')[0]);
        }
        const dailyCounts: Record<string, number> = {};
        questions.forEach((q) => {
            q.revisionHistory.forEach((r) => {
                if (last30.includes(r.date)) {
                    dailyCounts[r.date] = (dailyCounts[r.date] ?? 0) + 1;
                }
            });
        });
        return {
            labels: last30.map((d) => {
                const date = new Date(d);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets: [{
                label: 'Revisions',
                data: last30.map((d) => dailyCounts[d] ?? 0),
                borderColor: 'rgba(99,102,241,1)',
                backgroundColor: 'rgba(99,102,241,0.15)',
                fill: true,
                tension: 0.4,
                pointRadius: 2,
                borderWidth: 2,
            }],
        };
    }, [questions]);

    const monthlyData = useMemo(() => {
        const months: string[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            months.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
        }
        const addedCounts: Record<string, number> = {};
        const revisedCounts: Record<string, number> = {};
        questions.forEach((q) => {
            const addLabel = new Date(q.createdAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            if (months.includes(addLabel)) {
                addedCounts[addLabel] = (addedCounts[addLabel] ?? 0) + 1;
            }
            q.revisionHistory.forEach((r) => {
                const revLabel = new Date(r.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                if (months.includes(revLabel)) {
                    revisedCounts[revLabel] = (revisedCounts[revLabel] ?? 0) + 1;
                }
            });
        });
        return {
            labels: months,
            datasets: [
                {
                    label: 'Added',
                    data: months.map((m) => addedCounts[m] ?? 0),
                    backgroundColor: 'rgba(99,102,241,0.8)',
                    borderRadius: 4,
                    borderWidth: 0,
                },
                {
                    label: 'Revised',
                    data: months.map((m) => revisedCounts[m] ?? 0),
                    backgroundColor: 'rgba(34,197,94,0.8)',
                    borderRadius: 4,
                    borderWidth: 0,
                },
            ],
        };
    }, [questions]);

    // Heatmap data (last 12 weeks × 7 days)
    const heatmapData = useMemo(() => {
        const cells: { date: string; count: number }[] = [];
        const counts: Record<string, number> = {};
        questions.forEach((q) => {
            q.revisionHistory.forEach((r) => {
                counts[r.date] = (counts[r.date] ?? 0) + 1;
            });
        });
        for (let i = 83; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            cells.push({ date: key, count: counts[key] ?? 0 });
        }
        const weeks: { date: string; count: number }[][] = [];
        for (let w = 0; w < 12; w++) {
            weeks.push(cells.slice(w * 7, w * 7 + 7));
        }
        return weeks;
    }, [questions]);

    function heatColor(count: number) {
        if (count === 0) return 'bg-muted/60';
        if (count === 1) return 'bg-primary/25';
        if (count === 2) return 'bg-primary/50';
        if (count <= 4) return 'bg-primary/75';
        return 'bg-primary';
    }

    const avgConfidence =
        questions.length > 0
            ? (questions.reduce((s, q) => s + q.confidence, 0) / questions.length).toFixed(1)
            : '0.0';

    const totalRevisions = questions.reduce((s, q) => s + q.revisionHistory.length, 0);

    const barOptions = {
        ...BASE_CHART_OPTIONS,
        plugins: {
            ...BASE_CHART_OPTIONS.plugins,
            legend: { display: false },
        },
        scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 } } },
            y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 }, stepSize: 1 } },
        },
    };

    if (questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-base font-semibold text-foreground text-balance">No data yet</h3>
                <p className="text-sm text-muted-foreground mt-1 text-pretty">Add questions to see your analytics.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total Questions', value: questions.length, color: 'text-primary' },
                    { label: 'Total Revisions', value: totalRevisions, color: 'text-success' },
                    { label: 'Avg Confidence', value: avgConfidence, color: 'text-warning' },
                    { label: 'Mastered', value: questions.filter((q) => q.confidence === 5).length, color: 'text-info' },
                ].map(({ label, value, color }, i) => (
                    <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className="border-border/50 shadow-card">
                            <CardContent className="p-4 text-center">
                                <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Charts grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ChartCard title="Topic Distribution" delay={0.1}>
                    <Doughnut data={topicData} options={BASE_CHART_OPTIONS} />
                </ChartCard>

                <ChartCard title="Confidence Distribution" delay={0.15}>
                    <Bar data={confidenceData} options={barOptions} />
                </ChartCard>

                <ChartCard title="Platform Distribution" delay={0.2}>
                    <Doughnut data={platformData} options={BASE_CHART_OPTIONS} />
                </ChartCard>

                <ChartCard title="Difficulty Breakdown" delay={0.25}>
                    <Bar data={difficultyData} options={barOptions} />
                </ChartCard>
            </div>

            {/* Full-width charts */}
            <ChartCard title="Revision Activity (Last 30 Days)" height={200} delay={0.3}>
                <Line data={revisionActivityData} options={{
                    ...BASE_CHART_OPTIONS,
                    plugins: { ...BASE_CHART_OPTIONS.plugins, legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 45 } },
                        y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 }, stepSize: 1 } },
                    },
                }} />
            </ChartCard>

            <ChartCard title="Monthly Progress (Last 6 Months)" height={200} delay={0.35}>
                <Bar data={monthlyData} options={{
                    ...BASE_CHART_OPTIONS,
                    scales: {
                        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                        y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 }, stepSize: 1 } },
                    },
                }} />
            </ChartCard>

            {/* Heatmap */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="border-border/50 shadow-card">
                    <CardHeader className="pb-2 pt-4 px-5">
                        <CardTitle className="text-sm font-semibold text-balance">Revision Heatmap (Last 12 Weeks)</CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                        <div className="overflow-x-auto">
                            <div className="flex gap-1 min-w-max">
                                {heatmapData.map((week, wi) => (
                                    <div key={wi} className="flex flex-col gap-1">
                                        {week.map((day, di) => (
                                            <div
                                                key={di}
                                                title={`${day.date}: ${day.count} revision${day.count !== 1 ? 's' : ''}`}
                                                className={`w-3 h-3 rounded-sm transition-colors ${heatColor(day.count)}`}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                                <span className="text-[10px] text-muted-foreground">Less</span>
                                {['bg-muted/60', 'bg-primary/25', 'bg-primary/50', 'bg-primary/75', 'bg-primary'].map((cls) => (
                                    <div key={cls} className={`w-3 h-3 rounded-sm ${cls}`} />
                                ))}
                                <span className="text-[10px] text-muted-foreground">More</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
