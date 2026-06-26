import express from 'express';
import mongoose from 'mongoose';
import Question from '../models/Question.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import {
    calculateXP,
    calculateLevel,
    calculateNextRevision,
    updateStreak,
    checkAchievements,
    checkAchievementsFromCounts,
    checkAndUpdateBadges,
    gatherBadgeCounts,
    todayISO,
} from '../utils/xp.js';

const router = express.Router();

/** Validate that req.params.id is a valid MongoDB ObjectId */
function validateObjectId(req, res, next) {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid question ID' });
    }
    next();
}

// All question routes require authentication
router.use(protect);

/** Format a Mongoose question doc to match the frontend DSAQuestion type */
function formatQuestion(doc) {
    return {
        id: doc._id.toString(),
        name: doc.name,
        url: doc.url,
        platform: doc.platform,
        difficulty: doc.difficulty,
        tags: doc.tags,
        approachSummary: doc.approachSummary,
        optimalApproach: doc.optimalApproach,
        timeComplexity: doc.timeComplexity,
        spaceComplexity: doc.spaceComplexity,
        confidence: doc.confidence,
        mistakeNotes: doc.mistakeNotes,
        lastRevised: doc.lastRevised,
        nextRevision: doc.nextRevision,
        revisionHistory: doc.revisionHistory,
        xpEarned: doc.xpEarned,
        createdAt: doc.createdAt.toISOString(),
    };
}

// ── GET /api/questions ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const questions = await Question.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(questions.map(formatQuestion));
    } catch (err) {
        console.error('Get questions error:', err);
        res.status(500).json({ message: 'Failed to fetch questions' });
    }
});

// ── POST /api/questions ───────────────────────────────────────────────────────
router.post('/', async (req, res) => {
    try {
        const data = req.body;
        const userId = req.user._id;

        // Server-side duplicate detection (name is unique per user via index)
        const nextRevision = calculateNextRevision(data.confidence, data.lastRevised);
        const revisionHistory = data.lastRevised
            ? [{ date: data.lastRevised, confidence: data.confidence }]
            : [];

        const question = await Question.create({
            userId,
            name: data.name,
            url: data.url || '',
            platform: data.platform,
            difficulty: data.difficulty,
            tags: data.tags || [],
            approachSummary: data.approachSummary || '',
            optimalApproach: data.optimalApproach || '',
            timeComplexity: data.timeComplexity || '',
            spaceComplexity: data.spaceComplexity || '',
            confidence: data.confidence,
            mistakeNotes: data.mistakeNotes || '',
            lastRevised: data.lastRevised || '',
            nextRevision,
            revisionHistory,
            xpEarned: 0,
        });

        // Update user stats (use count to avoid N+1 query for achievements)
        const user = await User.findById(userId);
        const today = todayISO();

        // Streak: solving a problem counts toward your daily streak
        updateStreak(user.stats, today);

        user.stats.totalXP += calculateXP('add');
        user.stats.level = calculateLevel(user.stats.totalXP);
        const totalCount = await Question.countDocuments({ userId });
        const masteredCount = await Question.countDocuments({ userId, confidence: 5 });
        const dpMasteredCount = await Question.countDocuments({ userId, confidence: 5, tags: { $regex: /dynamic/i } });
        checkAchievementsFromCounts(user.stats, totalCount, masteredCount, dpMasteredCount);

        // Check badges
        const badgeCounts = await gatherBadgeCounts(Question, userId, user.stats);
        const newlyUnlocked = checkAndUpdateBadges(user.stats, badgeCounts);

        user.markModified('stats');
        await user.save();

        const response = {
            question: formatQuestion(question),
            stats: user.stats,
        };
        if (newlyUnlocked.length > 0) {
            response.newBadges = newlyUnlocked;
        }
        res.status(201).json(response);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'A question with this name already exists' });
        }
        if (err.name === 'ValidationError') {
            const msg = Object.values(err.errors).map((e) => e.message).join(', ');
            return res.status(400).json({ message: msg });
        }
        console.error('Add question error:', err);
        res.status(500).json({ message: 'Failed to add question' });
    }
});

