/**
 * XP and achievement utilities — mirrors the frontend helpers.ts logic.
 * Kept server-side so XP is authoritative and can't be spoofed by the client.
 */

/** XP awarded per action */
export function calculateXP(action) {
    const xpMap = { add: 10, revise: 15, master: 50 };
    return xpMap[action] ?? 0;
}

/** Level = floor(totalXP / 100) + 1 */
export function calculateLevel(xp) {
    return Math.floor(xp / 100) + 1;
}

/** Returns today as "YYYY-MM-DD" */
export function todayISO() {
    return new Date().toISOString().split('T')[0];
}

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

/**
 * Updates the user's streak based on today's date.
 * Modifies the stats object in-place.
 */
export function updateStreak(stats, today) {
    const last = stats.lastRevisionDate;
    if (last === today) return; // already revised today

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];

    if (last === yStr) {
        stats.currentStreak += 1;
    } else {
        stats.currentStreak = 1;
    }

    stats.longestStreak = Math.max(stats.currentStreak, stats.longestStreak);
    stats.lastRevisionDate = today;
}

/**
 * Checks and unlocks achievements based on current questions and stats.
 * Mutates stats.achievements in-place.
 * @param {object} stats - user stats subdocument
 * @param {Array}  questions - all user questions from DB
 */
export function checkAchievements(stats, questions) {
    const total = questions.length;
    const mastered = questions.filter((q) => q.confidence === 5).length;
    const dpMastered = questions.filter(
        (q) => q.confidence === 5 && q.tags.some((t) => t.toLowerCase().includes('dynamic'))
    ).length;

    for (const ach of stats.achievements) {
        if (ach.unlockedAt) continue;
        let unlock = false;
        if (ach.condition === 'questions >= 1'  && total >= 1)           unlock = true;
        if (ach.condition === 'questions >= 10' && total >= 10)          unlock = true;
        if (ach.condition === 'questions >= 50' && total >= 50)          unlock = true;
        if (ach.condition === 'questions >= 100' && total >= 100)        unlock = true;
        if (ach.condition === 'streak >= 7'     && stats.currentStreak >= 7)  unlock = true;
        if (ach.condition === 'streak >= 30'    && stats.currentStreak >= 30) unlock = true;
        if (ach.condition === 'mastered >= 10'  && mastered >= 10)       unlock = true;
        if (ach.condition === 'mastered >= 50'  && mastered >= 50)       unlock = true;
        if (ach.condition === 'dp_mastered >= 10' && dpMastered >= 10)   unlock = true;
        if (unlock) ach.unlockedAt = new Date();
    }
}
