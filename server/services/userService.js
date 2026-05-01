/**
 * User Service
 * Contains all user-related business logic
 */
import User from '../models/User.js';
import Event from '../models/Event.js';

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('-password');
  
  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  return user;
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, requesterId, isAdmin, updates) => {
  // Check authorization
  if (requesterId !== userId && !isAdmin) {
    throw { status: 403, message: 'Forbidden' };
  }

  const { name, avatar, phone, dob, location, bio, interests, notifications } = updates;
  
  const updateData = {};
  if (name != null) updateData.name = name;
  if (avatar != null) updateData.avatar = avatar;
  if (phone != null) updateData.phone = phone;
  if (dob != null) updateData.dob = dob;
  if (location != null) updateData.location = location;
  if (bio != null) updateData.bio = bio;
  if (interests != null) updateData.interests = interests;
  if (notifications != null) updateData.notifications = notifications;

  await User.findByIdAndUpdate(userId, updateData, { new: true });

  return { message: 'Profile updated successfully' };
};

/**
 * Get user's bookings
 */
export const getUserBookings = async (userId, requesterId, isAdmin) => {
  // Check authorization
  if (requesterId !== userId && !isAdmin) {
    throw { status: 403, message: 'Forbidden' };
  }

  // Find all events where user is enrolled
  const events = await Event.find({
    'enrollments.userId': userId
  });

  // Map to booking format
  const bookings = events.map(event => {
    const enrollment = event.enrollments.find(
      e => e.userId.toString() === userId
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

  return bookings;
};
