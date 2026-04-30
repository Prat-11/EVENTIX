/**
 * auth.routes.js — Authentication Routes
 * ─────────────────────────────────────────────────────────────────────────────
 */

import express from 'express';
import AuthController from '../controllers/auth.controller.js';
import { requireAuth, asyncHandler } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', authLimiter, asyncHandler(AuthController.register));

// POST /api/auth/login
router.post('/login', authLimiter, asyncHandler(AuthController.login));

// POST /api/auth/logout
router.post('/logout', AuthController.logout);

// GET /api/auth/me
router.get('/me', requireAuth, AuthController.getMe);

export default router;
