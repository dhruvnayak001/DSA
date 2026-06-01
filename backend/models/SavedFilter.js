import mongoose from 'mongoose';

// ── QuestionFilters sub-schema ─────────────────────────────────────────────────
const questionFiltersSchema = new mongoose.Schema({
    search: { type: String, default: '' },
    platform: { type: String, default: 'all' },
    difficulty: { type: String, default: 'all' },
    confidence: { type: String, default: 'all' },
    dueStatus: { type: String, default: 'all' },
    tags: { type: String, default: 'all' },
}, { _id: false });

// ── SavedFilter schema ────────────────────────────────────────────────────────
const savedFilterSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: [true, 'Filter name is required'],
        trim: true,
        maxlength: [50, 'Filter name cannot exceed 50 characters'],
    },
    filters: { type: questionFiltersSchema, default: () => ({}) },
}, {
    timestamps: true,
});

export default mongoose.model('SavedFilter', savedFilterSchema);
