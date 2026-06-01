import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Search,
    Filter,
    ChevronUp,
    ChevronDown,
    ChevronsUpDown,
    Eye,
    Pencil,
    Trash2,
    CheckCircle,
    Copy,
    ExternalLink,
    X,
    Save,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { QuestionForm } from '@/components/common/QuestionForm';
import { QuestionDetailsModal } from '@/components/common/QuestionDetailsModal';
import type { DSAQuestion, QuestionFormData, QuestionFilters } from '@/types/types';
import {
    CONFIDENCE_LABELS,
    CONFIDENCE_BG,
    DIFFICULTY_COLORS,
    PLATFORMS,
    DIFFICULTIES,
    formatDate,
    getDaysUntilRevision,
} from '@/utils/helpers';
import { filtersApi } from '@/api/filters';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface QuestionBankProps {
    questions: DSAQuestion[];
    onAdd: (data: QuestionFormData) => boolean;
    onUpdate: (q: DSAQuestion) => void;
    onDelete: (id: string, name: string) => void;
    onDuplicate: (id: string) => void;
    onMarkRevised: (id: string) => void;
    addFormOpen: boolean;
    setAddFormOpen: (v: boolean) => void;
}

type SortKey = keyof DSAQuestion | 'daysUntil';
type SortDir = 'asc' | 'desc';

const PAGE_SIZES = [10, 20, 50];

const EMPTY_FILTERS: QuestionFilters = {
    search: '',
    platform: 'all',
    difficulty: 'all',
    confidence: 'all',
    dueStatus: 'all',
    tags: 'all',
};

function StatusBadge({ nextRevision }: { nextRevision: string }) {
    const days = getDaysUntilRevision(nextRevision);
    if (days < 0) return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">Overdue</Badge>;
    if (days === 0) return <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px]">Due Today</Badge>;
    return <Badge className="bg-success/10 text-success border-success/20 text-[10px]">In {days}d</Badge>;
}

