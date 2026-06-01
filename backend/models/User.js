import mongoose from 'mongoose';

// ── Achievement sub-schema ────────────────────────────────────────────────────
const achievementSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    unlockedAt: { type: Date, default: null },
    condition: { type: String, required: true },
}, { _id: false });

// ── Stats sub-schema ─────────────────────────────────────────────────────────
const statsSchema = new mongoose.Schema({
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastRevisionDate: { type: String, default: '' }, // ISO date "YYYY-MM-DD"
    totalXP: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    achievements: {
        type: [achievementSchema],
        default: [
            { id: 'first_question', title: 'First Step', description: 'Add your first DSA question', icon: '🎯', unlockedAt: null, condition: 'questions >= 1' },
            { id: 'questions_10', title: 'Getting Started', description: 'Track 10 questions', icon: '📚', unlockedAt: null, condition: 'questions >= 10' },
            { id: 'questions_50', title: 'Grinder', description: 'Track 50 questions', icon: '⚡', unlockedAt: null, condition: 'questions >= 50' },
            { id: 'questions_100', title: 'Century', description: 'Track 100 questions', icon: '💯', unlockedAt: null, condition: 'questions >= 100' },
            { id: 'streak_7', title: '7-Day Streak', description: 'Revise for 7 consecutive days', icon: '🔥', unlockedAt: null, condition: 'streak >= 7' },
            { id: 'streak_30', title: 'Monthly Grind', description: 'Revise for 30 consecutive days', icon: '🏆', unlockedAt: null, condition: 'streak >= 30' },
            { id: 'mastered_10', title: 'Master Mind', description: 'Master 10 problems', icon: '🧠', unlockedAt: null, condition: 'mastered >= 10' },
            { id: 'mastered_50', title: 'DSA Expert', description: 'Master 50 problems', icon: '👑', unlockedAt: null, condition: 'mastered >= 50' },
            { id: 'dp_specialist', title: 'DP Specialist', description: 'Master 10 Dynamic Programming problems', icon: '🎓', unlockedAt: null, condition: 'dp_mastered >= 10' },
        ],
    },
}, { _id: false });

// ── Settings sub-schema ──────────────────────────────────────────────────────
const settingsSchema = new mongoose.Schema({
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
}, { _id: false });

// ── User schema ───────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'],
    },
    passwordHash: {
        type: String,
        required: true,
    },
    stats: { type: statsSchema, default: () => ({}) },
    settings: { type: settingsSchema, default: () => ({}) },
}, {
    timestamps: true,  // adds createdAt + updatedAt automatically
});

// Never expose passwordHash in JSON responses
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.passwordHash;
    return obj;
};

export default mongoose.model('User', userSchema);
