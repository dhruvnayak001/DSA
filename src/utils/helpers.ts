import type { ConfidenceLevel, DSAQuestion } from '@/types/types';

export const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
    1: 'Very Weak',
    2: 'Weak',
    3: 'Average',
    4: 'Strong',
    5: 'Mastered',
};

export const CONFIDENCE_DAYS: Record<ConfidenceLevel, number> = {
    1: 2,
    2: 3,
    3: 5,
    4: 7,
    5: 10,
};

export const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
    1: 'text-destructive',
    2: 'text-warning',
    3: 'text-info',
    4: 'text-success',
    5: 'text-primary',
};

export const CONFIDENCE_BG: Record<ConfidenceLevel, string> = {
    1: 'bg-destructive/10 text-destructive border-destructive/20',
    2: 'bg-warning/10 text-warning border-warning/20',
    3: 'bg-info/10 text-info border-info/20',
    4: 'bg-success/10 text-success border-success/20',
    5: 'bg-primary/10 text-primary border-primary/20',
};

export const DIFFICULTY_COLORS: Record<string, string> = {
    Easy: 'bg-success/10 text-success border-success/20',
    Medium: 'bg-warning/10 text-warning border-warning/20',
    Hard: 'bg-destructive/10 text-destructive border-destructive/20',
};

export const PLATFORMS = [
    'LeetCode',
    'GeeksforGeeks',
    'Striver A2Z DSA Sheet',
    'Codeforces',
    'CodeChef',
    'HackerRank',
    'InterviewBit',
    'Other',
] as const;

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;

export const COMMON_TAGS = [
    'Array',
    'String',
    'LinkedList',
    'Tree',
    'Graph',
    'Dynamic Programming',
    'Binary Search',
    'Greedy',
    'Backtracking',
    'Recursion',
    'Stack',
    'Queue',
    'Heap',
    'Hashing',
    'Two Pointers',
    'Sliding Window',
    'Divide and Conquer',
    'Bit Manipulation',
    'Math',
    'Sorting',
];

export function calculateNextRevision(confidence: ConfidenceLevel, fromDate?: string): string {
    const days = CONFIDENCE_DAYS[confidence];
    const base = fromDate ? new Date(fromDate) : new Date();
    const next = new Date(base);
    next.setDate(next.getDate() + days);
    return next.toISOString().split('T')[0];
}

export function getDaysUntilRevision(nextRevision: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next = new Date(nextRevision);
    next.setHours(0, 0, 0, 0);
    return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getRevisionStatus(nextRevision: string): 'overdue' | 'due-today' | 'upcoming' {
    const days = getDaysUntilRevision(nextRevision);
    if (days < 0) return 'overdue';
    if (days === 0) return 'due-today';
    return 'upcoming';
}

export function isQuestionDue(q: DSAQuestion): boolean {
    return getDaysUntilRevision(q.nextRevision) <= 0;
}

export function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function validateURL(url: string): boolean {
    if (!url) return true;
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

export function calculateXP(action: 'add' | 'revise' | 'master'): number {
    const xpMap = { add: 10, revise: 15, master: 50 };
    return xpMap[action];
}

export function calculateLevel(xp: number): number {
    return Math.floor(xp / 100) + 1;
}

export function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
    return arr.reduce(
        (acc, item) => {
            const k = key(item);
            if (!acc[k]) acc[k] = [];
            acc[k].push(item);
            return acc;
        },
        {} as Record<string, T[]>
    );
}

export function todayISO(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}
