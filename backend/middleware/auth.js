import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware: verifies JWT and attaches `req.user` to the request.
 * Token must be sent as:  Authorization: Bearer <token>
 */
export async function protect(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided — please log in' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the full user document (minus passwordHash via toJSON)
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: 'User no longer exists' });
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Session expired — please log in again' });
        }
        return res.status(401).json({ message: 'Invalid token — please log in' });
    }
}
