/**
 * User Controller
 * Handles HTTP requests/responses for user operations
 * Business logic is in userService
 */
import * as userService from '../services/userService.js';

/**
 * Get user profile
 * GET /api/users/:id
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await userService.getUserProfile(req.params.id);
    res.json({ success: true, data: user });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/users/:id
 */
export const updateProfile = async (req, res, next) => {
  try {
    const result = await userService.updateUserProfile(
      req.params.id,
      req.user._id.toString(),
      req.user.isAdmin,
      req.body
    );
    
    res.json({ success: true, message: result.message });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    next(error);
  }
};

/**
 * Get user's bookings
 * GET /api/users/:id/bookings
 */
export const getBookings = async (req, res, next) => {
  try {
    const bookings = await userService.getUserBookings(
      req.params.id,
      req.user._id.toString(),
      req.user.isAdmin
    );
    
    res.json({ success: true, data: bookings });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    next(error);
  }
};
