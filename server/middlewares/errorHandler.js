export const notFound = (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    const error = new Error(`Not found: ${req.method} ${req.originalUrl}`);
    error.status = 404;
    return next(error);
  }
  res.status(404).send('Not found');
};

export const errorHandler = (err, req, res, next) => {
  const status  = err.status || 500;
  const message = err.message || 'Internal Server Error';
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${req.requestId || 'N/A'}] ❌ ${status} ${message}`);
  }
  res.status(status).json({ success: false, error: message });
};
