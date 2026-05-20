// eventRoutes.js — maps URLs to event controller functions
import express from 'express';
import * as eventController from '../controllers/eventController.js';
import { requireAuth } from '../middlewares/auth.js';
import { enrollLimiter } from '../middlewares/rateLimiter.js';
import { uploadEventImage } from '../config/cloudinary.js';

const router = express.Router();

// public
router.get('/',                   eventController.getAllEvents);
router.get('/:id/reservations',   eventController.getReservations);

// protected — uploadEventImage.single('image') handles optional image upload
router.post('/',                  requireAuth, uploadEventImage.single('image'), eventController.createEvent);
router.post('/:id/reserve',       requireAuth, eventController.reserveSeats);
router.delete('/:id/reserve',     requireAuth, eventController.clearReservation);
router.post('/:id/enroll',        requireAuth, enrollLimiter, eventController.enrollInEvent);
router.delete('/:id',             requireAuth, eventController.deleteEvent);

export default router;
