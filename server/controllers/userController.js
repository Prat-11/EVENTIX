import * as userService from '../services/userService.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await userService.getUserProfile(req.params.id);
    res.json({ success: true, data: user });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const result = await userService.updateUserProfile(req.params.id, req.user.id, req.user.is_admin, req.body);
    res.json({ success: true, message: result.message });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    next(err);
  }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const result = await userService.updateAvatar(req.params.id, req.file.path, req.file.filename);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    next(err);
  }
};

export const getBookings = async (req, res, next) => {
  try {
    const bookings = await userService.getUserBookings(req.params.id, req.user.id, req.user.is_admin);
    res.json({ success: true, data: bookings });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    next(err);
  }
};
