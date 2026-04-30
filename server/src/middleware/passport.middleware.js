/**
 * passport.middleware.js — Passport Configuration
 * ─────────────────────────────────────────────────────────────────────────────
 */

import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcryptjs';
import UserModel from '../models/User.model.js';

const JWT_SECRET = process.env.JWT_SECRET || 'eventix_jwt_dev_secret';

/**
 * Configure Passport strategies
 */
export function configurePassport() {
  // LocalStrategy — email + password
  passport.use(
    new LocalStrategy(
      { usernameField: 'email', passwordField: 'password' },
      async (email, password, done) => {
        try {
          const user = await UserModel.findByEmail(email);
          
          if (!user) {
            return done(null, false, { message: 'Invalid credentials' });
          }

          if (user.blocked) {
            return done(null, false, { message: 'Account blocked' });
          }

          const match = await bcrypt.compare(password, user.password);
          if (!match) {
            return done(null, false, { message: 'Invalid credentials' });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // JwtStrategy — Bearer token
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: JWT_SECRET,
      },
      async (payload, done) => {
        try {
          const user = await UserModel.findById(payload.id);
          
          if (!user) {
            return done(null, false);
          }

          if (user.blocked) {
            return done(null, false);
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Session serialization
  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await UserModel.findById(id);
      if (!user) return done(null, false);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}
