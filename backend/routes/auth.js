import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/** Generate a signed JWT */
function signToken(userId) {
    return jwt.sign(
        { userId: userId.toString() },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
}

/** Format a user for the API response (strips passwordHash) */
function formatUser(user) {
    return {
        id: user._id,
        username: user.username,
        stats: user.stats,
        settings: user.settings,
        createdAt: user.createdAt,
    };
}

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Check if username already taken
        const existing = await User.findOne({ username: username.trim().toLowerCase() });
        if (existing) {
            return res.status(409).json({ message: 'Username is already taken' });
        }

        // Hash password (cost factor 12)
        const passwordHash = await bcrypt.hash(password, 12);

        const user = await User.create({
            username: username.trim().toLowerCase(),
            passwordHash,
        });

        const token = signToken(user._id);

        res.status(201).json({
            token,
            user: formatUser(user),
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'Username is already taken' });
        }
        if (err.name === 'ValidationError') {
            const msg = Object.values(err.errors).map((e) => e.message).join(', ');
            return res.status(400).json({ message: msg });
        }
        console.error('Signup error:', err);
        res.status(500).json({ message: 'Server error during signup' });
    }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const user = await User.findOne({ username: username.trim().toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const token = signToken(user._id);

        res.json({
            token,
            user: formatUser(user),
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
// Validates token and returns current user data (used on page refresh)
router.get('/me', protect, (req, res) => {
    res.json({ user: formatUser(req.user) });
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
// JWT is stateless — logout is handled client-side by removing the token.
// This endpoint exists for consistency and future token blacklist support.
router.post('/logout', protect, (_req, res) => {
    res.json({ message: 'Logged out successfully' });
});

export default router;
