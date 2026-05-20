// authController.js — handles HTTP for auth, calls authService for logic
import * as authService from '../services/authService.js';

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const data = await authService.registerUser(name, email, password);
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    next(err);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await authService.loginUser(email, password);
    res.json({ success: true, data });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    next(err);
  }
};

// GET /api/auth/me — returns current logged-in user
export const me = (req, res) => {
  const data = authService.getCurrentUser(req.user);
  res.json({ success: true, data });
};

// POST /api/auth/logout — JWT is stateless so just tell client to delete token
export const logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};
