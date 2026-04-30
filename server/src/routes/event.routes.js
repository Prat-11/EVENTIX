/**
 * event.routes.js — Event Routes
 * ─────────────────────────────────────────────────────────────────────────────
 */

import express from 'express';
import EventController from '../controllers/event.controller.js';
import { requireAuth, asyncHandler } from '../middleware/auth.middleware.js';
import { enrollLimiter } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

// GET /api/events
router.get('/', asyncHandler(EventController.getAllEvents));

// POST /api/events
router.post('/', requireAuth, asyncHandler(EventController.createEvent));

// GET /api/events/:id/reservations
router.get('/:id/reservations', asyncHandler(EventController.getReservations));

// POST /api/events/:id/reserve
router.post('/:id/reserve', requireAuth, asyncHandler(EventController.reserveSeats));

// DELETE /api/events/:id/reserve
router.delete('/:id/reserve', requireAuth, asyncHandler(EventController.clearReservation));

// POST /api/events/:id/enroll
router.post('/:id/enroll', requireAuth, enrollLimiter, asyncHandler(EventController.enrollInEvent));

// DELETE /api/events/:id
router.delete('/:id', requireAuth, asyncHandler(EventController.deleteEvent));

export default router;
