import rateLimit from 'express-rate-limit';


export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    error: 'Too many requests, please slow down' 
  }
});


export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    error: 'Too many login attempts, try again later' 
  }
});


export const enrollLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 enrollments per minute
  message: { 
    success: false, 
    error: 'Enrollment rate limit exceeded' 
  }
});
