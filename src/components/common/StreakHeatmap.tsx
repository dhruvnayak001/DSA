import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { StreakCalendarDay } from '@/types/types';
import { cn } from '@/lib/utils';

interface StreakHeatmapProps {
    data: StreakCalendarDay[];
    className?: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function getIntensity(count: number): number {
    if (count === 0) return 0;
    if (count <= 1) return 1;
    if (count <= 3) return 2;
    if (count <= 5) return 3;
    return 4;
}

const CELL_SIZE = 13;
const CELL_GAP = 3;

export function StreakHeatmap({ data, className }: StreakHeatmapProps) {
    const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

    const { grid, monthLabels, maxCount } = useMemo(() => {
        // Build a map of date → count
        const countMap = new Map<string, number>();
        let max = 0;
        for (const d of data) {
            countMap.set(d.date, d.count);
            if (d.count > max) max = d.count;
        }

        // Generate 53 weeks × 7 days grid ending today
        const today = new Date();
        const cells: { date: string; count: number; week: number; day: number }[] = [];
        const months: { label: string; week: number }[] = [];

        // Find the starting Sunday (53 weeks ago)
        const start = new Date(today);
        start.setDate(start.getDate() - (52 * 7 + today.getDay()));

        let lastMonth = -1;
        for (let i = 0; i < 53 * 7; i++) {
            const current = new Date(start);
            current.setDate(start.getDate() + i);

            if (current > today) break;

            const dateStr = current.toISOString().split('T')[0];
            const week = Math.floor(i / 7);
            const day = i % 7;

            cells.push({
                date: dateStr,
                count: countMap.get(dateStr) || 0,
                week,
                day,
            });

            // Track month labels
            const month = current.getMonth();
            if (month !== lastMonth) {
                months.push({ label: MONTHS[month], week });
                lastMonth = month;
            }
        }

        return { grid: cells, monthLabels: months, maxCount: max };
    }, [data]);

    const totalWeeks = Math.max(...grid.map(c => c.week)) + 1;
    const svgWidth = totalWeeks * (CELL_SIZE + CELL_GAP) + 32;
    const svgHeight = 7 * (CELL_SIZE + CELL_GAP) + 28;

    return (
        <div className={cn('relative', className)}>
            <div className="overflow-x-auto pb-2">
                <svg
                    width={svgWidth}
                    height={svgHeight}
                    className="block"
                    role="img"
                    aria-label="Activity heatmap"
                >
                    {/* Month labels */}
                    {monthLabels.map((m, i) => (
                        <text
                            key={`month-${i}`}
                            x={m.week * (CELL_SIZE + CELL_GAP) + 32}
                            y={10}
                            className="fill-muted-foreground"
                            fontSize={10}
                            fontFamily="inherit"
                        >
                            {m.label}
                        </text>
                    ))}

                    {/* Day labels */}
                    {DAYS.map((d, i) => (
                        d && (
                            <text
                                key={`day-${i}`}
                                x={0}
                                y={i * (CELL_SIZE + CELL_GAP) + 28 + CELL_SIZE - 2}
                                className="fill-muted-foreground"
                                fontSize={9}
                                fontFamily="inherit"
                            >
                                {d}
                            </text>
                        )
                    ))}

                    {/* Cells */}
                    {grid.map((cell) => {
                        const intensity = getIntensity(cell.count);
                        const x = cell.week * (CELL_SIZE + CELL_GAP) + 32;
                        const y = cell.day * (CELL_SIZE + CELL_GAP) + 20;

                        const colorClasses = [
                            'fill-[hsl(var(--heatmap-empty))]',
                            'fill-[hsl(var(--heatmap-low))]',
                            'fill-[hsl(var(--heatmap-medium))]',
                            'fill-[hsl(var(--heatmap-high))]',
                            'fill-[hsl(var(--heatmap-max))]',
                        ];

                        return (
                            <TooltipProvider key={cell.date} delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <rect
                                            x={x}
                                            y={y}
                                            width={CELL_SIZE}
                                            height={CELL_SIZE}
                                            rx={2.5}
                                            className={cn(
                                                'transition-all duration-150 cursor-pointer',
                                                colorClasses[intensity],
                                                'hover:stroke-foreground hover:stroke-[1.5]'
                                            )}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                        <span className="font-medium">{cell.count} revision{cell.count !== 1 ? 's' : ''}</span>
                                        <span className="text-muted-foreground ml-1.5">
                                            {new Date(cell.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    })}
                </svg>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-muted-foreground">
                <span>Less</span>
                {[0, 1, 2, 3, 4].map((level) => {
                    const colors = [
                        'bg-[hsl(var(--heatmap-empty))]',
                        'bg-[hsl(var(--heatmap-low))]',
                        'bg-[hsl(var(--heatmap-medium))]',
                        'bg-[hsl(var(--heatmap-high))]',
                        'bg-[hsl(var(--heatmap-max))]',
                    ];
                    return (
                        <div
                            key={level}
                            className={cn('w-[11px] h-[11px] rounded-[2px]', colors[level])}
                        />
                    );
                })}
                <span>More</span>
            </div>
        </div>
    );
}
