/**
 * server.js — Eventix · Single-file backend
 * ─────────────────────────────────────────────────────────────────────────────
 * Everything lives here:
 *   • Firebase / Firestore (only DB)
 *   • Middleware lifecycle  (application-level, router-level, error-handling,
 *                            third-party)
 *   • Body-parser  (express.json / urlencoded — non-blocking stream)
 *   • Bcrypt       (password hashing — runs in libuv thread pool, non-blocking)
 *   • JWT          (stateless API auth)
 *   • express-session + cookie-parser  (session management & cookies)
 *   • Passport.js  (LocalStrategy + JwtStrategy)
 *   • Socket.io    (full-duplex real-time — live seat counts, live dashboard)
 *   • EJS          (SSR template engine — /ssr/* routes)
 *   • Morgan       (HTTP logger — third-party middleware)
 *   • Helmet       (security headers — third-party middleware)
 *   • Compression  (gzip — third-party middleware)
 *   • Rate-limiter (express-rate-limit — third-party middleware)
 *
 * HOW A REQUEST TRAVELS THROUGH EXPRESS
 * ──────────────────────────────────────
 * Client → helmet → cors → compression → morgan → rateLimiter
 *        → cookieParser → bodyParser → session → passport.init
 *        → passport.session → requestMeta → [Router] → errorHandler
 *
 * BLOCKING vs NON-BLOCKING
 * ─────────────────────────
 * Blocking  : initFirebase() — runs once at startup, before listen()
 * Non-blocking: every Firestore call returns a Promise; bcrypt uses libuv
 *               thread pool; socket.io shares the event loop
 */

import express          from 'express';
import { createServer } from 'http';
import { Server as IO } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync }  from 'fs';

// ── Third-party middleware ────────────────────────────────────────────────────
import cors         from 'cors';
import helmet       from 'helmet';
import compression  from 'compression';
import morgan       from 'morgan';
import rateLimit    from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import session      from 'express-session';
import passport     from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt       from 'bcryptjs';
import jwt          from 'jsonwebtoken';
import admin        from 'firebase-admin';
import dotenv       from 'dotenv';

dotenv.config();

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const PORT           = process.env.PORT           || 3000;
const JWT_SECRET     = process.env.JWT_SECRET     || 'eventix_jwt_dev_secret';
const SESSION_SECRET = process.env.SESSION_SECRET || 'eventix_session_dev_secret';
const __dirname      = dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE INIT  (synchronous — runs once before listen())
// ─────────────────────────────────────────────────────────────────────────────
const serviceAccount = JSON.parse(readFileSync('./fireb-sdk.json', 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
console.log('✅  Firebase / Firestore connected');

// ─────────────────────────────────────────────────────────────────────────────
// EXPRESS + HTTP SERVER + SOCKET.IO
// ─────────────────────────────────────────────────────────────────────────────
const app        = express();
const httpServer = createServer(app);
const io         = new IO(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'], credentials: true },
});

// ─────────────────────────────────────────────────────────────────────────────
// PASSPORT STRATEGIES
// ─────────────────────────────────────────────────────────────────────────────

// LocalStrategy — email + bcrypt check against Firestore
passport.use(new LocalStrategy(
  { usernameField: 'email', passwordField: 'password' },
  async (email, password, done) => {
    try {
      const snap = await db.collection('users').where('email', '==', email).get();
      if (snap.empty) return done(null, false, { message: 'Invalid credentials' });

      const doc  = snap.docs[0];
      const user = { id: doc.id, ...doc.data() };

      if (user.blocked) return done(null, false, { message: 'Account blocked' });

      // bcrypt.compare is non-blocking — libuv thread pool
      const match = await bcrypt.compare(password, user.password);
      if (!match) return done(null, false, { message: 'Invalid credentials' });

      return done(null, user);
    } catch (err) { return done(err); }
  }
));

// JwtStrategy — Bearer token for stateless API calls
passport.use(new JwtStrategy(
  { jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), secretOrKey: JWT_SECRET },
  async (payload, done) => {
    try {
      const doc = await db.collection('users').doc(payload.id).get();
      if (!doc.exists) return done(null, false);
      const user = { id: doc.id, ...doc.data() };
      if (user.blocked) return done(null, false);
      return done(null, user);
    } catch (err) { return done(err); }
  }
));

