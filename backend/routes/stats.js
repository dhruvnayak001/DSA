import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// ── GET /api/stats ────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
    res.json(req.user.stats);
});

// ── PATCH /api/stats ──────────────────────────────────────────────────────────
// Partial update — used for localStorage migration
router.patch('/', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const updates = req.body;

        // Merge top-level stats fields
        if (updates.currentStreak !== undefined) user.stats.currentStreak = updates.currentStreak;
        if (updates.longestStreak !== undefined) user.stats.longestStreak = updates.longestStreak;
        if (updates.lastRevisionDate !== undefined) user.stats.lastRevisionDate = updates.lastRevisionDate;
        if (updates.totalXP !== undefined) user.stats.totalXP = updates.totalXP;
        if (updates.level !== undefined) user.stats.level = updates.level;

        // Merge achievements: preserve locks already earned, apply incoming unlock timestamps
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
