// userController.js — handles HTTP for users, calls userService for logic
import * as userService from '../services/userService.js';

// GET /api/users/:id
export const getProfile = async (req, res, next) => {
  try {
    const user = await userService.getUserProfile(req.params.id);
    res.json({ success: true, data: user });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    next(err);
  }
};

// PUT /api/users/:id
export const updateProfile = async (req, res, next) => {
  try {
    const result = await userService.updateUserProfile(
      req.params.id,
      req.user.id,        // who is making the request
      req.user.is_admin,
      req.body
    );
    res.json({ success: true, message: result.message });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    next(err);
  }
};

// POST /api/users/:id/avatar — upload profile picture to Cloudinary
export const uploadAvatar = async (req, res, next) => {
  try {
    // multer already uploaded the file to Cloudinary and put the result in req.file
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    const result = await userService.updateAvatar(
      req.params.id,
      req.file.path,       // Cloudinary URL
      req.file.filename    // Cloudinary public_id
    );

    // update localStorage on frontend with new avatar
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    next(err);
  }
};

// GET /api/users/:id/bookings
export const getBookings = async (req, res, next) => {
  try {
    const bookings = await userService.getUserBookings(
      req.params.id,
      req.user.id,
      req.user.is_admin
    );
    res.json({ success: true, data: bookings });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    next(err);
  }
};
