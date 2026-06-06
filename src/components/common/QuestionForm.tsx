import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, ExternalLink, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { DSAQuestion, QuestionFormData, ConfidenceLevel } from '@/types/types';
import { PLATFORMS, DIFFICULTIES, COMMON_TAGS, CONFIDENCE_LABELS, validateURL, todayISO } from '@/utils/helpers';
import { toast } from 'sonner';

interface QuestionFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: QuestionFormData) => boolean | Promise<boolean>;
    editQuestion?: DSAQuestion | null;
}

const EMPTY_FORM: QuestionFormData = {
    name: '',
    url: '',
    platform: 'LeetCode',
    difficulty: 'Medium',
    tags: [],
    approachSummary: '',
    optimalApproach: '',
    timeComplexity: '',
    spaceComplexity: '',
    confidence: 3,
    mistakeNotes: '',
    lastRevised: todayISO(),
};

const CONFIDENCE_DESCRIPTIONS: Record<number, string> = {
    1: '😰 Very Weak — Need multiple revisits',
    2: '😟 Weak — Struggle with approach',
    3: '😐 Average — Know the concept, but slow',
    4: '😊 Strong — Can solve confidently',
    5: '🚀 Mastered — Can explain and optimize',
};

export function QuestionForm({ open, onClose, onSubmit, editQuestion }: QuestionFormProps) {
    const [form, setForm] = useState<QuestionFormData>(EMPTY_FORM);
    const [tagInput, setTagInput] = useState('');
    const [errors, setErrors] = useState<Partial<Record<keyof QuestionFormData, string>>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            if (editQuestion) {
                const { id: _id, nextRevision: _nr, revisionHistory: _rh, createdAt: _ca, xpEarned: _xp, ...rest } = editQuestion;
                setForm(rest);
            } else {
                setForm({ ...EMPTY_FORM, lastRevised: todayISO() });
            }
            setErrors({});
            setTagInput('');
        }
    }, [open, editQuestion]);

    function validate(): boolean {
        const e: Partial<Record<keyof QuestionFormData, string>> = {};
        if (!form.name.trim()) e.name = 'Question name is required';
        if (!form.url.trim()) e.url = 'Problem URL is required';
        else if (!validateURL(form.url)) e.url = 'Invalid URL format';
        if (!form.platform) e.platform = 'Platform is required';
        if (!form.difficulty) e.difficulty = 'Difficulty is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) {
            toast.error('Please fix the errors before submitting.');
            return;
        }
        setLoading(true);
        const success = await onSubmit(form);
        setLoading(false);
        if (success) onClose();
    }

    function addTag(tag: string) {
        const t = tag.trim();
        if (t && !form.tags.includes(t)) {
            setForm((f) => ({ ...f, tags: [...f.tags, t] }));
        }
        setTagInput('');
    }

    function removeTag(tag: string) {
        setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
    }

    function field<K extends keyof QuestionFormData>(key: K, value: QuestionFormData[K]) {
        setForm((f) => ({ ...f, [key]: value }));
        if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
    }

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
                            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
                                <div>
                                    <h2 className="text-base font-semibold text-foreground text-balance">
                                        {editQuestion ? 'Edit Question' : 'Add New Question'}
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        {editQuestion ? 'Update question details' : 'Track a new DSA problem'}
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-5 space-y-5">
                                {/* Name + URL */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="name" className="text-xs font-medium">
                                            Question Name <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g. Two Sum"
                                            value={form.name}
                                            onChange={(e) => field('name', e.target.value)}
                                            className={cn('h-9 text-sm', errors.name && 'border-destructive')}
                                        />
                                        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="url" className="text-xs font-medium">
                                            Problem URL <span className="text-destructive">*</span>
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="url"
                                                placeholder="https://leetcode.com/problems/..."
                                                value={form.url}
                                                onChange={(e) => field('url', e.target.value)}
                                                className={cn('h-9 text-sm pr-8', errors.url && 'border-destructive')}
                                            />
                                            {form.url && validateURL(form.url) && (
                                                <a
                                                    href={form.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                        </div>
                                        {errors.url && <p className="text-xs text-destructive">{errors.url}</p>}
                                    </div>
                                </div>

                                {/* Platform + Difficulty */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium">Platform <span className="text-destructive">*</span></Label>
                                        <Select value={form.platform} onValueChange={(v) => field('platform', v as typeof form.platform)}>
                                            <SelectTrigger className="h-9 text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PLATFORMS.map((p) => (
                                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium">Difficulty <span className="text-destructive">*</span></Label>
                                        <Select value={form.difficulty} onValueChange={(v) => field('difficulty', v as typeof form.difficulty)}>
                                            <SelectTrigger className="h-9 text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DIFFICULTIES.map((d) => (
                                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="lastRevised" className="text-xs font-medium">Last Revised</Label>
                                        <Input
                                            id="lastRevised"
                                            type="date"
                                            value={form.lastRevised}
                                            onChange={(e) => field('lastRevised', e.target.value)}
                                            className="h-9 text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Tags */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium">Topic Tags</Label>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {form.tags.map((tag) => (
                                            <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                                                {tag}
                                                <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                                                    <X className="w-2.5 h-2.5" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Add tag or select below..."
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); }
                                            }}
                                            className="h-8 text-sm flex-1"
                                        />
                                        <Button type="button" variant="outline" size="sm" onClick={() => addTag(tagInput)} className="h-8 gap-1">
                                            <Plus className="w-3 h-3" /> Add
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {COMMON_TAGS.filter((t) => !form.tags.includes(t)).map((tag) => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => addTag(tag)}
                                                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                                            >
                                                <Tag className="w-2.5 h-2.5" />{tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Confidence */}
                                <div className="space-y-3">
                                    <Label className="text-xs font-medium">
                                        Confidence Level — <span className="text-primary">{CONFIDENCE_DESCRIPTIONS[form.confidence]}</span>
                                    </Label>
                                    <div className="px-1">
                                        <Slider
                                            value={[form.confidence]}
                                            min={1}
                                            max={5}
                                            step={1}
                                            onValueChange={([v]) => field('confidence', v as ConfidenceLevel)}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between mt-1">
                                            {[1, 2, 3, 4, 5].map((n) => (
                                                <span key={n} className={cn('text-[10px]', form.confidence === n ? 'text-primary font-bold' : 'text-muted-foreground')}>
                                                    {CONFIDENCE_LABELS[n as ConfidenceLevel]}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Approaches */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="approach" className="text-xs font-medium">Approach Summary</Label>
                                        <Textarea
                                            id="approach"
                                            placeholder="Describe your initial approach..."
                                            value={form.approachSummary}
                                            onChange={(e) => field('approachSummary', e.target.value)}
                                            className="text-sm min-h-[80px] resize-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="optimal" className="text-xs font-medium">Optimal Approach</Label>
                                        <Textarea
                                            id="optimal"
                                            placeholder="Describe the optimal solution..."
                                            value={form.optimalApproach}
                                            onChange={(e) => field('optimalApproach', e.target.value)}
                                            className="text-sm min-h-[80px] resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Complexity */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="time" className="text-xs font-medium">Time Complexity</Label>
                                        <Input
                                            id="time"
                                            placeholder="O(n log n)"
                                            value={form.timeComplexity}
                                            onChange={(e) => field('timeComplexity', e.target.value)}
                                            className="h-9 text-sm font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="space" className="text-xs font-medium">Space Complexity</Label>
                                        <Input
                                            id="space"
                                            placeholder="O(n)"
                                            value={form.spaceComplexity}
                                            onChange={(e) => field('spaceComplexity', e.target.value)}
                                            className="h-9 text-sm font-mono"
                                        />
                                    </div>
                                </div>

                                {/* Mistakes */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="mistakes" className="text-xs font-medium">Mistake Notes</Label>
                                    <Textarea
                                        id="mistakes"
                                        placeholder="What did you get wrong? Edge cases missed? Wrong approach?"
                                        value={form.mistakeNotes}
                                        onChange={(e) => field('mistakeNotes', e.target.value)}
                                        className="text-sm min-h-[70px] resize-none"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                                    <Button type="button" variant="outline" onClick={onClose} className="h-9">Cancel</Button>
                                    <Button type="submit" disabled={loading} className="h-9 gap-2">
                                        {loading ? 'Saving...' : editQuestion ? 'Update Question' : 'Add Question'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
