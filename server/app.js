// ==============================
// EVENTIX MAIN SERVER
// app.js
// ==============================

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

// ==============================
// LOAD ENV
// ==============================

dotenv.config();

// ==============================
// GLOBAL CRYPTO FIX
// ==============================

if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = crypto;
}

// ==============================
// IMPORTS
// ==============================

import { connectDB } from './config/database.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';

// Middlewares
import { apiLimiter } from './middlewares/rateLimiter.js';

import {
  notFound,
  errorHandler
} from './middlewares/errorHandler.js';

// Services
import * as eventService from './services/eventService.js';

// ==============================
// CONFIG
// ==============================

const PORT = process.env.PORT || 10000;

const NODE_ENV =
  process.env.NODE_ENV || 'development';

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  'http://localhost:5173';

const __dirname = dirname(
  fileURLToPath(import.meta.url)
);

// ==============================
// EXPRESS APP
// ==============================

const app = express();

app.set('trust proxy', 1);

const httpServer = createServer(app);

// ==============================
// ALLOWED ORIGINS
// ==============================

const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:5173'
];

// ==============================
// SOCKET.IO
// ==============================

const io = new SocketIO(httpServer, {
  transports: ['websocket', 'polling'],

  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.set('io', io);

// ==============================
// DATABASE CONNECTION
// ==============================

try {
  await connectDB();

  console.log('✅ Database connected');
} catch (error) {
  console.error(
    '❌ Database connection failed:',
    error.message
  );

  process.exit(1);
}

// ==============================
// SECURITY
// ==============================

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// ==============================
// CORS
// ==============================

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(
          new Error(
            `CORS blocked for origin: ${origin}`
          )
        );
      }
    },

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'PATCH',
      'OPTIONS'
    ]
  })
);

// ==============================
// MIDDLEWARES
// ==============================

app.use(compression());

app.use(
  morgan(
    NODE_ENV === 'production'
      ? 'combined'
      : 'dev'
  )
);

app.use(cookieParser());

app.use('/api', apiLimiter);

app.use(
  express.json({
    limit: '10mb'
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb'
  })
);

// ==============================
// REQUEST INFO
// ==============================

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

app.use(
  express.static(join(__dirname, 'public'))
);

app.use(
  express.static(join(__dirname, 'views'))
);

// ==============================
// ROUTES
// ==============================

// Root
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'EVENTIX Backend Running 🚀'
  });
});

// Ping
app.get('/ping', (req, res) => {
  res.send('pong');
});

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Dashboard Redirect
app.get('/dashboard', (req, res) => {
  res.redirect('/bookings.html');
});

// ==============================
// API ROUTES
// ==============================

app.use('/api/auth', authRoutes);

app.use('/api/users', userRoutes);

app.use('/api/events', eventRoutes);

// ==============================
// LEGACY ROUTES
// ==============================

app.post(
  '/api/users/register',
  (req, res, next) => {
    req.url = '/register';

    authRoutes(req, res, next);
  }
);

app.post(
  '/api/users/login',
  (req, res, next) => {
    req.url = '/login';

    authRoutes(req, res, next);
  }
);

// ==============================
// SOCKET EVENTS
// ==============================

io.on('connection', (socket) => {
  console.log(
    `🔌 Socket connected: ${socket.id}`
  );

  // Join Event Room
  socket.on('join:event', (eventId) => {
    socket.join(`event:${eventId}`);

    console.log(
      `Socket ${socket.id} joined event:${eventId}`
    );
  });

  // Leave Event Room
  socket.on('leave:event', (eventId) => {
    socket.leave(`event:${eventId}`);

    console.log(
      `Socket ${socket.id} left event:${eventId}`
    );
  });

  // Admin Room
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
      `🧹 Cleaned ${count} expired reservations`
    );
  } catch (error) {
    console.error(
      '❌ Cleanup job error:',
      error.message
    );
  }
}, 60 * 1000);

// ==============================
// ERROR HANDLERS
// ==============================

app.use(notFound);

app.use(errorHandler);

// ==============================
// START SERVER
// ==============================

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('\n============================');
  console.log('🚀 EVENTIX SERVER STARTED');
  console.log('============================\n');

  console.log(
    `🌐 Server Running On Port ${PORT}`
  );

  console.log(
    `📦 Environment: ${NODE_ENV}`
  );

  console.log(
    `🔗 Frontend URL: ${FRONTEND_URL}`
  );

  console.log('\n✅ Backend Ready\n');
});

// ==============================
// EXPORT
// ==============================

export default app;