import express from 'express';
import * as authController from '../controllers/authController.js';
import { requireAuth } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, authController.register);
router.post('/login',    authLimiter, authController.login);
router.get('/me',        requireAuth,  authController.me);
router.post('/logout',   requireAuth,  authController.logout);

export default router;