// Session serialisation — only store user id in cookie
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const doc = await db.collection('users').doc(id).get();
    if (!doc.exists) return done(null, false);
    done(null, { id: doc.id, ...doc.data() });
  } catch (err) { done(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// RATE LIMITERS  (third-party middleware — express-rate-limit)
// ─────────────────────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: 'Too many requests, slow down.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts.' },
});
const enrollLimiter = rateLimit({
  windowMs: 60 * 1000, max: 5,
  message: { success: false, error: 'Enrollment rate limit hit.' },
});

// ─────────────────────────────────────────────────────────────────────────────
// APPLICATION-LEVEL MIDDLEWARE  (runs for every request)
// ─────────────────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: '*', credentials: true, methods: ['GET','POST','PUT','DELETE','OPTIONS'] }));
app.use(compression());                                    // gzip — non-blocking stream
app.use(morgan('dev'));                                     // HTTP logger
app.use('/api', apiLimiter);                               // global API rate limit
app.use(cookieParser(SESSION_SECRET));                     // parse cookies

// Body-parser — reads request stream asynchronously (non-blocking)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Session management — server-side; only signed session ID in cookie
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,   // XSS protection
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
  },
}));

app.use(passport.initialize());
app.use(passport.session());

// Custom application-level middleware — stamp every request
app.use((req, _res, next) => {
  req.requestTime = new Date().toISOString();
  req.requestId   = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// EJS TEMPLATE ENGINE  (SSR)
// ─────────────────────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

// ─────────────────────────────────────────────────────────────────────────────
// STATIC FILES  (CSR client)
// ─────────────────────────────────────────────────────────────────────────────
app.use(express.static(join(__dirname, '..', 'client')));

// ─────────────────────────────────────────────────────────────────────────────
// AUTH GUARD HELPERS  (router-level middleware — used inline on routes)
// ─────────────────────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err)   return next(err);
    if (!user) return res.status(401).json({ success: false, error: info?.message || 'Unauthorised' });
    req.user = user;
    next();
  })(req, res, next);
}

function requireAdmin(req, res, next) {
  if (req.user?.isAdmin) return next();
  res.status(403).json({ success: false, error: 'Admin privileges required' });
}

