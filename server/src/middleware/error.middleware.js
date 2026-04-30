/**
 * error.middleware.js — Error Handling Middleware
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req, res, next) {
  const err = new Error(`Not found: ${req.method} ${req.originalUrl}`);
  err.status = 404;
  next(err);
}

/**
 * Global error handler
 */
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${req.requestId || 'unknown'}] ❌ ${status} ${message}`);
    if (err.stack) console.error(err.stack);
  }

  res.status(status).json({
    success: false,
    error: message,
  });
}
