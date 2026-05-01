/**
 * Event Controller
 * Handles HTTP requests/responses for event operations
 * Business logic is in eventService
 */
import * as eventService from '../services/eventService.js';

/**
 * Get all events
 * GET /api/events
 */
export const getAllEvents = async (req, res, next) => {
  try {
    const events = await eventService.getAllEvents();
    res.json({ success: true, data: events });
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
    const event = await eventService.createEvent(req.user, req.body);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    next(error);
  }
};

/**
 * Get event reservations
 * GET /api/events/:id/reservations
 */
export const getReservations = async (req, res, next) => {
  try {
    const reservations = await eventService.getEventReservations(req.params.id);
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
    const result = await eventService.reserveSeats(
      req.params.id,
      req.user._id,
      req.user.name,
      seats
    );

    // Emit socket event (if io is available)
    if (req.app.get('io')) {
      req.app.get('io').to(`event:${req.params.id}`).emit('seats:reserved', {
        eventId: result.eventId,
        seats: result.seats,
        userId: result.userId,
        expiresAt: result.expiresAt
      });
    }

    res.json({
      success: true,
      reservationId: result.reservationId,
      expiresAt: result.expiresAt
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    next(error);
  }
};

/**
 * Clear reservation
 * DELETE /api/events/:id/reserve
 */
export const clearReservation = async (req, res, next) => {
  try {
    const result = await eventService.clearReservation(req.params.id, req.user._id);

    if (result.seats.length > 0 && req.app.get('io')) {
      req.app.get('io').to(`event:${req.params.id}`).emit('seats:released', {
        eventId: result.eventId,
        seats: result.seats
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
  try {
    const seats = req.body.seats || (req.body.seat ? [req.body.seat] : []);
    const result = await eventService.enrollInEvent(req.params.id, req.user, seats);

    // Emit socket events
    if (req.app.get('io')) {
      const io = req.app.get('io');
      
      result.seats.forEach(seat => {
        io.to(`event:${req.params.id}`).emit('seat:taken', {
          eventId: result.eventId,
          seat,
          userId: result.userId
        });
      });

      io.to(`event:${req.params.id}`).emit('event:update', {
        id: req.params.id,
        enrolledMembers: result.event.enrolledMembers,
        membersRequired: result.event.membersRequired,
        spotsLeft: result.event.membersRequired - result.event.enrolledMembers,
        isFull: result.event.enrolledMembers >= result.event.membersRequired
      });
    }

    res.json({
      success: true,
      message: result.message,
      seats: result.seats,
      event: result.event
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    next(error);
  }
};

/**
 * Delete event
 * DELETE /api/events/:id
 */
export const deleteEvent = async (req, res, next) => {
  try {
    const result = await eventService.deleteEvent(
      req.params.id,
      req.user._id,
      req.user.isAdmin
    );
    
    if (req.app.get('io')) {
      req.app.get('io').emit('event:deleted', { 
        id: result.eventId,
        _id: result.eventId 
      });
    }
    
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    next(error);
  }
};