// asyncHandler — wraps async routes so rejected promises hit the error handler
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// ─────────────────────────────────────────────────────────────────────────────
// ── AUTH ROUTES  (router-level: authLimiter applied here only)
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/auth/register
app.post('/api/auth/register', authLimiter, asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ success: false, error: 'All fields required' });
  if (password.length < 6)
    return res.status(400).json({ success: false, error: 'Password min 6 chars' });

  const existing = await db.collection('users').where('email', '==', email).get();
  if (!existing.empty)
    return res.status(400).json({ success: false, error: 'Email already registered' });

  // bcrypt hash — non-blocking (libuv thread pool)
  const hashed = await bcrypt.hash(password, 12);

  const newUser = {
    name, email,
    password: hashed,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=e13b2e&color=fff&rounded=true`,
    phone: '', dob: '', location: '', bio: '',
    interests: [], notifications: 'all',
    blocked: false,
    isAdmin: email === 'admin@eventix.com',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection('users').add(newUser);
  const token  = jwt.sign({ id: docRef.id, email }, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    success: true,
    data: { id: docRef.id, name, email, avatar: newUser.avatar, isAdmin: newUser.isAdmin, token },
  });
}));

// POST /api/auth/login
app.post('/api/auth/login', authLimiter, (req, res, next) => {
  passport.authenticate('local', { session: true }, async (err, user, info) => {
    if (err)   return next(err);
    if (!user) return res.status(401).json({ success: false, error: info?.message || 'Invalid credentials' });

    req.logIn(user, async (loginErr) => {
      if (loginErr) return next(loginErr);

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

      // Signed cookie — httpOnly, not accessible to JS (XSS protection)
      res.cookie('eventix_uid', user.id, {
        signed: true, httpOnly: true, sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === 'production',
      });

      res.json({
        success: true,
        data: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, isAdmin: user.isAdmin || false, token },
      });
    });
  })(req, res, next);
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.clearCookie('eventix_uid');
      res.json({ success: true, message: 'Logged out' });
    });
  });
});

// GET /api/auth/me
app.get('/api/auth/me', requireAuth, (req, res) => {
  const { id, name, email, avatar, isAdmin } = req.user;
  res.json({ success: true, data: { id, name, email, avatar, isAdmin } });
});

// ─────────────────────────────────────────────────────────────────────────────
// ── USER ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/users/:id
app.get('/api/users/:id', asyncHandler(async (req, res) => {
  const doc = await db.collection('users').doc(req.params.id).get();
  if (!doc.exists) return res.status(404).json({ success: false, error: 'User not found' });
  const data = doc.data();
  delete data.password;
  res.json({ success: true, data: { id: doc.id, ...data } });
}));

// PUT /api/users/:id
app.put('/api/users/:id', requireAuth, asyncHandler(async (req, res) => {
  if (req.user.id !== req.params.id && !req.user.isAdmin)
    return res.status(403).json({ success: false, error: 'Forbidden' });

  const { name, avatar, phone, dob, location, bio, interests, notifications } = req.body;
  const update = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
  if (name          != null) update.name          = name;
  if (avatar        != null) update.avatar        = avatar;
  if (phone         != null) update.phone         = phone;
  if (dob           != null) update.dob           = dob;
  if (location      != null) update.location      = location;
  if (bio           != null) update.bio           = bio;
  if (interests     != null) update.interests     = interests;
  if (notifications != null) update.notifications = notifications;

  await db.collection('users').doc(req.params.id).update(update);
  res.json({ success: true, message: 'Profile updated' });
}));

// GET /api/users/:id/bookings — all events this user is enrolled in
app.get('/api/users/:id/bookings', requireAuth, asyncHandler(async (req, res) => {
  if (req.user.id !== req.params.id && !req.user.isAdmin)
    return res.status(403).json({ success: false, error: 'Forbidden' });

  // Fetch all events and filter to ones where this user has an enrollment
  const snap   = await db.collection('events').get();
  const userId = req.params.id;

  const bookings = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(ev => (ev.enrollments || []).some(e => e.userId === userId))
    .map(ev => {
      const enrollment = (ev.enrollments || []).find(e => e.userId === userId);
      return {
        eventId:        ev.id,
        eventName:      ev.eventName,
        organizerName:  ev.organizerName,
        date:           ev.date,
        category:       ev.category || 'general',
        seats:          enrollment?.seats || (enrollment?.seat ? [enrollment.seat] : []),
        seatCount:      enrollment?.seatCount || 1,
        enrolledAt:     enrollment?.enrolledAt,
        membersRequired: ev.membersRequired,
        enrolledMembers: ev.enrolledMembers,
      };
    });

  res.json({ success: true, data: bookings });
}));

// ─────────────────────────────────────────────────────────────────────────────
// ── EVENT ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/events
app.get('/api/events', asyncHandler(async (_req, res) => {
  const snap   = await db.collection('events').orderBy('createdAt', 'desc').get();
  const events = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  res.json({ success: true, data: events });
}));

// POST /api/events
app.post('/api/events', requireAuth, asyncHandler(async (req, res) => {
  const { eventName, date, membersRequired, description, category } = req.body;
  if (!eventName || !date || !membersRequired)
    return res.status(400).json({ success: false, error: 'eventName, date, membersRequired required' });

  const newEvent = {
    organizerName:   req.user.name,
    organizerId:     req.user.id,
    eventName, date,
    description:     description || '',
    category:        category    || 'general',
    membersRequired: parseInt(membersRequired, 10),
    enrolledMembers: 0,
    enrollments:     [],
    createdAt:       admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection('events').add(newEvent);
  res.status(201).json({ success: true, data: { id: docRef.id, ...newEvent } });
}));