// errorHandler.js — catches errors and sends proper responses

// notFound — only triggers for /api/* routes, not static files
export const notFound = (req, res, next) => {
  // only handle API routes — let static files 404 naturally
  if (req.originalUrl.startsWith('/api')) {
    const error = new Error(`Not found: ${req.method} ${req.originalUrl}`);
    error.status = 404;
    return next(error);
  }
  // for non-API routes (like missing .js/.css files), just 404 without JSON
  res.status(404).send('Not found');
};

// errorHandler — catches all errors passed via next(err)
export const errorHandler = (err, req, res, next) => {
  const status  = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // log in dev only
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${req.requestId || 'N/A'}] ❌ ${status} ${message}`);
  }

  res.status(status).json({
    success: false,
    error: message
  });
};
