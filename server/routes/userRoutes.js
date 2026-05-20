// userRoutes.js — maps URLs to user controller functions
import express from 'express';
import * as userController from '../controllers/userController.js';
import { requireAuth } from '../middlewares/auth.js';
import { uploadAvatar } from '../config/cloudinary.js';

const router = express.Router();

router.get('/:id',                userController.getProfile);                              // public
router.put('/:id',                requireAuth, userController.updateProfile);              // protected
router.post('/:id/avatar',        requireAuth, uploadAvatar.single('avatar'), userController.uploadAvatar); // upload profile pic
router.get('/:id/bookings',       requireAuth, userController.getBookings);                // protected

export default router;