// ── POST /api/questions/import ────────────────────────────────────────────────
// MUST be defined BEFORE /:id routes to avoid Express matching 'import' as :id
router.post('/import', async (req, res) => {
    try {
        const { questions } = req.body;
        if (!Array.isArray(questions)) {
            return res.status(400).json({ message: 'questions must be an array' });
        }

        const userId = req.user._id;

        // Delete all existing questions for this user
        await Question.deleteMany({ userId });

        // Insert new ones
        if (questions.length > 0) {
            const docs = questions.map((q) => ({
                userId,
                name: q.name,
                url: q.url || '',
                platform: q.platform,
                difficulty: q.difficulty,
                tags: q.tags || [],
                approachSummary: q.approachSummary || '',
                optimalApproach: q.optimalApproach || '',
                timeComplexity: q.timeComplexity || '',
                spaceComplexity: q.spaceComplexity || '',
                confidence: q.confidence,
                mistakeNotes: q.mistakeNotes || '',
                lastRevised: q.lastRevised || '',
                nextRevision: q.nextRevision || calculateNextRevision(q.confidence),
                revisionHistory: q.revisionHistory || [],
                xpEarned: q.xpEarned || 0,
                createdAt: q.createdAt ? new Date(q.createdAt) : new Date(),
            }));
            await Question.insertMany(docs, { ordered: false });
        }

        const saved = await Question.find({ userId }).sort({ createdAt: -1 });
        res.json({
            message: `Imported ${saved.length} questions`,
            questions: saved.map(formatQuestion),
        });
    } catch (err) {
        console.error('Import error:', err);
        res.status(500).json({ message: 'Failed to import questions' });
    }
});

// ── PUT /api/questions/:id ────────────────────────────────────────────────────
router.put('/:id', validateObjectId, async (req, res) => {
    try {
        const question = await Question.findOne({ _id: req.params.id, userId: req.user._id });
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        const data = req.body;
        // Update fields (but preserve revisionHistory and xpEarned from existing doc)
        Object.assign(question, {
            name: data.name ?? question.name,
            url: data.url ?? question.url,
            platform: data.platform ?? question.platform,
            difficulty: data.difficulty ?? question.difficulty,
            tags: data.tags ?? question.tags,
            approachSummary: data.approachSummary ?? question.approachSummary,
            optimalApproach: data.optimalApproach ?? question.optimalApproach,
            timeComplexity: data.timeComplexity ?? question.timeComplexity,
            spaceComplexity: data.spaceComplexity ?? question.spaceComplexity,
            confidence: data.confidence ?? question.confidence,
            mistakeNotes: data.mistakeNotes ?? question.mistakeNotes,
            lastRevised: data.lastRevised ?? question.lastRevised,
        });
        await question.save();

        res.json(formatQuestion(question));
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'A question with this name already exists' });
        }
        console.error('Update question error:', err);
        res.status(500).json({ message: 'Failed to update question' });
    }
});

// ── DELETE /api/questions/:id ─────────────────────────────────────────────────
router.delete('/:id', validateObjectId, async (req, res) => {
    try {
        const result = await Question.deleteOne({ _id: req.params.id, userId: req.user._id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Question not found' });
        }
        res.json({ message: 'Question deleted' });
    } catch (err) {
        console.error('Delete question error:', err);
        res.status(500).json({ message: 'Failed to delete question' });
    }
});

// ── POST /api/questions/:id/duplicate ────────────────────────────────────────
router.post('/:id/duplicate', validateObjectId, async (req, res) => {
    try {
        const original = await Question.findOne({ _id: req.params.id, userId: req.user._id });
        if (!original) {
            return res.status(404).json({ message: 'Question not found' });
        }

        const copy = await Question.create({
            userId: req.user._id,
            name: `${original.name} (Copy)`,
            url: original.url,
            platform: original.platform,
            difficulty: original.difficulty,
            tags: original.tags,
            approachSummary: original.approachSummary,
            optimalApproach: original.optimalApproach,
            timeComplexity: original.timeComplexity,
            spaceComplexity: original.spaceComplexity,
            confidence: original.confidence,
            mistakeNotes: original.mistakeNotes,
            lastRevised: original.lastRevised,
            nextRevision: original.nextRevision,
            revisionHistory: [],
            xpEarned: 0,
        });

        res.status(201).json(formatQuestion(copy));
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'A copy of this question already exists' });
        }
        console.error('Duplicate question error:', err);
        res.status(500).json({ message: 'Failed to duplicate question' });
    }
});

