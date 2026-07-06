import type { DSAQuestion, UserStats, AppSettings, StoredData, SavedFilter } from '@/types/types';
import { calculateXP, calculateLevel, generateId, todayISO } from '@/utils/helpers';

const KEYS = {
    QUESTIONS: 'dsa_questions',
    STATS: 'dsa_stats',
    SETTINGS: 'dsa_settings',
    SAVED_FILTERS: 'dsa_saved_filters',
};

const DEFAULT_STATS: UserStats = {
    currentStreak: 0,
    longestStreak: 0,
    lastRevisionDate: '',
    totalXP: 0,
    level: 1,
    achievements: [
        {
            id: 'first_question',
            title: 'First Step',
            description: 'Add your first DSA question',
            icon: '🎯',
            unlockedAt: null,
            condition: 'questions >= 1',
        },
        {
            id: 'questions_10',
            title: 'Getting Started',
            description: 'Track 10 questions',
            icon: '📚',
            unlockedAt: null,
            condition: 'questions >= 10',
        },
        {
            id: 'questions_50',
            title: 'Grinder',
            description: 'Track 50 questions',
            icon: '⚡',
            unlockedAt: null,
            condition: 'questions >= 50',
        },
        {
            id: 'questions_100',
            title: 'Century',
            description: 'Track 100 questions',
            icon: '💯',
            unlockedAt: null,
            condition: 'questions >= 100',
        },
        {
            id: 'streak_7',
            title: '7-Day Streak',
            description: 'Revise for 7 consecutive days',
            icon: '🔥',
            unlockedAt: null,
            condition: 'streak >= 7',
        },
        {
            id: 'streak_30',
            title: 'Monthly Grind',
            description: 'Revise for 30 consecutive days',
            icon: '🏆',
            unlockedAt: null,
            condition: 'streak >= 30',
        },
        {
            id: 'mastered_10',
            title: 'Master Mind',
            description: 'Master 10 problems',
            icon: '🧠',
            unlockedAt: null,
            condition: 'mastered >= 10',
        },
        {
            id: 'mastered_50',
            title: 'DSA Expert',
            description: 'Master 50 problems',
            icon: '👑',
            unlockedAt: null,
            condition: 'mastered >= 50',
        },
        {
            id: 'dp_specialist',
            title: 'DP Specialist',
            description: 'Master 10 Dynamic Programming problems',
            icon: '🎓',
            unlockedAt: null,
            condition: 'dp_mastered >= 10',
        },
    ],
};

function safeGet<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function safeSet<T>(key: string, value: T): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        console.error('localStorage write failed', key);
    }
}

// Questions
export function getQuestions(): DSAQuestion[] {
    return safeGet<DSAQuestion[]>(KEYS.QUESTIONS, []);
}

export function saveQuestions(questions: DSAQuestion[]): void {
    safeSet(KEYS.QUESTIONS, questions);
}

export function addQuestion(q: DSAQuestion): void {
    const questions = getQuestions();
    questions.push(q);
    saveQuestions(questions);
    const stats = getStats();
    stats.totalXP += calculateXP('add');
    stats.level = calculateLevel(stats.totalXP);
    checkAchievements(stats, questions);
    saveStats(stats);
}

export function updateQuestion(updated: DSAQuestion): void {
    const questions = getQuestions().map((q) => (q.id === updated.id ? updated : q));
    saveQuestions(questions);
}

export function deleteQuestion(id: string): void {
    const questions = getQuestions().filter((q) => q.id !== id);
    saveQuestions(questions);
}

export function duplicateQuestion(id: string): DSAQuestion | null {
    const questions = getQuestions();
    const orig = questions.find((q) => q.id === id);
    if (!orig) return null;
    const copy: DSAQuestion = {
        ...orig,
        id: generateId(),
        name: `${orig.name} (Copy)`,
        revisionHistory: [],
        createdAt: new Date().toISOString(),
        xpEarned: 0,
    };
    questions.push(copy);
    saveQuestions(questions);
    return copy;
}

