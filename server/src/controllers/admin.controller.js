/**
 * admin.controller.js — Admin Controller
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles admin operations
 */

import UserModel from '../models/User.model.js';
import EventModel from '../models/Event.model.js';

class AdminController {
  /**
   * Get all users
   */
  static async getAllUsers(req, res, next) {
    try {
      const users = await UserModel.findAll();
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all events
   */
  static async getAllEvents(req, res, next) {
    try {
      const events = await EventModel.findAll();
      res.json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Block user
   */
  static async blockUser(req, res, next) {
    try {
      await UserModel.setBlockStatus(req.params.id, true);
      
      // Push updated stats
      if (req.app.get('pushAdminStats')) {
        req.app.get('pushAdminStats')();
      }

      res.json({ success: true, message: 'User blocked' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unblock user
   */
  static async unblockUser(req, res, next) {
    try {
      await UserModel.setBlockStatus(req.params.id, false);
      
      // Push updated stats
      if (req.app.get('pushAdminStats')) {
        req.app.get('pushAdminStats')();
      }

      res.json({ success: true, message: 'User unblocked' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(req, res, next) {
    try {
      await UserModel.delete(req.params.id);
      
      // Push updated stats
      if (req.app.get('pushAdminStats')) {
        req.app.get('pushAdminStats')();
      }

      res.json({ success: true, message: 'User deleted' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Make user admin
   */
  static async makeAdmin(req, res, next) {
    try {
      const user = await UserModel.findByEmail(req.body.email);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      await UserModel.makeAdmin(user.id);
      res.json({ success: true, message: `${req.body.email} is now admin` });
    } catch (error) {
      next(error);
    }
  }
}

export default AdminController;
