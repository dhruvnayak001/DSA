import mongoose from 'mongoose';

// ── RevisionEntry sub-schema ──────────────────────────────────────────────────
const revisionEntrySchema = new mongoose.Schema({
    date: { type: String, required: true },        // ISO "YYYY-MM-DD"
    confidence: { type: Number, min: 1, max: 5, required: true },
}, { _id: false });

// ── Question schema ───────────────────────────────────────────────────────────
const questionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: [true, 'Question name is required'],
        trim: true,
    },
    url: { type: String, default: '' },
    platform: {
        type: String,
        required: true,
        enum: ['LeetCode', 'GeeksforGeeks', 'Striver A2Z DSA Sheet', 'Codeforces', 'CodeChef', 'HackerRank', 'InterviewBit', 'Other'],
    },
    difficulty: {
        type: String,
        required: true,
        enum: ['Easy', 'Medium', 'Hard'],
    },
    tags: { type: [String], default: [] },
    approachSummary: { type: String, default: '' },
    optimalApproach: { type: String, default: '' },
    timeComplexity: { type: String, default: '' },
    spaceComplexity: { type: String, default: '' },
    confidence: { type: Number, min: 1, max: 5, required: true },
    mistakeNotes: { type: String, default: '' },
    lastRevised: { type: String, default: '' },     // ISO date
    nextRevision: { type: String, default: '' },    // ISO date
    revisionHistory: { type: [revisionEntrySchema], default: [] },
    xpEarned: { type: Number, default: 0 },
}, {
    timestamps: true,
});

// ── Indexes ───────────────────────────────────────────────────────────────────
// Fast lookup for "all questions for this user"
questionSchema.index({ userId: 1 });

// Revision queue: "questions due today for this user"
questionSchema.index({ userId: 1, nextRevision: 1 });

// Analytics queries
questionSchema.index({ userId: 1, confidence: 1 });
questionSchema.index({ userId: 1, difficulty: 1 });

// Unique constraint: no duplicate names per user
questionSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model('Question', questionSchema);
