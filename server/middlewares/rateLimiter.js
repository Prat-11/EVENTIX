/**
 * Rate Limiter Middleware
 * Prevents abuse by limiting requests
 */
import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 */
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

/**
 * Auth endpoints rate limiter (stricter)
 */
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

/**
 * Enrollment rate limiter
 */
export const enrollLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 enrollments per minute
  message: { 
    success: false, 
    error: 'Enrollment rate limit exceeded' 
  }
});
