/**
 * auth.middleware.js — Authentication Middleware
 * ─────────────────────────────────────────────────────────────────────────────
 */

import passport from 'passport';

/**
 * Require JWT authentication
 */
export function requireAuth(req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) return next(err);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: info?.message || 'Unauthorised',
      });
    }

    req.user = user;
    next();
  })(req, res, next);
}

/**
 * Require admin privileges
 */
export function requireAdmin(req, res, next) {
  if (req.user?.isAdmin) {
    return next();
  }

  res.status(403).json({
    success: false,
    error: 'Admin privileges required',
  });
}

/**
 * Async handler wrapper
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