export function QuestionBank({
    questions,
    onAdd,
    onUpdate,
    onDelete,
    onDuplicate,
    onMarkRevised,
    addFormOpen,
    setAddFormOpen,
}: QuestionBankProps) {
    const [filters, setFilters] = useState<QuestionFilters>(EMPTY_FILTERS);
    const [sortKey, setSortKey] = useState<SortKey>('createdAt');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showFilters, setShowFilters] = useState(false);
    const [viewQ, setViewQ] = useState<DSAQuestion | null>(null);
    const [editQ, setEditQ] = useState<DSAQuestion | null>(null);
    const [deleteQ, setDeleteQ] = useState<DSAQuestion | null>(null);
    const [savedFilters, setSavedFilters] = useState<import('@/types/types').SavedFilter[]>([]);
    const [saveFilterName, setSaveFilterName] = useState('');

    // Load saved filters from API on mount
    useEffect(() => {
        filtersApi.getAll().then(setSavedFilters).catch(() => {});
    }, []);

    function setFilter<K extends keyof QuestionFilters>(key: K, value: QuestionFilters[K]) {
        setFilters((f) => ({ ...f, [key]: value }));
        setPage(1);
    }

    function clearFilters() {
        setFilters(EMPTY_FILTERS);
        setPage(1);
    }

    function handleSort(key: SortKey) {
        if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortKey(key); setSortDir('asc'); }
    }

    function SortIcon({ col }: { col: SortKey }) {
        if (sortKey !== col) return <ChevronsUpDown className="w-3 h-3 text-muted-foreground" />;
        return sortDir === 'asc' ? (
            <ChevronUp className="w-3 h-3 text-primary" />
        ) : (
            <ChevronDown className="w-3 h-3 text-primary" />
        );
    }

    const filtered = useMemo(() => {
        let qs = [...questions];
        const { search, platform, difficulty, confidence, dueStatus, tags } = filters;
        if (search) {
            const s = search.toLowerCase();
            qs = qs.filter(
                (q) =>
                    q.name.toLowerCase().includes(s) ||
                    q.platform.toLowerCase().includes(s) ||
                    q.tags.some((t) => t.toLowerCase().includes(s))
            );
        }
        if (platform !== 'all') qs = qs.filter((q) => q.platform === platform);
        if (difficulty !== 'all') qs = qs.filter((q) => q.difficulty === difficulty);
        if (confidence !== 'all') qs = qs.filter((q) => q.confidence === Number(confidence));
        if (tags !== 'all') qs = qs.filter((q) => q.tags.includes(tags));
        if (dueStatus !== 'all') {
            qs = qs.filter((q) => {
                const days = getDaysUntilRevision(q.nextRevision);
                if (dueStatus === 'overdue') return days < 0;
                if (dueStatus === 'today') return days === 0;
                if (dueStatus === 'upcoming') return days > 0;
                return true;
            });
        }
        qs.sort((a, b) => {
            let av: string | number;
            let bv: string | number;
            if (sortKey === 'daysUntil') {
                av = getDaysUntilRevision(a.nextRevision);
                bv = getDaysUntilRevision(b.nextRevision);
            } else {
                av = (a[sortKey as keyof DSAQuestion] as string | number) ?? '';
                bv = (b[sortKey as keyof DSAQuestion] as string | number) ?? '';
            }
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return qs;
    }, [questions, filters, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    const hasActiveFilters = Object.entries(filters).some(([, v]) => v !== '' && v !== 'all');

    async function saveCurrentFilter() {
        if (!saveFilterName.trim()) return;
        try {
            const newFilter = await filtersApi.create(saveFilterName.trim(), filters);
            setSavedFilters((prev) => [...prev, newFilter]);
            setSaveFilterName('');
            toast.success('Filter saved!');
        } catch {
            toast.error('Failed to save filter');
        }
    }

    function loadFilter(f: QuestionFilters) {
        setFilters(f);
        setPage(1);
    }

    async function deleteSavedFilter(id: string) {
        try {
            await filtersApi.delete(id);
            setSavedFilters((prev) => prev.filter((f) => f.id !== id));
        } catch {
            toast.error('Failed to delete filter');
        }
    }

    const allTags = useMemo(
        () => Array.from(new Set(questions.flatMap((q) => q.tags))).sort(),
        [questions]
    );

    return (
        <div className="space-y-4">
            {/* Search & filter bar */}
            <div className="flex flex-col md:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Search questions, tags, platforms..."
                        value={filters.search}
                        onChange={(e) => setFilter('search', e.target.value)}
                        className="pl-9 h-9 text-sm"
                    />
                    {filters.search && (
                        <button
                            onClick={() => setFilter('search', '')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
                <div className="flex gap-2 shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn('h-9 gap-1.5 text-xs', hasActiveFilters && 'border-primary text-primary')}
                    >
                        <Filter className="w-3.5 h-3.5" />
                        Filters
                        {hasActiveFilters && (
                            <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                                {Object.values(filters).filter((v) => v !== '' && v !== 'all').length}
                            </span>
                        )}
                    </Button>
                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-xs text-muted-foreground">
                            <X className="w-3 h-3 mr-1" />Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters panel */}
            {showFilters && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-muted/30 rounded-lg p-4 border border-border/50 space-y-4"
                >
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="space-y-1">
                            <label className="text-[11px] font-medium text-muted-foreground">Platform</label>
                            <Select value={filters.platform} onValueChange={(v) => setFilter('platform', v)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Platforms</SelectItem>
                                    {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] font-medium text-muted-foreground">Difficulty</label>
                            <Select value={filters.difficulty} onValueChange={(v) => setFilter('difficulty', v)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] font-medium text-muted-foreground">Confidence</label>
                            <Select value={filters.confidence} onValueChange={(v) => setFilter('confidence', v)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <SelectItem key={n} value={String(n)}>{n} - {CONFIDENCE_LABELS[n as 1]}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] font-medium text-muted-foreground">Due Status</label>
                            <Select value={filters.dueStatus} onValueChange={(v) => setFilter('dueStatus', v)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="overdue">Overdue</SelectItem>
                                    <SelectItem value="today">Due Today</SelectItem>
                                    <SelectItem value="upcoming">Upcoming</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] font-medium text-muted-foreground">Topic Tag</label>
                            <Select value={filters.tags} onValueChange={(v) => setFilter('tags', v)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Topics</SelectItem>
                                    {allTags.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Save filter */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
                        <Input
                            placeholder="Filter name..."
                            value={saveFilterName}
                            onChange={(e) => setSaveFilterName(e.target.value)}
                            className="h-7 text-xs w-36"
                        />
                        <Button variant="outline" size="sm" onClick={saveCurrentFilter} className="h-7 text-xs gap-1">
                            <Save className="w-3 h-3" />Save Filter
                        </Button>
                        {savedFilters.map((sf) => (
                            <div key={sf.id} className="flex items-center gap-0.5">
                                <button
                                    onClick={() => loadFilter(sf.filters)}
                                    className="px-2 py-1 rounded-md text-[11px] bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                >
                                    {sf.name}
                                </button>
                                <button onClick={() => deleteSavedFilter(sf.id)} className="p-0.5 text-muted-foreground hover:text-destructive">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Results info */}
            <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                    {filtered.length} question{filtered.length !== 1 ? 's' : ''} found
                </p>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Show</span>
                    <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                        <SelectTrigger className="h-7 text-xs w-16"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {PAGE_SIZES.map((s) => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto w-full max-w-full">
                    <table className="w-full min-w-max text-sm">
                        <thead className="bg-muted/50 sticky top-0 z-10">
                            <tr>
                                {[
                                    { key: 'name', label: 'Question' },
                                    { key: 'platform', label: 'Platform' },
                                    { key: 'difficulty', label: 'Difficulty' },
                                    { key: 'tags', label: 'Tags' },
                                    { key: 'confidence', label: 'Confidence' },
                                    { key: 'lastRevised', label: 'Last Revised' },
                                    { key: 'daysUntil', label: 'Next Revision' },
                                    { key: 'status', label: 'Status' },
                                ].map(({ key, label }) => (
                                    <th
                                        key={key}
                                        onClick={() => key !== 'tags' && key !== 'status' && handleSort(key as SortKey)}
                                        className={cn(
                                            'text-left py-2.5 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap',
                                            key !== 'tags' && key !== 'status' && 'cursor-pointer hover:text-foreground select-none'
                                        )}
                                    >
                                        <div className="flex items-center gap-1">
                                            {label}
                                            {key !== 'tags' && key !== 'status' && <SortIcon col={key as SortKey} />}
                                        </div>
                                    </th>
                                ))}
                                <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border/50">
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                                        No questions found. Try adjusting your filters.
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((q) => (
                                    <tr key={q.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="py-3 px-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2 max-w-[220px]">
                                                <p className="text-xs font-medium text-foreground truncate">{q.name}</p>
                                                {q.url && (
                                                    <a href={q.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary shrink-0">
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 whitespace-nowrap">
                                            <span className="text-xs text-muted-foreground">{q.platform}</span>
                                        </td>
                                        <td className="py-3 px-3 whitespace-nowrap">
                                            <Badge className={cn('text-[10px] border', DIFFICULTY_COLORS[q.difficulty])}>
                                                {q.difficulty}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-3 whitespace-nowrap">
                                            <div className="flex gap-1 max-w-[140px]">
                                                {q.tags.slice(0, 2).map((t) => (
                                                    <Badge key={t} variant="secondary" className="text-[10px] whitespace-nowrap">{t}</Badge>
                                                ))}
                                                {q.tags.length > 2 && (
                                                    <Badge variant="outline" className="text-[10px]">+{q.tags.length - 2}</Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 whitespace-nowrap">
                                            <Badge className={cn('text-[10px] border', CONFIDENCE_BG[q.confidence])}>
                                                {q.confidence} - {CONFIDENCE_LABELS[q.confidence]}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-3 whitespace-nowrap">
                                            <span className="text-xs text-muted-foreground">{formatDate(q.lastRevised)}</span>
                                        </td>
                                        <td className="py-3 px-3 whitespace-nowrap">
                                            <span className="text-xs text-muted-foreground">{formatDate(q.nextRevision)}</span>
                                        </td>
                                        <td className="py-3 px-3 whitespace-nowrap">
                                            <StatusBadge nextRevision={q.nextRevision} />
                                        </td>
                                        <td className="py-3 px-3 whitespace-nowrap">
                                            <div className="flex items-center gap-0.5">
                                                <button
                                                    onClick={() => setViewQ(q)}
                                                    className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                                    title="View"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setEditQ(q)}
                                                    className="p-1.5 rounded text-muted-foreground hover:text-warning hover:bg-warning/10 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => onMarkRevised(q.id)}
                                                    className="p-1.5 rounded text-muted-foreground hover:text-success hover:bg-success/10 transition-colors"
                                                    title="Mark Revised"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => onDuplicate(q.id)}
                                                    className="p-1.5 rounded text-muted-foreground hover:text-info hover:bg-info/10 transition-colors"
                                                    title="Duplicate"
                                                >
                                                    <Copy className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteQ(q)}
                                                    className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground">
                        Page {page} of {totalPages} · {filtered.length} results
                    </p>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </Button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                            return (
                                <Button
                                    key={p}
                                    variant={p === page ? 'default' : 'outline'}
                                    size="icon"
                                    className="h-7 w-7 text-xs"
                                    onClick={() => setPage(p)}
                                >
                                    {p}
                                </Button>
                            );
                        })}
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Modals */}
            <QuestionForm
                open={addFormOpen}
                onClose={() => setAddFormOpen(false)}
                onSubmit={onAdd}
            />
            <QuestionForm
                open={!!editQ}
                onClose={() => setEditQ(null)}
                onSubmit={(data) => {
                    if (!editQ) return false;
                    const updated = {
                        ...editQ,
                        ...data,
                        nextRevision: editQ.nextRevision,
                    };
                    onUpdate(updated);
                    setEditQ(null);
                    return true;
                }}
                editQuestion={editQ}
            />
            <QuestionDetailsModal
                question={viewQ}
                open={!!viewQ}
                onClose={() => setViewQ(null)}
                onEdit={(q) => { setViewQ(null); setEditQ(q); }}
                onMarkRevised={(id) => { onMarkRevised(id); setViewQ(null); }}
            />
            <AlertDialog open={!!deleteQ} onOpenChange={(o) => !o && setDeleteQ(null)}>
                <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Question?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove <strong>"{deleteQ?.name}"</strong> from your tracker. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => { if (deleteQ) { onDelete(deleteQ.id, deleteQ.name); setDeleteQ(null); } }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
