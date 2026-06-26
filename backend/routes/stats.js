import express from 'express';
import User from '../models/User.js';
import Question from '../models/Question.js';
import { protect } from '../middleware/auth.js';
import { getValidatedStreak } from '../utils/xp.js';

const router = express.Router();
router.use(protect);

// ── GET /api/stats ────────────────────────────────────────────────────────────
// Returns stats with live-validated streak
router.get('/', (req, res) => {
    const stats = req.user.stats.toObject ? req.user.stats.toObject() : { ...req.user.stats };
    stats.currentStreak = getValidatedStreak(req.user.stats);
    res.json(stats);
});

// ── POST /api/stats/recalculate ───────────────────────────────────────────────
// Recomputes totalDaysActive and totalRevisionsCount from real question data.
// Safe to call multiple times — idempotent.
router.post('/recalculate', async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        // Fetch all questions with their creation date and revision history
        const questions = await Question.find({ userId }, { revisionHistory: 1, createdAt: 1 }).lean();

        // Collect all activity dates (question creation + revisions)
        const activityDates = new Set();
        let totalRevisions = 0;

        for (const q of questions) {
            // Count question creation as an activity
            if (q.createdAt) {
                const d = new Date(q.createdAt);
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                activityDates.add(dateStr);
            }
            // Count each revision
            for (const rev of (q.revisionHistory || [])) {
                totalRevisions++;
                const rawDate = typeof rev.date === 'string' ? rev.date : new Date(rev.date).toISOString();
                const dateStr = rawDate.split('T')[0];
                activityDates.add(dateStr);
            }
        }

        // Recalculate streak from scratch using sorted activity dates
        const sortedDates = Array.from(activityDates).sort();
        let currentStreak = 0;
        let longestStreak = 0;

        if (sortedDates.length > 0) {
            // Calculate streak ending at the most recent date
            let streak = 1;
            for (let i = sortedDates.length - 1; i > 0; i--) {
                const curr = new Date(sortedDates[i]);
                const prev = new Date(sortedDates[i - 1]);
                const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    streak++;
                } else {
                    break;
                }
            }

            // Check if the streak is still alive (last activity today or yesterday)
            const lastDate = sortedDates[sortedDates.length - 1];
            const now = new Date();
            const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const yd = new Date(); yd.setDate(yd.getDate() - 1);
            const yesterday = `${yd.getFullYear()}-${String(yd.getMonth() + 1).padStart(2, '0')}-${String(yd.getDate()).padStart(2, '0')}`;

            currentStreak = (lastDate === today || lastDate === yesterday) ? streak : 0;

            // Calculate overall longest streak
            let tempStreak = 1;
            longestStreak = 1;
            for (let i = 1; i < sortedDates.length; i++) {
                const curr = new Date(sortedDates[i]);
                const prev = new Date(sortedDates[i - 1]);
                const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    tempStreak++;
                    longestStreak = Math.max(longestStreak, tempStreak);
                } else {
                    tempStreak = 1;
                }
            }
        }

        // Update user stats
        user.stats.totalDaysActive = activityDates.size;
        user.stats.totalRevisionsCount = totalRevisions;
        user.stats.currentStreak = currentStreak;
        user.stats.longestStreak = Math.max(longestStreak, user.stats.longestStreak || 0);

        // Update lastRevisionDate to the most recent activity date if it's missing
        if (!user.stats.lastRevisionDate && sortedDates.length > 0) {
            user.stats.lastRevisionDate = sortedDates[sortedDates.length - 1];
        }

        user.markModified('stats');
        await user.save();

        const stats = user.stats.toObject ? user.stats.toObject() : { ...user.stats };
        stats.currentStreak = getValidatedStreak(user.stats);
        res.json({ message: 'Stats recalculated successfully', stats });
    } catch (err) {
        console.error('Recalculate stats error:', err);
        res.status(500).json({ message: 'Failed to recalculate stats' });
    }
});

// ── PATCH /api/stats ──────────────────────────────────────────────────────────
// Partial update — used for localStorage migration
router.patch('/', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const updates = req.body;

        if (updates.currentStreak !== undefined) user.stats.currentStreak = updates.currentStreak;
        if (updates.longestStreak !== undefined) user.stats.longestStreak = updates.longestStreak;
        if (updates.lastRevisionDate !== undefined) user.stats.lastRevisionDate = updates.lastRevisionDate;
        if (updates.totalXP !== undefined) user.stats.totalXP = updates.totalXP;
        if (updates.level !== undefined) user.stats.level = updates.level;

        if (Array.isArray(updates.achievements)) {
            for (const incoming of updates.achievements) {
                const existing = user.stats.achievements.find((a) => a.id === incoming.id);
                if (existing && !existing.unlockedAt && incoming.unlockedAt) {
                    existing.unlockedAt = new Date(incoming.unlockedAt);
                }
            }
        }

        user.markModified('stats');
        await user.save();
        res.json(user.stats);
    } catch (err) {
        console.error('Update stats error:', err);
        res.status(500).json({ message: 'Failed to update stats' });
    }
});

export default router;
