/**
 * Auth Controller
 * Handles HTTP requests/responses for authentication
 * Business logic is in authService
 */
import * as authService from '../services/authService.js';

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const userData = await authService.registerUser(name, email, password);
    
    res.status(201).json({
      success: true,
      data: userData
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    next(error);
  }
};

/**
 * Login with email/password
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const userData = await authService.loginUser(email, password);
    
    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    next(error);
  }
};

/**
 * Get current user
 * GET /api/auth/me
 */
export const me = (req, res) => {
  const userData = authService.getCurrentUser(req.user);
  res.json({ 
    success: true, 
    data: userData
  });
};

/**
 * Logout
 * POST /api/auth/logout
 */
export const logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};
