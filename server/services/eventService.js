/**
 * Event Service
 * Contains all event-related business logic including concurrency control
 */
import mongoose from 'mongoose';
import Event from '../models/Event.js';
import Reservation from '../models/Reservation.js';

/**
 * Get all upcoming events
 */
export const getAllEvents = async () => {
  const today = new Date().toISOString().split('T')[0]; // "2026-04-30"
  
  // Only get events that haven't happened yet
  const events = await Event.find({ 
    date: { $gte: today } // Greater than or equal to today
  }).sort({ date: 1, createdAt: -1 });
  
  // Transform _id to id for frontend compatibility
  const eventsWithId = events.map(e => {
    const obj = e.toObject();
    obj.id = obj._id.toString();
    
    // Convert userId in enrollments to string for frontend comparison
    if (obj.enrollments && obj.enrollments.length > 0) {
      obj.enrollments = obj.enrollments.map(enrollment => ({
        ...enrollment,
        userId: enrollment.userId.toString()
      }));
    }
    return obj;
  });
  
  return eventsWithId;
};

/**
 * Create new event
 */
export const createEvent = async (organizerData, eventData) => {
  const { eventName, date, membersRequired, description, category } = eventData;

  if (!eventName || !date || !membersRequired) {
    throw { status: 400, message: 'eventName, date, and membersRequired are required' };
  }

  const event = await Event.create({
    organizerName: organizerData.name,
    organizerId: organizerData._id,
    eventName,
    date,
    description: description || '',
    category: category || 'general',
    membersRequired: parseInt(membersRequired, 10),
    enrolledMembers: 0,
    enrollments: []
  });

  // Transform _id to id for frontend compatibility
  const eventObj = event.toObject();
  eventObj.id = eventObj._id.toString();

  return eventObj;
};

/**
 * Get active reservations for an event
 */
export const getEventReservations = async (eventId) => {
  const now = new Date();
  const reservations = await Reservation.find({
    eventId: eventId,
    expiresAt: { $gt: now }
  });

  return reservations;
};

/**
 * Reserve seats temporarily (5 minutes)
 */
export const reserveSeats = async (eventId, userId, userName, seats) => {
  if (!seats.length) {
    throw { status: 400, message: 'No seats provided' };
  }

  if (seats.length > 10) {
    throw { status: 400, message: 'Maximum 10 seats per booking' };
  }

  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw { status: 404, message: 'Event not found' };
  }

  // Check if seats are already taken (permanently enrolled)
  const takenSeats = new Set(
    event.enrollments.flatMap(e => e.seats || [])
  );

  const conflict = seats.find(s => takenSeats.has(s));
  if (conflict) {
    throw { status: 400, message: `Seat ${conflict} is already taken` };
  }

  // Check if seats are reserved by others (temporarily)
  const now = new Date();
  const reservations = await Reservation.find({
    eventId: eventId,
    expiresAt: { $gt: now },
    userId: { $ne: userId }
  });

  const reservedSeats = new Set(
    reservations.flatMap(r => r.seats)
  );

  const reservedConflict = seats.find(s => reservedSeats.has(s));
  if (reservedConflict) {
    throw { status: 400, message: `Seat ${reservedConflict} is being held by another user` };
  }

  // Clear user's previous reservations for this event
  await Reservation.deleteMany({
    eventId: eventId,
    userId: userId
  });

  // Create new reservation (expires in 5 minutes)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  const reservation = await Reservation.create({
    eventId: eventId,
    userId: userId,
    userName: userName,
    seats,
    expiresAt
  });

  return {
    reservationId: reservation._id,
    expiresAt: expiresAt.toISOString(),
    eventId,
    seats,
    userId: userId.toString()
  };
};

/**
 * Clear user's reservation
 */
export const clearReservation = async (eventId, userId) => {
  const result = await Reservation.find({
    eventId: eventId,
    userId: userId
  });

  const seats = result.flatMap(r => r.seats);

  await Reservation.deleteMany({
    eventId: eventId,
    userId: userId
  });

  return { seats, eventId };
};

/**
 * Enroll in event (permanent booking with MongoDB transaction)
 */
export const enrollInEvent = async (eventId, userData, seats) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const count = seats.length || 1;

    if (count > 10) {
      await session.abortTransaction();
      throw { status: 400, message: 'Maximum 10 seats per booking' };
    }

    // Find event with session (locks the document)
    const event = await Event.findById(eventId).session(session);
    if (!event) {
      await session.abortTransaction();
      throw { status: 404, message: 'Event not found' };
    }

    // Check if already enrolled
    const alreadyEnrolled = event.enrollments.some(
      e => e.userId.toString() === userData._id.toString()
    );
    if (alreadyEnrolled) {
      await session.abortTransaction();
      throw { status: 400, message: 'Already enrolled in this event' };
    }

    // Check capacity
    const spotsLeft = event.membersRequired - event.enrolledMembers;
    if (spotsLeft < count) {
      await session.abortTransaction();
      throw { status: 400, message: `Only ${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} remaining` };
    }

    // Check seat conflicts (RACE CONDITION PROTECTION)
    if (seats.length > 0) {
      const takenSeats = new Set(
        event.enrollments.flatMap(e => e.seats || [])
      );
      const conflict = seats.find(s => takenSeats.has(s));
      if (conflict) {
        await session.abortTransaction();
        throw { status: 400, message: `Seat ${conflict} already taken — pick another` };
      }
    }

    // Add enrollment
    event.enrollments.push({
      userId: userData._id,
      userName: userData.name,
      userEmail: userData.email,
      seats: seats.length > 0 ? seats : [],
      seatCount: count,
      enrolledAt: new Date()
    });
    event.enrolledMembers += count;

    await event.save({ session });

    // Clear reservation
    await Reservation.deleteMany({
      eventId: eventId,
      userId: userData._id
    }).session(session);

    await session.commitTransaction();

    // Transform event for response
    const eventObj = event.toObject();
    eventObj.id = eventObj._id.toString();

    return {
      message: `${count} seat${count > 1 ? 's' : ''} booked successfully`,
      seats,
      event: eventObj,
      eventId,
      userId: userData._id.toString()
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Delete event
 */
export const deleteEvent = async (eventId, userId, isAdmin) => {
  const event = await Event.findById(eventId);
  
  if (!event) {
    throw { status: 404, message: 'Event not found' };
  }

  if (event.organizerId.toString() !== userId.toString() && !isAdmin) {
    throw { status: 403, message: 'Forbidden' };
  }

  await Event.findByIdAndDelete(eventId);
  
  return { eventId };
};

/**
 * Clean up expired reservations (called by background job)
 */
export const cleanupExpiredReservations = async () => {
  const now = new Date();
  const expired = await Reservation.find({ expiresAt: { $lte: now } });

  if (expired.length === 0) return { count: 0, released: {} };

  const released = {};
  expired.forEach(r => {
    const eventId = r.eventId.toString();
    if (!released[eventId]) released[eventId] = [];
    released[eventId].push(...r.seats);
  });

  await Reservation.deleteMany({ expiresAt: { $lte: now } });

  return { count: expired.length, released };
};
