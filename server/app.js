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

dotenv.config();

if (typeof globalThis.crypto === 'undefined') globalThis.crypto = crypto;

import { connectDB } from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import * as eventService from './services/eventService.js';

const PORT       = process.env.PORT || 10000;
const NODE_ENV   = process.env.NODE_ENV || 'development';
const __dirname  = dirname(fileURLToPath(import.meta.url));

const app        = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);

const io = new SocketIO(httpServer, {
  transports: ['websocket', 'polling'],
  cors: { origin: '*', methods: ['GET', 'POST'], credentials: true }
});
app.set('io', io);

try {
  await connectDB();
} catch (err) {
  console.error('Database connection failed:', err.message);
  process.exit(1);
}

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: '*', credentials: false, methods: ['GET','POST','PUT','DELETE','OPTIONS'] }));
app.use(compression());
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cookieParser());
app.use('/api', apiLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  req.requestId   = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  next();
});

app.use(express.static(join(__dirname, 'public')));
app.use(express.static(join(__dirname, 'public/css')));
app.use(express.static(join(__dirname, 'public/js')));
app.use(express.static(join(__dirname, 'public/images')));
app.use(express.static(join(__dirname, 'views')));

app.get('/',            (req, res) => res.sendFile(join(__dirname, 'views', 'home.html')));
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/ping',        (req, res) => res.send('pong'));
app.get('/api/health',  (req, res) => res.json({ status: 'ok', environment: NODE_ENV, timestamp: new Date().toISOString() }));
app.get('/dashboard',   (req, res) => res.redirect('/bookings.html'));

app.use('/api/auth',   authRoutes);
app.use('/api/users',  userRoutes);
app.use('/api/events', eventRoutes);

app.post('/api/users/register', (req, res, next) => { req.url = '/register'; authRoutes(req, res, next); });
app.post('/api/users/login',    (req, res, next) => { req.url = '/login';    authRoutes(req, res, next); });

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  socket.on('join:event',  (id) => { socket.join(`event:${id}`); });
  socket.on('leave:event', (id) => socket.leave(`event:${id}`));
  socket.on('join:admin',  ()   => socket.join('admin'));
  socket.on('disconnect',  (r)  => console.log(`🔌 Socket disconnected: ${socket.id} (${r})`));
});

setInterval(async () => {
  try {
    const { count, released } = await eventService.cleanupExpiredReservations();
    if (count === 0) return;
    Object.entries(released).forEach(([eventId, seats]) =>
      io.to(`event:${eventId}`).emit('seats:released', { eventId, seats })
    );
    console.log(`🧹 Cleaned ${count} expired reservations`);
  } catch (err) {
    console.error('Cleanup job error:', err.message);
  }
}, 60 * 1000);

app.use(notFound);
app.use(errorHandler);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 EVENTIX running on port ${PORT} [${NODE_ENV}]\n`);
});

export default app;
