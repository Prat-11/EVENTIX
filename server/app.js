
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

// Import configurations
import connectDB from './config/database.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';

// Import middlewares
import { apiLimiter } from './middlewares/rateLimiter.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';

// Import models for cleanup job
import Reservation from './models/Reservation.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new SocketIO(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store io instance in app for access in controllers
app.set('io', io);

// Connect to MongoDB
connectDB();

// ============================================================================
// MIDDLEWARES
// ============================================================================

// Security
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Disable caching for development (prevents CSP caching issues)
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// CORS
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Compression
app.use(compression());

// Logging
app.use(morgan('dev'));

// Rate limiting for API routes
app.use('/api', apiLimiter);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Cookie parsing
app.use(cookieParser(process.env.SESSION_SECRET));

// Request ID and timestamp
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  req.requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  next();
});

// ============================================================================
// STATIC FILES (Views)
// ============================================================================

// Serve CSS and JS files from public folder
app.use(express.static(join(__dirname, 'public/css')));
app.use(express.static(join(__dirname, 'public/js')));
app.use(express.static(join(__dirname, 'public/images')));

// Serve HTML views from views folder
app.use(express.static(join(__dirname, 'views')));

// Serve all public assets
app.use(express.static(join(__dirname, 'public')));

// ============================================================================
// API ROUTES
// ============================================================================

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);

// Legacy route redirects for backward compatibility
app.post('/api/users/register', (req, res, next) => {
  req.url = '/api/auth/register';
  authRoutes(req, res, next);
});

app.post('/api/users/login', (req, res, next) => {
  req.url = '/api/auth/login';
  authRoutes(req, res, next);
});

// ============================================================================
// SOCKET.IO
// ============================================================================

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Join event room
  socket.on('join:event', (eventId) => {
    socket.join(`event:${eventId}`);
    console.log(`Socket ${socket.id} joined event:${eventId}`);
  });

  // Leave event room
  socket.on('leave:event', (eventId) => {
    socket.leave(`event:${eventId}`);
    console.log(`Socket ${socket.id} left event:${eventId}`);
  });

  // Join admin room
  socket.on('join:admin', () => {
    socket.join('admin');
    console.log(`Socket ${socket.id} joined admin room`);
  });

  // Disconnect
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
  });
});

// ============================================================================
// CLEANUP JOB
// ============================================================================

// Clean up expired reservations every minute
setInterval(async () => {
  try {
    const now = new Date();
    const expired = await Reservation.find({ expiresAt: { $lte: now } });

    if (expired.length === 0) return;

    const released = {};
    expired.forEach(r => {
      const eventId = r.eventId.toString();
      if (!released[eventId]) released[eventId] = [];
      released[eventId].push(...r.seats);
    });

    await Reservation.deleteMany({ expiresAt: { $lte: now } });

    // Emit socket events
    Object.entries(released).forEach(([eventId, seats]) => {
      io.to(`event:${eventId}`).emit('seats:released', { eventId, seats });
    });

    console.log(`🧹 Cleaned up ${expired.length} expired reservations`);
  } catch (error) {
    console.error('Cleanup job error:', error.message);
  }
}, 60 * 1000);

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use(notFound);
app.use(errorHandler);

// ============================================================================
// START SERVER
// ============================================================================

httpServer.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    EVENTIX SERVER                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`  🚀  Server running      →  http://localhost:${PORT}`);
  console.log(`  🔌  Socket.IO           →  ws://localhost:${PORT}`);
  console.log(`  📦  Client              →  http://localhost:${PORT}/home.html`);
  console.log(`  🗄️   Database            →  MongoDB`);
  console.log('\n  📁  MVC Architecture:');
  console.log('      Models              →  /models');
  console.log('      Views               →  /public + /client');
  console.log('      Controllers         →  /controllers');
  console.log('      Routes              →  /routes');
  console.log('      Middlewares         →  /middlewares');
  console.log('      Config              →  /config\n');
});

export default app;
