import express from 'express';
import SavedFilter from '../models/SavedFilter.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

/** Format a saved filter doc for the frontend */
function formatFilter(doc) {
    return {
        id: doc._id.toString(),
        name: doc.name,
        filters: doc.filters,
    };
}

// ── GET /api/filters ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const filters = await SavedFilter.find({ userId: req.user._id }).sort({ createdAt: 1 });
        res.json(filters.map(formatFilter));
    } catch (err) {
        console.error('Get filters error:', err);
        res.status(500).json({ message: 'Failed to fetch saved filters' });
    }
});

// ── POST /api/filters ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
    try {
        const { name, filters } = req.body;
        if (!name?.trim()) {
            return res.status(400).json({ message: 'Filter name is required' });
        }

        const filter = await SavedFilter.create({
            userId: req.user._id,
            name: name.trim(),
            filters: filters || {},
        });

        res.status(201).json(formatFilter(filter));
    } catch (err) {
        if (err.name === 'ValidationError') {
            const msg = Object.values(err.errors).map((e) => e.message).join(', ');
            return res.status(400).json({ message: msg });
        }
        console.error('Create filter error:', err);
        res.status(500).json({ message: 'Failed to create filter' });
    }
});

// ── DELETE /api/filters/:id ───────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
    try {
        const result = await SavedFilter.deleteOne({ _id: req.params.id, userId: req.user._id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Filter not found' });
        }
        res.json({ message: 'Filter deleted' });
    } catch (err) {
        console.error('Delete filter error:', err);
        res.status(500).json({ message: 'Failed to delete filter' });
    }
});

export default router;
