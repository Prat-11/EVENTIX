/**
 * Event Controller
 * Handles event-related requests from client
 * Interacts with Event and Reservation models
 */
import mongoose from 'mongoose';
import Event from '../models/Event.js';
import Reservation from '../models/Reservation.js';

/**
 * Get all events
 * GET /api/events
 */
export const getAllEvents = async (req, res, next) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
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
    res.json({ success: true, data: eventsWithId });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new event
 * POST /api/events
 */
export const createEvent = async (req, res, next) => {
  try {
    const { eventName, date, membersRequired, description, category } = req.body;

    if (!eventName || !date || !membersRequired) {
      return res.status(400).json({
        success: false,
        error: 'eventName, date, and membersRequired are required'
      });
    }

    const event = await Event.create({
      organizerName: req.user.name,
      organizerId: req.user._id,
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

    res.status(201).json({ success: true, data: eventObj });
  } catch (error) {
    next(error);
  }
};

/**
 * Get event reservations
 * GET /api/events/:id/reservations
 */
export const getReservations = async (req, res, next) => {
  try {
    const now = new Date();
    const reservations = await Reservation.find({
      eventId: req.params.id,
      expiresAt: { $gt: now }
    });

    res.json({ success: true, data: reservations });
  } catch (error) {
    next(error);
  }
};

/**
 * Reserve seats
 * POST /api/events/:id/reserve
 */
export const reserveSeats = async (req, res, next) => {
  try {
    const { seats = [] } = req.body;

    if (!seats.length) {
      return res.status(400).json({ 
        success: false, 
        error: 'No seats provided' 
      });
    }

    if (seats.length > 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'Maximum 10 seats per booking' 
      });
    }

    // Check if event exists
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        error: 'Event not found' 
      });
    }

    // Check if seats are already taken
    const takenSeats = new Set(
      event.enrollments.flatMap(e => e.seats || [])
    );

    const conflict = seats.find(s => takenSeats.has(s));
    if (conflict) {
      return res.status(400).json({ 
        success: false, 
        error: `Seat ${conflict} is already taken` 
      });
    }

    // Check if seats are reserved by others
    const now = new Date();
    const reservations = await Reservation.find({
      eventId: req.params.id,
      expiresAt: { $gt: now },
      userId: { $ne: req.user._id }
    });

    const reservedSeats = new Set(
      reservations.flatMap(r => r.seats)
    );

    const reservedConflict = seats.find(s => reservedSeats.has(s));
    if (reservedConflict) {
      return res.status(400).json({ 
        success: false, 
        error: `Seat ${reservedConflict} is being held by another user` 
      });
    }

    // Clear user's previous reservations for this event
    await Reservation.deleteMany({
      eventId: req.params.id,
      userId: req.user._id
    });

    // Create new reservation (expires in 5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const reservation = await Reservation.create({
      eventId: req.params.id,
      userId: req.user._id,
      userName: req.user.name,
      seats,
      expiresAt
    });

    // Emit socket event (if io is available)
    if (req.app.get('io')) {
      req.app.get('io').to(`event:${req.params.id}`).emit('seats:reserved', {
        eventId: req.params.id,
        seats,
        userId: req.user._id.toString(),
        expiresAt: expiresAt.toISOString()
      });
    }

    res.json({
      success: true,
      reservationId: reservation._id,
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear reservation
 * DELETE /api/events/:id/reserve
 */
export const clearReservation = async (req, res, next) => {
  try {
    const result = await Reservation.find({
      eventId: req.params.id,
      userId: req.user._id
    });

    const seats = result.flatMap(r => r.seats);

    await Reservation.deleteMany({
      eventId: req.params.id,
      userId: req.user._id
    });

    if (seats.length > 0 && req.app.get('io')) {
      req.app.get('io').to(`event:${req.params.id}`).emit('seats:released', {
        eventId: req.params.id,
        seats
      });
    }

    res.json({ success: true, message: 'Reservation cleared' });
  } catch (error) {
    next(error);
  }
};

/**
 * Enroll in event (with MongoDB transaction)
 * POST /api/events/:id/enroll
 */
export const enrollInEvent = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const seats = req.body.seats || (req.body.seat ? [req.body.seat] : []);
    const count = seats.length || 1;

    if (count > 10) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        error: 'Maximum 10 seats per booking' 
      });
    }

    // Find event
    const event = await Event.findById(req.params.id).session(session);
    if (!event) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false, 
        error: 'Event not found' 
      });
    }

    // Check if already enrolled
    const alreadyEnrolled = event.enrollments.some(
      e => e.userId.toString() === req.user._id.toString()
    );
    if (alreadyEnrolled) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        error: 'Already enrolled in this event' 
      });
    }

    // Check capacity
    const spotsLeft = event.membersRequired - event.enrolledMembers;
    if (spotsLeft < count) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        error: `Only ${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} remaining` 
      });
    }

    // Check seat conflicts
    if (seats.length > 0) {
      const takenSeats = new Set(
        event.enrollments.flatMap(e => e.seats || [])
      );
      const conflict = seats.find(s => takenSeats.has(s));
      if (conflict) {
        await session.abortTransaction();
        return res.status(400).json({ 
          success: false, 
          error: `Seat ${conflict} already taken — pick another` 
        });
      }
    }

    // Add enrollment
    event.enrollments.push({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      seats: seats.length > 0 ? seats : [],
      seatCount: count,
      enrolledAt: new Date()
    });
    event.enrolledMembers += count;

    await event.save({ session });

    // Clear reservations
    await Reservation.deleteMany({
      eventId: req.params.id,
      userId: req.user._id
    }).session(session);

    await session.commitTransaction();

    // Emit socket events
    if (req.app.get('io')) {
      const io = req.app.get('io');
      
      seats.forEach(seat => {
        io.to(`event:${req.params.id}`).emit('seat:taken', {
          eventId: req.params.id,
          seat,
          userId: req.user._id.toString()
        });
      });

      io.to(`event:${req.params.id}`).emit('event:update', {
        id: req.params.id,
        enrolledMembers: event.enrolledMembers,
        membersRequired: event.membersRequired,
        spotsLeft: event.membersRequired - event.enrolledMembers,
        isFull: event.enrolledMembers >= event.membersRequired
      });
    }

    // Transform event for response
    const eventObj = event.toObject();
    eventObj.id = eventObj._id.toString();

    res.json({
      success: true,
      message: `${count} seat${count > 1 ? 's' : ''} booked successfully`,
      seats,
      event: eventObj
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

/**
 * Delete event
 * DELETE /api/events/:id
 */
export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        error: 'Event not found' 
      });
    }

    if (event.organizerId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: 'Forbidden' 
      });
    }

    await Event.findByIdAndDelete(req.params.id);
    
    if (req.app.get('io')) {
      req.app.get('io').emit('event:deleted', { 
        id: req.params.id,
        _id: req.params.id 
      });
    }
    
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
};
