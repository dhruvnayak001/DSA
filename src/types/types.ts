export type Platform =
    | 'LeetCode'
    | 'GeeksforGeeks'
    | 'Striver A2Z DSA Sheet'
    | 'Codeforces'
    | 'CodeChef'
    | 'HackerRank'
    | 'InterviewBit'
    | 'Other';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type ConfidenceLevel = 1 | 2 | 3 | 4 | 5;

export interface RevisionEntry {
    date: string; // ISO date string
    confidence: ConfidenceLevel;
}

export interface DSAQuestion {
    id: string;
    name: string;
    url: string;
    platform: Platform;
    difficulty: Difficulty;
    tags: string[];
    approachSummary: string;
    optimalApproach: string;
    timeComplexity: string;
    spaceComplexity: string;
    confidence: ConfidenceLevel;
    mistakeNotes: string;
    lastRevised: string; // ISO date string
    nextRevision: string; // ISO date string
    revisionHistory: RevisionEntry[];
    createdAt: string; // ISO date string
    xpEarned: number;
}

export interface UserStats {
    currentStreak: number;
    longestStreak: number;
    lastRevisionDate: string;
    totalXP: number;
    level: number;
    totalRevisionsCount: number;
    totalDaysActive: number;
    achievements: Achievement[];
    badges: Badge[];
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt: string | null;
    condition: string;
}

// ── Badge System ──────────────────────────────────────────────────────────────

export type BadgeCategory = 'streak' | 'volume' | 'mastery' | 'consistency' | 'special';
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Badge {
    id: string;
    category: BadgeCategory;
    tier: BadgeTier;
    title: string;
    description: string;
    icon: string;
    unlockedAt: string | null;
    progress: number;   // 0-100 percentage
    target: number;
    current: number;
}

export interface StreakCalendarDay {
    date: string;   // "YYYY-MM-DD"
    count: number;  // number of revisions that day
}

export interface BadgesResponse {
    badges: Badge[];
    stats: {
        currentStreak: number;
        longestStreak: number;
        totalDaysActive: number;
        totalRevisionsCount: number;
        totalXP: number;
        level: number;
    };
}

// ── Existing Types ────────────────────────────────────────────────────────────

export interface AppSettings {
    theme: 'light' | 'dark';
}

export interface StoredData {
    questions: DSAQuestion[];
    stats: UserStats;
    settings: AppSettings;
    savedFilters: SavedFilter[];
}

export interface SavedFilter {
    id: string;
    name: string;
    filters: QuestionFilters;
}

export interface QuestionFilters {
    search: string;
    platform: string;
    difficulty: string;
    confidence: string;
    dueStatus: string;
    tags: string;
}

export type QuestionFormData = Omit<
    DSAQuestion,
    'id' | 'nextRevision' | 'revisionHistory' | 'createdAt' | 'xpEarned'
>;

export interface MistakePattern {
    pattern: string;
    count: number;
    percentage: number;
    questions: string[];
}

export interface WeakTopicInsight {
    topic: string;
    weakCount: number;
    avgConfidence: number;
    topMistake: string;
}
