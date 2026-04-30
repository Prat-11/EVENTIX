/**
 * User Routes
 * Maps URLs to user controller functions
 */
import express from 'express';
import * as userController from '../controllers/userController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// All user routes require authentication
router.get('/:id', userController.getProfile);
router.put('/:id', requireAuth, userController.updateProfile);
router.get('/:id/bookings', requireAuth, userController.getBookings);

export default router;
