import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { todayISO } from '../utils/xp.js';
import Question from '../models/Question.js';

const router = express.Router();
router.use(protect);

// ── GET /api/leaderboard ──────────────────────────────────────────────────────
// Returns all users ranked by XP, with question counts and live streak values.
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;

        // Build match filter for optional username search
        const matchStage = search
            ? { username: { $regex: search, $options: 'i' } }
            : {};

        const users = await User.aggregate([
            { $match: matchStage },

            // Join with questions collection to count problems per user
            {
                $lookup: {
                    from: 'questions',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'questions',
                },
            },

            // Project only the fields we need
            {
                $project: {
                    username: 1,
                    totalXP: { $ifNull: ['$stats.totalXP', 0] },
                    level: { $ifNull: ['$stats.level', 1] },
                    currentStreak: { $ifNull: ['$stats.currentStreak', 0] },
                    longestStreak: { $ifNull: ['$stats.longestStreak', 0] },
                    lastRevisionDate: { $ifNull: ['$stats.lastRevisionDate', ''] },
                    totalRevisionsCount: { $ifNull: ['$stats.totalRevisionsCount', 0] },
                    totalQuestionsSolved: { $size: '$questions' },
                    // Count badges where unlockedAt is not null
                    badgeCount: {
                        $size: {
                            $filter: {
                                input: { $ifNull: ['$stats.badges', []] },
                                as: 'badge',
                                cond: { $ne: ['$$badge.unlockedAt', null] },
                            },
                        },
                    },
                },
            },

            // Sort by totalXP descending, then streak, then problems
            { $sort: { totalXP: -1, currentStreak: -1, totalQuestionsSolved: -1 } },
        ]);

        // Live-validate streaks (same logic as getValidatedStreak)
        const today = todayISO();
        const yd = new Date();
        yd.setDate(yd.getDate() - 1);
        const yesterday = `${yd.getFullYear()}-${String(yd.getMonth() + 1).padStart(2, '0')}-${String(yd.getDate()).padStart(2, '0')}`;

        const leaderboard = users.map((u, index) => {
            // If user hasn't been active today or yesterday, streak is broken
            let liveStreak = u.currentStreak;
            if (u.lastRevisionDate && u.lastRevisionDate !== today && u.lastRevisionDate !== yesterday) {
                liveStreak = 0;
            }
            if (!u.lastRevisionDate) {
                liveStreak = 0;
            }

            return {
                rank: index + 1,
                userId: u._id.toString(),
                username: u.username,
                totalXP: u.totalXP,
                level: u.level,
                currentStreak: liveStreak,
                longestStreak: u.longestStreak,
                totalQuestionsSolved: u.totalQuestionsSolved,
                totalRevisionsCount: u.totalRevisionsCount,
                badgeCount: u.badgeCount,
            };
        });

        res.json({
            leaderboard,
            currentUserId: req.user._id.toString(),
        });
    } catch (err) {
        console.error('Leaderboard error:', err);
        res.status(500).json({ message: 'Failed to load leaderboard' });
    }
});

// ── GET /api/leaderboard/:id ──────────────────────────────────────────────────
// Returns a specific user's public profile and recent history
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).select('username stats');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch user's questions to calculate stats and recent history
        const questions = await Question.find({ userId: id })
            .select('title difficulty confidence revisionHistory platform')
            .lean();

        // Calculate difficulty breakdown
        const difficultyStats = { Easy: 0, Medium: 0, Hard: 0 };
        questions.forEach(q => {
            if (q.difficulty && difficultyStats[q.difficulty] !== undefined) {
                difficultyStats[q.difficulty]++;
            }
        });

        // Get 10 most recently revised questions
        // A question's latest revision is the last item in revisionHistory array
        const recentQuestions = questions
            .filter(q => q.revisionHistory && q.revisionHistory.length > 0)
            .sort((a, b) => {
                const dateA = new Date(a.revisionHistory[a.revisionHistory.length - 1].date);
                const dateB = new Date(b.revisionHistory[b.revisionHistory.length - 1].date);
                return dateB - dateA;
            })
            .slice(0, 10)
            .map(q => ({
                id: q._id.toString(),
                title: q.title,
                difficulty: q.difficulty,
                confidence: q.confidence,
                platform: q.platform,
                lastRevised: q.revisionHistory[q.revisionHistory.length - 1].date,
            }));

        // Live validate streak
        let liveStreak = user.stats?.currentStreak || 0;
        const today = todayISO();
        const yd = new Date();
        yd.setDate(yd.getDate() - 1);
        const yesterday = `${yd.getFullYear()}-${String(yd.getMonth() + 1).padStart(2, '0')}-${String(yd.getDate()).padStart(2, '0')}`;
        
        const lastRev = user.stats?.lastRevisionDate;
        if (lastRev && lastRev !== today && lastRev !== yesterday) {
            liveStreak = 0;
        }
        if (!lastRev) liveStreak = 0;

        const profileData = {
            userId: user._id.toString(),
            username: user.username,
            totalXP: user.stats?.totalXP || 0,
            level: user.stats?.level || 1,
            currentStreak: liveStreak,
            longestStreak: user.stats?.longestStreak || 0,
            totalQuestionsSolved: questions.length,
            totalRevisionsCount: user.stats?.totalRevisionsCount || 0,
            badges: (user.stats?.badges || []).filter(b => b.unlockedAt).map(b => ({
                id: b.id,
                title: b.title,
                icon: b.icon,
                tier: b.tier,
                unlockedAt: b.unlockedAt
            })),
            difficultyStats,
            recentQuestions,
        };

        res.json(profileData);
    } catch (err) {
        console.error('Profile fetch error:', err);
        res.status(500).json({ message: 'Failed to load user profile' });
    }
});

export default router;
