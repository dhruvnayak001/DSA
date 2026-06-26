/**
 * XP, achievement, and badge utilities — authoritative server-side logic.
 */


// ── XP ────────────────────────────────────────────────────────────────────────

/** XP awarded per action */
export function calculateXP(action) {
    const xpMap = { add: 10, revise: 15, master: 50 };
    return xpMap[action] ?? 0;
}

/** Level = floor(totalXP / 100) + 1 */
export function calculateLevel(xp) {
    return Math.floor(xp / 100) + 1;
}

/** Returns today as "YYYY-MM-DD" in LOCAL timezone */
export function todayISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// ── Revision scheduling ───────────────────────────────────────────────────────

/**
 * Calculates the nextRevision date based on confidence level.
 * Confidence → days: 1→2, 2→3, 3→5, 4→7, 5→10
 */
export function calculateNextRevision(confidence, fromDate) {
    const days = { 1: 2, 2: 3, 3: 5, 4: 7, 5: 10 }[confidence] ?? 5;
    const base = fromDate ? new Date(fromDate) : new Date();
    const next = new Date(base);
    next.setDate(next.getDate() + days);
    return next.toISOString().split('T')[0];
}

// ── Streak ────────────────────────────────────────────────────────────────────

/**
 * Updates the user's streak based on today's date.
 * Modifies the stats object in-place.
 */
export function updateStreak(stats, today) {
    const last = stats.lastRevisionDate;
    if (last === today) return; // already active today

    // Calculate yesterday in local time
    const yd = new Date();
    yd.setDate(yd.getDate() - 1);
    const yStr = `${yd.getFullYear()}-${String(yd.getMonth() + 1).padStart(2, '0')}-${String(yd.getDate()).padStart(2, '0')}`;

    if (last === yStr) {
        stats.currentStreak += 1;
    } else {
        stats.currentStreak = 1;
    }

    stats.longestStreak = Math.max(stats.currentStreak, stats.longestStreak);
    stats.lastRevisionDate = today;

    // Track total unique active days
    stats.totalDaysActive = (stats.totalDaysActive || 0) + 1;
}

/**
 * Returns the "live" streak value. If the user hasn't been active today
 * or yesterday, their streak is effectively 0 (broken).
 * Does NOT mutate stats — use this for read-only display.
 */
export function getValidatedStreak(stats) {
    const last = stats.lastRevisionDate;
    if (!last) return 0;

    const today = todayISO();
    if (last === today) return stats.currentStreak;

    // Yesterday in local time
    const yd = new Date();
    yd.setDate(yd.getDate() - 1);
    const yStr = `${yd.getFullYear()}-${String(yd.getMonth() + 1).padStart(2, '0')}-${String(yd.getDate()).padStart(2, '0')}`;

    if (last === yStr) return stats.currentStreak;

    return 0; // streak broken
}


// ── Legacy Achievements ───────────────────────────────────────────────────────

/**
 * Checks and unlocks achievements based on current questions and stats.
 * Mutates stats.achievements in-place.
 */
export function checkAchievements(stats, questions) {
    const total = questions.length;
    const mastered = questions.filter((q) => q.confidence === 5).length;
    const dpMastered = questions.filter(
        (q) => q.confidence === 5 && q.tags.some((t) => t.toLowerCase().includes('dynamic'))
    ).length;

    checkAchievementsFromCounts(stats, total, mastered, dpMastered);
}

/**
 * Checks and unlocks achievements using pre-computed counts.
 */
export function checkAchievementsFromCounts(stats, total, mastered, dpMastered) {
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
        if (unlock) ach.unlockedAt = new Date();
    }
}

// ── Badge System ──────────────────────────────────────────────────────────────

/**
 * Master list of all badges. Each badge has a unique id, category, tier,
 * display info, and a `check` function that receives counts and returns
 * { unlocked: boolean, current: number, target: number }.
 */
