/**
 * app.js — Main Application Entry Point (MVC Architecture)
 * ─────────────────────────────────────────────────────────────────────────────
 * Eventix Backend - MVC Structure with Firebase Authentication
 */

import express from 'express';
import { createServer } from 'http';
import { Server as IO } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Third-party middleware
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';

// Configuration
import './config/firebase.config.js';
import { configurePassport } from './middleware/passport.middleware.js';
import { apiLimiter } from './middleware/rateLimiter.middleware.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

// Routes
import routes from './routes/index.js';

// Socket.io & Utilities
import { initializeSocketIO, pushAdminStats } from './controllers/socket.controller.js';
import { startCleanupJob } from './utils/cleanupJob.js';

dotenv.config();

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'eventix_session_dev_secret';
const __dirname = dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────────────────────
// EXPRESS + HTTP SERVER + SOCKET.IO
// ─────────────────────────────────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);
const io = new IO(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PASSPORT CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
configurePassport();

// ─────────────────────────────────────────────────────────────────────────────
// APPLICATION-LEVEL MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use(compression());
app.use(morgan('dev'));
app.use('/api', apiLimiter);
app.use(cookieParser(SESSION_SECRET));

// Body parser
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Session management
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
  },
}));

app.use(passport.initialize());
app.use(passport.session());

// Custom request metadata
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  req.requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// STATIC FILES
// ─────────────────────────────────────────────────────────────────────────────
app.use(express.static(join(__dirname, '../../client')));

// ─────────────────────────────────────────────────────────────────────────────
// MAKE IO AND PUSH STATS AVAILABLE TO CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────
app.set('io', io);
app.set('pushAdminStats', () => pushAdminStats(io));

// ─────────────────────────────────────────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─────────────────────────────────────────────────────────────────────────────
// ERROR HANDLING
// ─────────────────────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─────────────────────────────────────────────────────────────────────────────
// SOCKET.IO INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────
initializeSocketIO(io);

// ─────────────────────────────────────────────────────────────────────────────
// START CLEANUP JOB
// ─────────────────────────────────────────────────────────────────────────────
startCleanupJob(io);

// ─────────────────────────────────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`\n  🚀  Eventix server (MVC)  →  http://localhost:${PORT}`);
  console.log(`  🔌  Socket.io             →  ws://localhost:${PORT}`);
  console.log(`  📦  Client                →  http://localhost:${PORT}/home.html`);
  console.log(`  🔥  Firebase Auth         →  Enabled\n`);
});