export function markRevised(id: string, newConfidence?: number): void {
    const questions = getQuestions();
    const idx = questions.findIndex((q) => q.id === id);
    if (idx === -1) return;

    const q = questions[idx];
    const today = todayISO();
    const confidence = (newConfidence ?? q.confidence) as typeof q.confidence;

    q.confidence = confidence;
    q.lastRevised = today;

    const days = { 1: 2, 2: 3, 3: 5, 4: 7, 5: 10 }[confidence] ?? 5;
    const next = new Date();
    next.setDate(next.getDate() + days);
    q.nextRevision = next.toISOString().split('T')[0];

    q.revisionHistory.push({ date: today, confidence });
    q.xpEarned += calculateXP('revise');
    if (confidence === 5) q.xpEarned += calculateXP('master');

    saveQuestions(questions);

    // Update streak
    const stats = getStats();
    updateStreak(stats, today);
    stats.totalXP += calculateXP('revise');
    if (confidence === 5) stats.totalXP += calculateXP('master');
    stats.level = calculateLevel(stats.totalXP);
    checkAchievements(stats, questions);
    saveStats(stats);
}

// Stats
export function getStats(): UserStats {
    const stored = safeGet<Partial<UserStats>>(KEYS.STATS, {});
    return { ...DEFAULT_STATS, ...stored, achievements: stored.achievements ?? DEFAULT_STATS.achievements };
}

export function saveStats(stats: UserStats): void {
    safeSet(KEYS.STATS, stats);
}

function updateStreak(stats: UserStats, today: string): void {
    const last = stats.lastRevisionDate;
    if (last === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    if (last === yStr) {
        stats.currentStreak += 1;
    } else if (last !== today) {
        stats.currentStreak = 1;
    }

    stats.longestStreak = Math.max(stats.currentStreak, stats.longestStreak);
    stats.lastRevisionDate = today;
}

function checkAchievements(stats: UserStats, questions: DSAQuestion[]): void {
    const total = questions.length;
    const mastered = questions.filter((q) => q.confidence === 5).length;
    const dpMastered = questions.filter(
        (q) => q.confidence === 5 && q.tags.some((t) => t.toLowerCase().includes('dynamic'))
    ).length;

    for (const ach of stats.achievements) {
        if (ach.unlockedAt) continue;
        let unlock = false;
        if (ach.condition === 'questions >= 1' && total >= 1) unlock = true;
        if (ach.condition === 'questions >= 10' && total >= 10) unlock = true;
        if (ach.condition === 'questions >= 50' && total >= 50) unlock = true;
        if (ach.condition === 'questions >= 100' && total >= 100) unlock = true;
        if (ach.condition === 'streak >= 7' && stats.currentStreak >= 7) unlock = true;
        if (ach.condition === 'streak >= 30' && stats.currentStreak >= 30) unlock = true;
        if (ach.condition === 'mastered >= 10' && mastered >= 10) unlock = true;
        if (ach.condition === 'mastered >= 50' && mastered >= 50) unlock = true;
        if (ach.condition === 'dp_mastered >= 10' && dpMastered >= 10) unlock = true;
        if (unlock) ach.unlockedAt = new Date().toISOString();
    }
}

// Settings
export function getSettings(): AppSettings {
    return safeGet<AppSettings>(KEYS.SETTINGS, { theme: 'light' });
}

export function saveSettings(settings: AppSettings): void {
    safeSet(KEYS.SETTINGS, settings);
}

// Saved filters
export function getSavedFilters(): SavedFilter[] {
    return safeGet<SavedFilter[]>(KEYS.SAVED_FILTERS, []);
}

export function saveSavedFilters(filters: SavedFilter[]): void {
    safeSet(KEYS.SAVED_FILTERS, filters);
}

// Export / Import
export function exportData(): string {
    const data: StoredData = {
        questions: getQuestions(),
        stats: getStats(),
        settings: getSettings(),
        savedFilters: getSavedFilters(),
    };
    return JSON.stringify(data, null, 2);
}

export function importData(jsonStr: string): boolean {
    try {
        const data = JSON.parse(jsonStr) as StoredData;
        if (!Array.isArray(data.questions)) throw new Error('Invalid format');
        saveQuestions(data.questions);
        if (data.stats) saveStats(data.stats);
        if (data.settings) saveSettings(data.settings);
        if (data.savedFilters) saveSavedFilters(data.savedFilters);
        return true;
    } catch {
        return false;
    }
}

export function resetAllData(): void {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}
