/**
 * admin.routes.js — Admin Routes
 * ─────────────────────────────────────────────────────────────────────────────
 */

import express from 'express';
import AdminController from '../controllers/admin.controller.js';
import { requireAuth, requireAdmin, asyncHandler } from '../middleware/auth.middleware.js';

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(requireAuth, requireAdmin);

// GET /api/admin/users
router.get('/users', asyncHandler(AdminController.getAllUsers));

// GET /api/admin/events
router.get('/events', asyncHandler(AdminController.getAllEvents));

// PUT /api/admin/users/:id/block
router.put('/users/:id/block', asyncHandler(AdminController.blockUser));

// PUT /api/admin/users/:id/unblock
router.put('/users/:id/unblock', asyncHandler(AdminController.unblockUser));

// DELETE /api/admin/users/:id
router.delete('/users/:id', asyncHandler(AdminController.deleteUser));

// POST /api/admin/make-admin
router.post('/make-admin', asyncHandler(AdminController.makeAdmin));

export default router;
