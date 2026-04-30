/**
 * auth.controller.js — Authentication Controller
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles user registration, login, logout, and Firebase Auth integration
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserModel from '../models/User.model.js';
import { auth } from '../config/firebase.config.js';

const JWT_SECRET = process.env.JWT_SECRET || 'eventix_jwt_dev_secret';

class AuthController {
  /**
   * Register new user (with optional Firebase Auth)
   */
  static async register(req, res, next) {
    try {
      const { name, email, password, firebaseIdToken } = req.body;

      // Validation
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'All fields required',
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password min 6 chars',
        });
      }

      // Check if user already exists
      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Email already registered',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Verify Firebase ID token if provided
      let firebaseUid = null;
      if (firebaseIdToken) {
        try {
          const decodedToken = await auth.verifyIdToken(firebaseIdToken);
          firebaseUid = decodedToken.uid;
        } catch (err) {
          console.error('Firebase token verification failed:', err.message);
        }
      }

      // Create user
      const newUser = await UserModel.create({
        name,
        email,
        password: hashedPassword,
        firebaseUid,
      });

      // Generate JWT
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          avatar: newUser.avatar,
          isAdmin: newUser.isAdmin,
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user (supports both email/password and Firebase Auth)
   */
  static async login(req, res, next) {
    try {
      const { email, password, firebaseIdToken } = req.body;

      // Firebase Auth login
      if (firebaseIdToken) {
        try {
          const decodedToken = await auth.verifyIdToken(firebaseIdToken);
          let user = await UserModel.findByFirebaseUid(decodedToken.uid);

          // If user doesn't exist, create one
          if (!user) {
            const hashedPassword = await bcrypt.hash(Math.random().toString(36), 12);
            user = await UserModel.create({
              name: decodedToken.name || decodedToken.email.split('@')[0],
              email: decodedToken.email,
              password: hashedPassword,
              firebaseUid: decodedToken.uid,
            });
          }

          if (user.blocked) {
            return res.status(403).json({
              success: false,
              error: 'Account blocked',
            });
          }

          const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
          );

          // Set session
          req.logIn(user, (err) => {
            if (err) return next(err);

            res.cookie('eventix_uid', user.id, {
              signed: true,
              httpOnly: true,
              sameSite: 'lax',
              maxAge: 7 * 24 * 60 * 60 * 1000,
              secure: process.env.NODE_ENV === 'production',
            });

            res.json({
              success: true,
              data: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                isAdmin: user.isAdmin || false,
                token,
              },
            });
          });

          return;
        } catch (err) {
          return res.status(401).json({
            success: false,
            error: 'Invalid Firebase token',
          });
        }
      }

      // Traditional email/password login
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password required',
        });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }

      if (user.blocked) {
        return res.status(403).json({
          success: false,
          error: 'Account blocked',
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Set session
      req.logIn(user, (err) => {
        if (err) return next(err);

        res.cookie('eventix_uid', user.id, {
          signed: true,
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
          secure: process.env.NODE_ENV === 'production',
        });

        res.json({
          success: true,
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            isAdmin: user.isAdmin || false,
            token,
          },
        });
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   */
  static logout(req, res, next) {
    req.logout((err) => {
      if (err) return next(err);
      
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.clearCookie('eventix_uid');
        res.json({ success: true, message: 'Logged out' });
      });
    });
  }

  /**
   * Get current user
   */
  static getMe(req, res) {
    const { id, name, email, avatar, isAdmin } = req.user;
    res.json({
      success: true,
      data: { id, name, email, avatar, isAdmin },
    });
  }
}

export default AuthController;
