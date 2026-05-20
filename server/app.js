// main app file (server)

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Make crypto globally available
if (typeof globalThis.crypto === 'undefined') {
  global.crypto = crypto;
}

// Config
import { connectDB } from './config/database.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';

// Middlewares
import { apiLimiter } from './middlewares/rateLimiter.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';

// Services
import * as eventService from './services/eventService.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize express
const app = express();
const httpServer = createServer(app);

// ==============================
// SOCKET.IO
// ==============================

const io = new SocketIO(httpServer, {
  transports: ['websocket', 'polling'],

  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.set('io', io);

// ==============================
// DATABASE
// ==============================

await connectDB();

// ==============================
// SECURITY
// ==============================

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// Disable caching in development
app.use((req, res, next) => {
  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  );

  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  next();
});

// ==============================
// CORS
// ==============================

app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  })
);

// ==============================
// MIDDLEWARES
// ==============================

app.use(compression());

app.use(
  morgan(NODE_ENV === 'production' ? 'combined' : 'dev')
);

// Rate limiter
app.use('/api', apiLimiter);

// IMPORTANT:
// DO NOT USE express-fileupload
// multer handles uploads separately

// JSON parsing
app.use(
  express.json({
    limit: '10mb'
  })
);

// URL encoded parsing
app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb'
  })
);

// Cookies
app.use(cookieParser(process.env.SESSION_SECRET));

// Request metadata
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();

  req.requestId = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  next();
});

// ==============================
// STATIC FILES
// ==============================

app.use(express.static(join(__dirname, 'public/css')));
app.use(express.static(join(__dirname, 'public/js')));
app.use(express.static(join(__dirname, 'public/images')));

app.use(express.static(join(__dirname, 'views')));

app.use(express.static(join(__dirname, 'public')));

// ==============================
// ROUTES
// ==============================

// Home
app.get('/', (req, res) => {
  res.redirect('/home.html');
});

// Dashboard
app.get('/dashboard', (req, res) => {
  res.redirect('/bookings.html');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    database: 'PostgreSQL'
  });
});

// ==============================
// LEGACY ROUTES
// ==============================

app.post('/api/users/register', (req, res, next) => {
  req.url = '/api/auth/register';
  authRoutes(req, res, next);
});

app.post('/api/users/login', (req, res, next) => {
  req.url = '/api/auth/login';
  authRoutes(req, res, next);
});

// ==============================
// SOCKET EVENTS
// ==============================

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Join event room
  socket.on('join:event', (eventId) => {
    socket.join(`event:${eventId}`);

    console.log(
      `Socket ${socket.id} joined event:${eventId}`
    );
  });

  // Leave event room
  socket.on('leave:event', (eventId) => {
    socket.leave(`event:${eventId}`);

    console.log(
      `Socket ${socket.id} left event:${eventId}`
    );
  });

  // Admin room
  socket.on('join:admin', () => {
    socket.join('admin');

    console.log(
      `Socket ${socket.id} joined admin room`
    );
  });

  // Disconnect
  socket.on('disconnect', (reason) => {
    console.log(
      `🔌 Socket disconnected: ${socket.id} (${reason})`
    );
  });
});

// ==============================
// CLEANUP JOB
// ==============================

setInterval(async () => {
  try {
    const { count, released } =
      await eventService.cleanupExpiredReservations();

    if (count === 0) return;

    // Emit updates
    Object.entries(released).forEach(
      ([eventId, seats]) => {
        io.to(`event:${eventId}`).emit(
          'seats:released',
          {
            eventId,
            seats
          }
        );
      }
    );

    console.log(
      `🧹 Cleaned up ${count} expired reservations`
    );
  } catch (error) {
    console.error(
      'Cleanup job error:',
      error.message
    );
  }
}, 60 * 1000);

// ==============================
// ERROR HANDLING
// ==============================

app.use(notFound);
app.use(errorHandler);

// ==============================
// START SERVER
// ==============================

httpServer.listen(PORT, () => {
  console.log('\n═══════════════════════════════');
  console.log('🚀 EVENTIX SERVER STARTED');
  console.log('═══════════════════════════════\n');

  console.log(
    `🌐 Server      → http://localhost:${PORT}`
  );

  console.log(
    `🔌 Socket.IO   → ws://localhost:${PORT}`
  );

  console.log(
    `📦 Environment → ${NODE_ENV}`
  );

  console.log('\n✅ Ready\n');
});

export default app;