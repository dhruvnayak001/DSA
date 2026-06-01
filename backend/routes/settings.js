import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// ── GET /api/settings ─────────────────────────────────────────────────────────
router.get('/', (req, res) => {
    res.json(req.user.settings);
});

// ── PATCH /api/settings ───────────────────────────────────────────────────────
router.patch('/', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { theme } = req.body;

        if (theme !== undefined) {
            if (!['light', 'dark'].includes(theme)) {
                return res.status(400).json({ message: 'theme must be "light" or "dark"' });
            }
            user.settings.theme = theme;
        }

        user.markModified('settings');
        await user.save();
        res.json(user.settings);
    } catch (err) {
        console.error('Update settings error:', err);
        res.status(500).json({ message: 'Failed to update settings' });
    }
});

export default router;
