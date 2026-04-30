/**
 * user.routes.js — User Routes
 * ─────────────────────────────────────────────────────────────────────────────
 */

import express from 'express';
import UserController from '../controllers/user.controller.js';
import { requireAuth, asyncHandler } from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/users/:id
router.get('/:id', asyncHandler(UserController.getUser));

// PUT /api/users/:id
router.put('/:id', requireAuth, asyncHandler(UserController.updateUser));

// GET /api/users/:id/bookings
router.get('/:id/bookings', requireAuth, asyncHandler(UserController.getUserBookings));

export default router;
