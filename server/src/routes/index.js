/**
 * index.js — Route Index
 * ─────────────────────────────────────────────────────────────────────────────
 * Aggregates all routes
 */

import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import eventRoutes from './event.routes.js';
import adminRoutes from './admin.routes.js';
import { firebaseClientConfig } from '../config/firebase.config.js';

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/admin', adminRoutes);

// Firebase config endpoint for client
router.get('/config/firebase', (req, res) => {
  res.json({ success: true, data: firebaseClientConfig });
});

// Legacy routes (backward compatibility)
router.post('/users/register', (req, res, next) => {
  req.url = '/auth/register';
  authRoutes(req, res, next);
});

router.post('/users/login', (req, res, next) => {
  req.url = '/auth/login';
  authRoutes(req, res, next);
});

export default router;
