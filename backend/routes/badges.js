import express from 'express';
import Question from '../models/Question.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { evaluateBadges, gatherBadgeCounts, checkAndUpdateBadges, getValidatedStreak } from '../utils/xp.js';

const router = express.Router();
router.use(protect);

// ── GET /api/badges ───────────────────────────────────────────────────────────
// Returns all badges with progress for the current user
router.get('/', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const counts = await gatherBadgeCounts(Question, req.user._id, user.stats);

        // Sync badges with latest definitions and progress
        const newlyUnlocked = checkAndUpdateBadges(user.stats, counts);
        if (newlyUnlocked.length > 0) {
            user.markModified('stats');
            await user.save();
        }

        // Return formatted badges
        const badges = user.stats.badges.map((b) => ({
            id: b.id,
            category: b.category,
            tier: b.tier,
            title: b.title,
            description: b.description,
            icon: b.icon,
            unlockedAt: b.unlockedAt ? b.unlockedAt.toISOString() : null,
            progress: b.progress,
            target: b.target,
            current: b.current,
        }));

        res.json({
            badges,
            stats: {
                currentStreak: getValidatedStreak(user.stats),
                longestStreak: user.stats.longestStreak,
                totalDaysActive: user.stats.totalDaysActive || 0,
                totalRevisionsCount: user.stats.totalRevisionsCount || 0,
                totalXP: user.stats.totalXP,
                level: user.stats.level,
            },
        });
    } catch (err) {
        console.error('Get badges error:', err);
        res.status(500).json({ message: 'Failed to fetch badges' });
    }
});

// ── GET /api/badges/streak-calendar ───────────────────────────────────────────
// Returns daily revision counts for the last 365 days (for the heatmap)
router.get('/streak-calendar', async (req, res) => {
    try {
        const userId = req.user._id;

        // Calculate date range: last 365 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 365);
        const startISO = startDate.toISOString().split('T')[0];

        // Aggregate activity from all user questions
        const questions = await Question.find(
            { userId },
            { revisionHistory: 1, createdAt: 1 }
        ).lean();

        // Count activity per day (revisions + question additions)
        const dayCounts = {};
        for (const q of questions) {
            // Count question creation as activity
            if (q.createdAt) {
                const createdDate = new Date(q.createdAt).toISOString().split('T')[0];
                if (createdDate >= startISO) {
                    dayCounts[createdDate] = (dayCounts[createdDate] || 0) + 1;
                }
            }
            // Count revisions as activity
            for (const rev of (q.revisionHistory || [])) {
                const date = typeof rev.date === 'string'
                    ? rev.date.split('T')[0]
                    : new Date(rev.date).toISOString().split('T')[0];
                if (date >= startISO) {
                    dayCounts[date] = (dayCounts[date] || 0) + 1;
                }
            }
        }

        // Convert to sorted array
        const calendar = Object.entries(dayCounts)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        res.json(calendar);
    } catch (err) {
        console.error('Streak calendar error:', err);
        res.status(500).json({ message: 'Failed to fetch streak calendar' });
    }
});

export default router;
