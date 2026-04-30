/**
 * Event Routes
 * Maps URLs to event controller functions
 */
import express from 'express';
import * as eventController from '../controllers/eventController.js';
import { requireAuth } from '../middlewares/auth.js';
import { enrollLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Public routes
router.get('/', eventController.getAllEvents);
router.get('/:id/reservations', eventController.getReservations);

// Protected routes
router.post('/', requireAuth, eventController.createEvent);
router.post('/:id/reserve', requireAuth, eventController.reserveSeats);
router.delete('/:id/reserve', requireAuth, eventController.clearReservation);
router.post('/:id/enroll', requireAuth, enrollLimiter, eventController.enrollInEvent);
router.delete('/:id', requireAuth, eventController.deleteEvent);

export default router;
