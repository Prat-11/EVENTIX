// authService.js — all authentication logic lives here
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// ── Register ──────────────────────────────────────────────────────────────────
export const registerUser = async (name, email, password) => {
  // basic validation
  if (!name || !email || !password) throw { status: 400, message: 'All fields required' };
  if (password.length < 6) throw { status: 400, message: 'Password must be at least 6 characters' };

  // check if email already taken
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) throw { status: 400, message: 'Email already registered' };

  // hash password — bcrypt adds salt automatically, 12 = work factor (higher = slower = safer)
  const hashedPassword = await bcrypt.hash(password, 12);

  // default avatar using ui-avatars.com (free service, generates initials avatar)
  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`;

  // insert user into database
  const result = await db.query(
    `INSERT INTO users (name, email, password, avatar, is_admin)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, avatar, is_admin`,
    [name, email, hashedPassword, avatar, email === 'admin@eventix.com']
  );

  const user = result.rows[0];
  const token = generateToken(user.id, user.email); // make JWT

  return { id: user.id, name: user.name, email: user.email, avatar: user.avatar, isAdmin: user.is_admin, token };
};

// ── Login ─────────────────────────────────────────────────────────────────────
export const loginUser = async (email, password) => {
  // find user by email
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];

  if (!user) throw { status: 401, message: 'Invalid credentials' };
  if (user.blocked) throw { status: 401, message: 'Account blocked' };

  // compare plain password with hashed one in DB
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw { status: 401, message: 'Invalid credentials' };

  const token = generateToken(user.id, user.email);

  return { id: user.id, name: user.name, email: user.email, avatar: user.avatar, isAdmin: user.is_admin, token };
};

// ── Get current user ──────────────────────────────────────────────────────────
export const getCurrentUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  isAdmin: user.is_admin
});

// ── JWT helper ────────────────────────────────────────────────────────────────
// jwt.sign = creates a token with user data inside, expires in 7 days
const generateToken = (userId, email) =>
  jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
