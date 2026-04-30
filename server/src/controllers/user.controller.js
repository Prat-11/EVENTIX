/**
 * user.controller.js — User Controller
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles user profile operations
 */

import UserModel from '../models/User.model.js';
import EventModel from '../models/Event.model.js';

class UserController {
  /**
   * Get user by ID
   */
  static async getUser(req, res, next) {
    try {
      const user = await UserModel.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      delete user.password;
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   */
  static async updateUser(req, res, next) {
    try {
      // Authorization check
      if (req.user.id !== req.params.id && !req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
        });
      }

      const { name, avatar, phone, dob, location, bio, interests, notifications } = req.body;
      
      const updateData = {};
      if (name != null) updateData.name = name;
      if (avatar != null) updateData.avatar = avatar;
      if (phone != null) updateData.phone = phone;
      if (dob != null) updateData.dob = dob;
      if (location != null) updateData.location = location;
      if (bio != null) updateData.bio = bio;
      if (interests != null) updateData.interests = interests;
      if (notifications != null) updateData.notifications = notifications;

      await UserModel.update(req.params.id, updateData);

      res.json({ success: true, message: 'Profile updated' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user bookings
   */
  static async getUserBookings(req, res, next) {
    try {
      // Authorization check
      if (req.user.id !== req.params.id && !req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
        });
      }

      const bookings = await EventModel.getUserBookings(req.params.id);
      res.json({ success: true, data: bookings });
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