export const BADGE_DEFINITIONS = [
    // ── Streak badges ─────────────────────────────────────────────────────────
    {
        id: 'streak_first_flame',
        category: 'streak',
        tier: 'bronze',
        title: 'First Flame',
        description: 'Maintain a 3-day revision streak',
        icon: '🔥',
        check: (c) => ({ unlocked: c.currentStreak >= 3, current: Math.min(c.currentStreak, 3), target: 3 }),
    },
    {
        id: 'streak_week_warrior',
        category: 'streak',
        tier: 'silver',
        title: 'Week Warrior',
        description: 'Maintain a 7-day revision streak',
        icon: '⚔️',
        check: (c) => ({ unlocked: c.longestStreak >= 7, current: Math.min(c.longestStreak, 7), target: 7 }),
    },
    {
        id: 'streak_monthly_grinder',
        category: 'streak',
        tier: 'gold',
        title: 'Monthly Grinder',
        description: 'Maintain a 30-day revision streak',
        icon: '💪',
        check: (c) => ({ unlocked: c.longestStreak >= 30, current: Math.min(c.longestStreak, 30), target: 30 }),
    },
    {
        id: 'streak_unstoppable',
        category: 'streak',
        tier: 'platinum',
        title: 'Unstoppable',
        description: 'Maintain a 100-day revision streak',
        icon: '🏆',
        check: (c) => ({ unlocked: c.longestStreak >= 100, current: Math.min(c.longestStreak, 100), target: 100 }),
    },

    // ── Volume badges ─────────────────────────────────────────────────────────
    {
        id: 'volume_first_steps',
        category: 'volume',
        tier: 'bronze',
        title: 'First Steps',
        description: 'Add your first question',
        icon: '👣',
        check: (c) => ({ unlocked: c.totalQuestions >= 1, current: Math.min(c.totalQuestions, 1), target: 1 }),
    },
    {
        id: 'volume_getting_started',
        category: 'volume',
        tier: 'bronze',
        title: 'Getting Started',
        description: 'Track 10 questions',
        icon: '📚',
        check: (c) => ({ unlocked: c.totalQuestions >= 10, current: Math.min(c.totalQuestions, 10), target: 10 }),
    },
    {
        id: 'volume_problem_crusher',
        category: 'volume',
        tier: 'silver',
        title: 'Problem Crusher',
        description: 'Track 50 questions',
        icon: '💥',
        check: (c) => ({ unlocked: c.totalQuestions >= 50, current: Math.min(c.totalQuestions, 50), target: 50 }),
    },
    {
        id: 'volume_century_club',
        category: 'volume',
        tier: 'gold',
        title: 'Century Club',
        description: 'Track 100 questions',
        icon: '💯',
        check: (c) => ({ unlocked: c.totalQuestions >= 100, current: Math.min(c.totalQuestions, 100), target: 100 }),
    },
    {
        id: 'volume_legend',
        category: 'volume',
        tier: 'platinum',
        title: 'Legend',
        description: 'Track 500 questions',
        icon: '👑',
        check: (c) => ({ unlocked: c.totalQuestions >= 500, current: Math.min(c.totalQuestions, 500), target: 500 }),
    },

    // ── Mastery badges ────────────────────────────────────────────────────────
    {
        id: 'mastery_quick_learner',
        category: 'mastery',
        tier: 'bronze',
        title: 'Quick Learner',
        description: 'Master 5 problems (confidence 5)',
        icon: '🎯',
        check: (c) => ({ unlocked: c.masteredCount >= 5, current: Math.min(c.masteredCount, 5), target: 5 }),
    },
    {
        id: 'mastery_sharp_mind',
        category: 'mastery',
        tier: 'silver',
        title: 'Sharp Mind',
        description: 'Master 10 problems',
        icon: '🧠',
        check: (c) => ({ unlocked: c.masteredCount >= 10, current: Math.min(c.masteredCount, 10), target: 10 }),
    },
    {
        id: 'mastery_master_mind',
        category: 'mastery',
        tier: 'gold',
        title: 'Master Mind',
        description: 'Master 50 problems',
        icon: '🏅',
        check: (c) => ({ unlocked: c.masteredCount >= 50, current: Math.min(c.masteredCount, 50), target: 50 }),
    },
    {
        id: 'mastery_grandmaster',
        category: 'mastery',
        tier: 'platinum',
        title: 'Grandmaster',
        description: 'Master 100 problems',
        icon: '♛',
        check: (c) => ({ unlocked: c.masteredCount >= 100, current: Math.min(c.masteredCount, 100), target: 100 }),
    },

    // ── Consistency badges ────────────────────────────────────────────────────
    {
        id: 'consistency_daily_grind',
        category: 'consistency',
        tier: 'bronze',
        title: 'Daily Grind',
        description: 'Complete 10 total revisions',
        icon: '⚙️',
        check: (c) => ({ unlocked: c.totalRevisions >= 10, current: Math.min(c.totalRevisions, 10), target: 10 }),
    },
    {
        id: 'consistency_revision_machine',
        category: 'consistency',
        tier: 'silver',
        title: 'Revision Machine',
        description: 'Complete 50 total revisions',
        icon: '🔄',
        check: (c) => ({ unlocked: c.totalRevisions >= 50, current: Math.min(c.totalRevisions, 50), target: 50 }),
    },
    {
        id: 'consistency_revision_legend',
        category: 'consistency',
        tier: 'gold',
        title: 'Revision Legend',
        description: 'Complete 200 total revisions',
        icon: '⭐',
        check: (c) => ({ unlocked: c.totalRevisions >= 200, current: Math.min(c.totalRevisions, 200), target: 200 }),
    },
    {
        id: 'consistency_perfection',
        category: 'consistency',
        tier: 'platinum',
        title: 'Perfection',
        description: 'Complete 500 total revisions',
        icon: '💎',
        check: (c) => ({ unlocked: c.totalRevisions >= 500, current: Math.min(c.totalRevisions, 500), target: 500 }),
    },

    // ── Special badges ────────────────────────────────────────────────────────
    {
        id: 'special_dp_specialist',
        category: 'special',
        tier: 'gold',
        title: 'DP Specialist',
        description: 'Master 10 Dynamic Programming problems',
        icon: '🎓',
        check: (c) => ({ unlocked: c.dpMastered >= 10, current: Math.min(c.dpMastered, 10), target: 10 }),
    },
    {
        id: 'special_graph_guru',
        category: 'special',
        tier: 'gold',
        title: 'Graph Guru',
        description: 'Master 10 Graph problems',
        icon: '🕸️',
        check: (c) => ({ unlocked: c.graphMastered >= 10, current: Math.min(c.graphMastered, 10), target: 10 }),
    },
    {
        id: 'special_tree_whisperer',
        category: 'special',
        tier: 'gold',
        title: 'Tree Whisperer',
        description: 'Master 10 Tree problems',
        icon: '🌳',
        check: (c) => ({ unlocked: c.treeMastered >= 10, current: Math.min(c.treeMastered, 10), target: 10 }),
    },
    {
        id: 'special_array_ace',
        category: 'special',
        tier: 'silver',
        title: 'Array Ace',
        description: 'Master 10 Array problems',
        icon: '📊',
        check: (c) => ({ unlocked: c.arrayMastered >= 10, current: Math.min(c.arrayMastered, 10), target: 10 }),
    },
    {
        id: 'special_speed_runner',
        category: 'special',
        tier: 'silver',
        title: 'Speed Runner',
        description: 'Revise 5 questions in one day',
        icon: '⚡',
        check: (c) => ({ unlocked: c.maxRevisionsInDay >= 5, current: Math.min(c.maxRevisionsInDay, 5), target: 5 }),
    },
    {
        id: 'special_all_rounder',
        category: 'special',
        tier: 'gold',
        title: 'All-Rounder',
        description: 'Master questions across all 3 difficulties',
        icon: '🌟',
        check: (c) => ({ unlocked: c.allDifficultiesMastered, current: c.allDifficultiesMastered ? 3 : c.difficultiesMasteredCount, target: 3 }),
    },
    {
        id: 'special_level_10',
        category: 'special',
        tier: 'silver',
        title: 'Level Up Pro',
        description: 'Reach Level 10',
        icon: '🚀',
        check: (c) => ({ unlocked: c.level >= 10, current: Math.min(c.level, 10), target: 10 }),
    },
    {
        id: 'special_xp_collector',
        category: 'special',
        tier: 'gold',
        title: 'XP Collector',
        description: 'Earn 5000 total XP',
        icon: '✨',
        check: (c) => ({ unlocked: c.totalXP >= 5000, current: Math.min(c.totalXP, 5000), target: 5000 }),
    },
];

