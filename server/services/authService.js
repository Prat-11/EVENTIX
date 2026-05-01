/**
 * Auth Service
 * Contains all authentication business logic
 */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'eventix_jwt_dev_secret';

/**
 * Register a new user
 */
export const registerUser = async (name, email, password) => {
  // Validate input
  if (!name || !email || !password) {
    throw { status: 400, message: 'All fields required' };
  }

  if (password.length < 6) {
    throw { status: 400, message: 'Password must be at least 6 characters' };
  }

  // Check if user exists
  const existing = await User.findOne({ email });
  if (existing) {
    throw { status: 400, message: 'Email already registered' };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    isAdmin: email === 'admin@eventix.com'
  });

  // Generate JWT
  const token = generateToken(user._id, user.email);

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    isAdmin: user.isAdmin,
    token
  };
};

/**
 * Login user
 */
export const loginUser = async (email, password) => {
  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    throw { status: 401, message: 'Invalid credentials' };
  }

  // Check if blocked
  if (user.blocked) {
    throw { status: 401, message: 'Account blocked' };
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw { status: 401, message: 'Invalid credentials' };
  }

  // Generate JWT
  const token = generateToken(user._id, user.email);

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    isAdmin: user.isAdmin || false,
    token
  };
};

/**
 * Get current user info
 */
export const getCurrentUser = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    isAdmin: user.isAdmin
  };
};

/**
 * Generate JWT token
 */
const generateToken = (userId, email) => {
  return jwt.sign(
    { id: userId, email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};
