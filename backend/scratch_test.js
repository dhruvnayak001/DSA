import 'dotenv/config';
import { connectDB } from './config/db.js';
import User from './models/User.js';

async function run() {
    await connectDB();
    console.log("DB connected");

    try {
        const users = await User.aggregate([
            { $match: {} },
            {
                $lookup: {
                    from: 'questions',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'questions',
                },
            },
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
            { $sort: { totalXP: -1, currentStreak: -1, totalQuestionsSolved: -1 } },
        ]);
        console.log("Success");
    } catch (e) {
        console.error("Aggregation error:", e.message);
    }
    process.exit(0);
}

run();
