// auth.js — JWT middleware, runs before protected routes
import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// requireAuth — checks if request has a valid JWT token
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // token must be in "Bearer <token>" format
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ success: false, error: 'No token provided' });

    const token = authHeader.split(' ')[1];

    // jwt.verify throws if token is invalid or expired
    const decoded = jwt.verify(token, JWT_SECRET);

    // look up user in DB to make sure they still exist and aren't blocked
    const result = await db.query(
      'SELECT id, name, email, avatar, is_admin, blocked FROM users WHERE id = $1',
      [decoded.id]
    );
    const user = result.rows[0];

    if (!user) return res.status(401).json({ success: false, error: 'User not found' });
    if (user.blocked) return res.status(401).json({ success: false, error: 'Account blocked' });

    req.user = user; // attach user to request so controllers can use it
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError')  return res.status(401).json({ success: false, error: 'Invalid token' });
    if (err.name === 'TokenExpiredError')  return res.status(401).json({ success: false, error: 'Token expired' });
    return res.status(500).json({ success: false, error: 'Authentication error' });
  }
};

// requireAdmin — use after requireAuth, checks if user is admin
export const requireAdmin = (req, res, next) => {
  if (!req.user?.is_admin)
    return res.status(403).json({ success: false, error: 'Admin privileges required' });
  next();
};
