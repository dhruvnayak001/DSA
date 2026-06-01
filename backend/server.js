import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import questionRoutes from './routes/questions.js';
import statsRoutes from './routes/stats.js';
import settingsRoutes from './routes/settings.js';
import filterRoutes from './routes/filters.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ── Connect to MongoDB ────────────────────────────────────────────────────────
await connectDB();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // 10mb allows bulk imports

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/filters', filterRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
    });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 DSA Tracker API running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);
});