/**
 * Evaluates all badges against current user counts.
 * Returns the full list of badges with progress info and unlock status.
 *
 * @param {object} counts - pre-computed user metrics
 * @returns {{ badges: Array, newlyUnlocked: Array }}
 */
export function evaluateBadges(counts) {
    const badges = [];
    for (const def of BADGE_DEFINITIONS) {
        const result = def.check(counts);
        badges.push({
            id: def.id,
            category: def.category,
            tier: def.tier,
            title: def.title,
            description: def.description,
            icon: def.icon,
            progress: result.target > 0 ? Math.round((result.current / result.target) * 100) : 0,
            target: result.target,
            current: result.current,
            unlocked: result.unlocked,
        });
    }
    return badges;
}

/**
 * Checks which badges are newly unlocked compared to previously stored badges.
 * Mutates the user's badges array (in stats.badges) in-place.
 * Returns an array of newly-unlocked badge objects.
 *
 * @param {object} userStats - user.stats subdocument (must have .badges array)
 * @param {object} counts - pre-computed metrics for evaluateBadges
 * @returns {Array} newly unlocked badges
 */
export function checkAndUpdateBadges(userStats, counts) {
    const evaluated = evaluateBadges(counts);
    const newlyUnlocked = [];

    for (const badge of evaluated) {
        const existing = userStats.badges.find((b) => b.id === badge.id);
        if (existing) {
            // Update progress
            existing.progress = badge.progress;
            existing.current = badge.current;
            // Check for new unlock
            if (!existing.unlockedAt && badge.unlocked) {
                existing.unlockedAt = new Date();
                newlyUnlocked.push({ ...badge, unlockedAt: existing.unlockedAt });
            }
        } else {
            // Badge not in user's array yet — add it
            const newBadge = {
                id: badge.id,
                category: badge.category,
                tier: badge.tier,
                title: badge.title,
                description: badge.description,
                icon: badge.icon,
                unlockedAt: badge.unlocked ? new Date() : null,
                progress: badge.progress,
                target: badge.target,
                current: badge.current,
            };
            userStats.badges.push(newBadge);
            if (badge.unlocked) {
                newlyUnlocked.push({ ...badge, unlockedAt: newBadge.unlockedAt });
            }
        }
    }

    return newlyUnlocked;
}

