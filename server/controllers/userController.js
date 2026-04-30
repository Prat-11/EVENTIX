/**
 * User Controller
 * Handles user-related requests from client
 * Interacts with User and Event models
 */
import User from '../models/User.js';
import Event from '../models/Event.js';

/**
 * Get user profile
 * GET /api/users/:id
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/users/:id
 */
export const updateProfile = async (req, res, next) => {
  try {
    // Check authorization
    if (req.user._id.toString() !== req.params.id && !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: 'Forbidden' 
      });
    }

    const { name, avatar, phone, dob, location, bio, interests, notifications } = req.body;
    
    const updates = {};
    if (name != null) updates.name = name;
    if (avatar != null) updates.avatar = avatar;
    if (phone != null) updates.phone = phone;
    if (dob != null) updates.dob = dob;
    if (location != null) updates.location = location;
    if (bio != null) updates.bio = bio;
    if (interests != null) updates.interests = interests;
    if (notifications != null) updates.notifications = notifications;

    await User.findByIdAndUpdate(req.params.id, updates, { new: true });

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's bookings
 * GET /api/users/:id/bookings
 */
export const getBookings = async (req, res, next) => {
  try {
    // Check authorization
    if (req.user._id.toString() !== req.params.id && !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: 'Forbidden' 
      });
    }

    // Find all events where user is enrolled
    const events = await Event.find({
      'enrollments.userId': req.params.id
    });

    // Map to booking format
    const bookings = events.map(event => {
      const enrollment = event.enrollments.find(
        e => e.userId.toString() === req.params.id
      );

      return {
        id: event._id.toString(),
        eventId: event._id,
        eventName: event.eventName,
        organizerName: event.organizerName,
        date: event.date,
        category: event.category,
        seats: enrollment.seats || [],
        seatCount: enrollment.seatCount,
        enrolledAt: enrollment.enrolledAt,
        membersRequired: event.membersRequired,
        enrolledMembers: event.enrolledMembers
      };
    });

    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};