// ── POST /api/questions/:id/revise ────────────────────────────────────────────
router.post('/:id/revise', validateObjectId, async (req, res) => {
    try {
        const { confidence } = req.body;
        if (!confidence || confidence < 1 || confidence > 5) {
            return res.status(400).json({ message: 'Confidence must be 1–5' });
        }

        const question = await Question.findOne({ _id: req.params.id, userId: req.user._id });
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        const today = todayISO();
        question.confidence = confidence;
        question.lastRevised = today;
        question.nextRevision = calculateNextRevision(confidence, today);
        question.revisionHistory.push({ date: today, confidence });

        const xpGain = calculateXP('revise') + (confidence === 5 ? calculateXP('master') : 0);
        question.xpEarned += xpGain;
        await question.save();

        // Update user stats
        const user = await User.findById(req.user._id);
        updateStreak(user.stats, today);
        user.stats.totalXP += xpGain;
        user.stats.level = calculateLevel(user.stats.totalXP);

        // Increment total revision count
        user.stats.totalRevisionsCount = (user.stats.totalRevisionsCount || 0) + 1;

        const totalCount = await Question.countDocuments({ userId: req.user._id });
        const masteredCount = await Question.countDocuments({ userId: req.user._id, confidence: 5 });
        const dpMasteredCount = await Question.countDocuments({ userId: req.user._id, confidence: 5, tags: { $regex: /dynamic/i } });
        checkAchievementsFromCounts(user.stats, totalCount, masteredCount, dpMasteredCount);

        // Check badges
        const badgeCounts = await gatherBadgeCounts(Question, req.user._id, user.stats);
        const newlyUnlocked = checkAndUpdateBadges(user.stats, badgeCounts);

        user.markModified('stats');
        await user.save();

        const response = {
            question: formatQuestion(question),
            stats: user.stats,
        };
        if (newlyUnlocked.length > 0) {
            response.newBadges = newlyUnlocked;
        }
        res.json(response);
    } catch (err) {
        console.error('Mark revised error:', err);
        res.status(500).json({ message: 'Failed to mark as revised' });
    }
});

// ── POST /api/questions/reset ─────────────────────────────────────────────────
// Reset all data: deletes all questions and resets user stats completely.
router.post('/reset', async (req, res) => {
    try {
        const userId = req.user._id;

        // Delete all questions
        await Question.deleteMany({ userId });

        // Reset user stats
        const user = await User.findById(userId);
        if (user) {
            user.stats.totalXP = 0;
            user.stats.level = 1;
            user.stats.currentStreak = 0;
            user.stats.longestStreak = 0;
            user.stats.lastRevisionDate = '';
            user.stats.totalRevisionsCount = 0;
            user.stats.totalDaysActive = 0;
            
            // Reset all achievements
            for (const ach of user.stats.achievements) {
                ach.unlockedAt = null;
            }

            // Reset all badges
            user.stats.badges = [];

            user.markModified('stats');
            await user.save();
        }

        res.json({
            message: 'All data reset successfully',
            stats: user ? user.stats : null,
        });
    } catch (err) {
        console.error('Reset error:', err);
        res.status(500).json({ message: 'Failed to reset data' });
    }
});

export default router;
