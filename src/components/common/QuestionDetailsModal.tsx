import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, CheckCircle, Clock, Code2, Tag, AlertCircle, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { DSAQuestion } from '@/types/types';
import {
    CONFIDENCE_LABELS,
    CONFIDENCE_BG,
    DIFFICULTY_COLORS,
    formatDate,
} from '@/utils/helpers';
import { cn } from '@/lib/utils';

interface QuestionDetailsModalProps {
    question: DSAQuestion | null;
    open: boolean;
    onClose: () => void;
    onEdit?: (q: DSAQuestion) => void;
    onMarkRevised?: (id: string) => void;
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-primary" />
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</h4>
            </div>
            {children}
        </div>
    );
}

export function QuestionDetailsModal({ question, open, onClose, onEdit, onMarkRevised }: QuestionDetailsModalProps) {
    if (!question) return null;

    const confidenceHistory = question.revisionHistory.slice(-10).reverse();

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-card border border-border rounded-xl shadow-hover w-full max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-base font-semibold text-foreground text-balance leading-snug">{question.name}</h2>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <Badge className={cn('text-xs border', DIFFICULTY_COLORS[question.difficulty])}>
                                            {question.difficulty}
                                        </Badge>
                                        <Badge className={cn('text-xs border', CONFIDENCE_BG[question.confidence])}>
                                            {CONFIDENCE_LABELS[question.confidence]}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">{question.platform}</span>
                                        {question.url && (
                                            <a
                                                href={question.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                                            >
                                                Open Problem <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground shrink-0">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="p-5 space-y-5">
                                {/* Tags */}
                                {question.tags.length > 0 && (
                                    <Section title="Topic Tags" icon={Tag}>
                                        <div className="flex flex-wrap gap-1.5">
                                            {question.tags.map((tag) => (
                                                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                            ))}
                                        </div>
                                    </Section>
                                )}

                                {/* Complexity */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-muted/40 rounded-lg p-3">
                                        <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Time Complexity</p>
                                        <p className="text-sm font-mono font-semibold text-foreground">
                                            {question.timeComplexity || '—'}
                                        </p>
                                    </div>
                                    <div className="bg-muted/40 rounded-lg p-3">
                                        <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Space Complexity</p>
                                        <p className="text-sm font-mono font-semibold text-foreground">
                                            {question.spaceComplexity || '—'}
                                        </p>
                                    </div>
                                </div>

                                {/* Approach */}
                                {question.approachSummary && (
                                    <Section title="Approach Summary" icon={Code2}>
                                        <p className="text-sm text-foreground bg-muted/30 rounded-lg p-3 leading-relaxed text-pretty">
                                            {question.approachSummary}
                                        </p>
                                    </Section>
                                )}

                                {/* Optimal approach */}
                                {question.optimalApproach && (
                                    <Section title="Optimal Approach" icon={CheckCircle}>
                                        <p className="text-sm text-foreground bg-muted/30 rounded-lg p-3 leading-relaxed text-pretty">
                                            {question.optimalApproach}
                                        </p>
                                    </Section>
                                )}

                                {/* Mistake notes */}
                                {question.mistakeNotes && (
                                    <Section title="Mistake Notes" icon={AlertCircle}>
                                        <p className="text-sm text-foreground bg-destructive/5 border border-destructive/10 rounded-lg p-3 leading-relaxed text-pretty">
                                            {question.mistakeNotes}
                                        </p>
                                    </Section>
                                )}

                                {/* Revision schedule */}
                                <Section title="Revision Schedule" icon={Clock}>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-muted/40 rounded-lg p-3">
                                            <p className="text-[10px] text-muted-foreground uppercase mb-1">Last Revised</p>
                                            <p className="text-sm font-medium text-foreground">{formatDate(question.lastRevised)}</p>
                                        </div>
                                        <div className="bg-muted/40 rounded-lg p-3">
                                            <p className="text-[10px] text-muted-foreground uppercase mb-1">Next Revision</p>
                                            <p className="text-sm font-medium text-foreground">{formatDate(question.nextRevision)}</p>
                                        </div>
                                    </div>
                                </Section>

                                {/* Confidence timeline */}
                                {confidenceHistory.length > 0 && (
                                    <Section title="Confidence Timeline" icon={History}>
                                        <div className="flex items-end gap-1.5 h-12">
                                            {confidenceHistory.map((entry, i) => (
                                                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                                                    <div
                                                        className="w-full rounded-sm bg-primary/80 transition-all"
                                                        style={{ height: `${(entry.confidence / 5) * 40}px` }}
                                                        title={`${formatDate(entry.date)}: ${CONFIDENCE_LABELS[entry.confidence]}`}
                                                    />
                                                    <span className="text-[9px] text-muted-foreground">{entry.confidence}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                                            <span>Oldest</span>
                                            <span>Latest</span>
                                        </div>
                                    </Section>
                                )}

                                {/* Revision history */}
                                {question.revisionHistory.length > 0 && (
                                    <Section title="Revision History" icon={History}>
                                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                            {[...question.revisionHistory].reverse().map((entry, i) => (
                                                <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                                                    <span className="text-xs text-muted-foreground">{formatDate(entry.date)}</span>
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {CONFIDENCE_LABELS[entry.confidence]}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </Section>
                                )}

                                {/* Actions */}
                                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                                    {onMarkRevised && (
                                        <Button
                                            size="sm"
                                            onClick={() => { onMarkRevised(question.id); onClose(); }}
                                            className="gap-1.5 h-9"
                                        >
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            Mark Revised
                                        </Button>
                                    )}
                                    {onEdit && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => { onEdit(question); onClose(); }}
                                            className="h-9"
                                        >
                                            Edit
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="sm" onClick={onClose} className="h-9 ml-auto">
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
