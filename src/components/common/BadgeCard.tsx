import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Badge, BadgeTier } from '@/types/types';
import { cn } from '@/lib/utils';

interface BadgeCardProps {
    badge: Badge;
    onClick?: (badge: Badge) => void;
    index?: number;
}

const TIER_RING_COLORS: Record<BadgeTier, string> = {
    bronze: 'from-amber-600 via-amber-500 to-yellow-600',
    silver: 'from-slate-300 via-gray-200 to-slate-400',
    gold: 'from-yellow-400 via-amber-300 to-yellow-500',
    platinum: 'from-violet-400 via-purple-300 to-indigo-500',
};

const TIER_BG: Record<BadgeTier, string> = {
    bronze: 'bg-amber-500/5 border-amber-500/20',
    silver: 'bg-slate-400/5 border-slate-400/20',
    gold: 'bg-yellow-500/5 border-yellow-500/20',
    platinum: 'bg-violet-500/5 border-violet-500/20',
};

const TIER_LABELS: Record<BadgeTier, string> = {
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
};

const TIER_TEXT: Record<BadgeTier, string> = {
    bronze: 'text-amber-600 dark:text-amber-400',
    silver: 'text-slate-500 dark:text-slate-300',
    gold: 'text-yellow-600 dark:text-yellow-400',
    platinum: 'text-violet-600 dark:text-violet-400',
};

function ProgressRing({ progress, tier, size = 72 }: { progress: number; tier: BadgeTier; size?: number }) {
    const strokeWidth = 3;
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    const strokeColor: Record<BadgeTier, string> = {
        bronze: 'stroke-amber-500',
        silver: 'stroke-slate-400',
        gold: 'stroke-yellow-500',
        platinum: 'stroke-violet-500',
    };

    return (
        <svg width={size} height={size} className="absolute inset-0">
            {/* Background ring */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-border/40"
            />
            {/* Progress ring */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                className={cn(strokeColor[tier], 'progress-ring-animate')}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{
                    '--circumference': circumference,
                    '--offset': offset,
                    transform: 'rotate(-90deg)',
                    transformOrigin: '50% 50%',
                } as React.CSSProperties}
            />
        </svg>
    );
}

export function BadgeCard({ badge, onClick, index = 0 }: BadgeCardProps) {
    const isUnlocked = !!badge.unlockedAt;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, delay: index * 0.04, ease: 'easeOut' }}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
        >
            <TooltipProvider delayDuration={300}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={() => onClick?.(badge)}
                            className={cn(
                                'relative w-full flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 cursor-pointer group',
                                isUnlocked
                                    ? cn(TIER_BG[badge.tier], `badge-glow-${badge.tier}`, 'badge-shine')
                                    : 'bg-muted/30 border-border/30 opacity-60 hover:opacity-80'
                            )}
                        >
                            {/* Badge icon with ring */}
                            <div className="relative w-[72px] h-[72px] flex items-center justify-center">
                                {!isUnlocked && (
                                    <ProgressRing progress={badge.progress} tier={badge.tier} />
                                )}
                                {isUnlocked && (
                                    <div className={cn(
                                        'absolute inset-0 rounded-full bg-gradient-to-br opacity-20',
                                        TIER_RING_COLORS[badge.tier]
                                    )} />
                                )}
                                <span className={cn(
                                    'text-3xl z-10 transition-transform duration-200 group-hover:scale-110',
                                    !isUnlocked && 'grayscale opacity-50'
                                )}>
                                    {badge.icon}
                                </span>
                                {!isUnlocked && (
                                    <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center z-20">
                                        <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                                    </div>
                                )}
                            </div>

                            {/* Title */}
                            <div className="text-center min-w-0 w-full">
                                <p className={cn(
                                    'text-xs font-semibold truncate',
                                    isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                                )}>
                                    {badge.title}
                                </p>
                                <p className={cn(
                                    'text-[10px] font-medium mt-0.5',
                                    TIER_TEXT[badge.tier],
                                    !isUnlocked && 'opacity-50'
                                )}>
                                    {TIER_LABELS[badge.tier]}
                                </p>
                            </div>

                            {/* Progress bar for locked badges */}
                            {!isUnlocked && (
                                <div className="w-full">
                                    <div className="h-1 bg-border/50 rounded-full overflow-hidden">
                                        <motion.div
                                            className={cn(
                                                'h-full rounded-full',
                                                badge.tier === 'bronze' && 'bg-amber-500',
                                                badge.tier === 'silver' && 'bg-slate-400',
                                                badge.tier === 'gold' && 'bg-yellow-500',
                                                badge.tier === 'platinum' && 'bg-violet-500',
                                            )}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${badge.progress}%` }}
                                            transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.04 + 0.3 }}
                                        />
                                    </div>
                                    <p className="text-[9px] text-muted-foreground mt-1">
                                        {badge.current}/{badge.target}
                                    </p>
                                </div>
                            )}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                        <p className="font-medium text-xs">{badge.title}</p>
                        <p className="text-[11px] text-muted-foreground">{badge.description}</p>
                        {isUnlocked && badge.unlockedAt && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                                Unlocked {new Date(badge.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                        )}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </motion.div>
    );
}
