import express from 'express';
import * as userController from '../controllers/userController.js';
import { requireAuth } from '../middlewares/auth.js';
import { uploadAvatar } from '../config/cloudinary.js';

const router = express.Router();

router.get('/:id',          userController.getProfile);
router.put('/:id',          requireAuth, userController.updateProfile);
router.post('/:id/avatar',  requireAuth, uploadAvatar.single('avatar'), userController.uploadAvatar);
router.get('/:id/bookings', requireAuth, userController.getBookings);

export default router;