/**
 * Gathers all the counts needed for badge evaluation from the database.
 * Call this before checkAndUpdateBadges.
 */
export async function gatherBadgeCounts(Question, userId, stats) {
    const [
        totalQuestions,
        masteredCount,
        dpMastered,
        graphMastered,
        treeMastered,
        arrayMastered,
        masteredEasy,
        masteredMedium,
        masteredHard,
    ] = await Promise.all([
        Question.countDocuments({ userId }),
        Question.countDocuments({ userId, confidence: 5 }),
        Question.countDocuments({ userId, confidence: 5, tags: { $regex: /dynamic/i } }),
        Question.countDocuments({ userId, confidence: 5, tags: { $regex: /graph/i } }),
        Question.countDocuments({ userId, confidence: 5, tags: { $regex: /tree/i } }),
        Question.countDocuments({ userId, confidence: 5, tags: { $regex: /array/i } }),
        Question.countDocuments({ userId, confidence: 5, difficulty: 'Easy' }),
        Question.countDocuments({ userId, confidence: 5, difficulty: 'Medium' }),
        Question.countDocuments({ userId, confidence: 5, difficulty: 'Hard' }),
    ]);

    // Count today's revisions for "Speed Runner" badge
    const today = todayISO();
    const todayRevisions = await Question.countDocuments({
        userId,
        'revisionHistory.date': today,
    });

    const difficultiesMasteredCount = (masteredEasy > 0 ? 1 : 0) + (masteredMedium > 0 ? 1 : 0) + (masteredHard > 0 ? 1 : 0);

    return {
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        totalQuestions,
        masteredCount,
        dpMastered,
        graphMastered,
        treeMastered,
        arrayMastered,
        totalRevisions: stats.totalRevisionsCount || 0,
        maxRevisionsInDay: todayRevisions,
        allDifficultiesMastered: difficultiesMasteredCount === 3,
        difficultiesMasteredCount,
        level: stats.level || 1,
        totalXP: stats.totalXP || 0,
    };
}
