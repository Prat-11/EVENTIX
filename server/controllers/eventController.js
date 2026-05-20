// eventController.js — handles HTTP for events, calls eventService for logic
import * as eventService from '../services/eventService.js';

// GET /api/events
export const getAllEvents = async (req, res, next) => {
  try {
    const events = await eventService.getAllEvents();
    res.json({ success: true, data: events });
  } catch (err) { next(err); }
};

// POST /api/events — supports optional image upload via multipart/form-data
export const createEvent = async (req, res, next) => {
  try {
    // if image was uploaded, req.file has the Cloudinary result
    const imageUrl      = req.file?.path     || null;
    const imagePublicId = req.file?.filename || null;

    const event = await eventService.createEvent(req.user, req.body, imageUrl, imagePublicId);
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    next(err);
  }
};

// GET /api/events/:id/reservations
export const getReservations = async (req, res, next) => {
  try {
    const reservations = await eventService.getEventReservations(req.params.id);
    res.json({ success: true, data: reservations });
  } catch (err) { next(err); }
};

// POST /api/events/:id/reserve
export const reserveSeats = async (req, res, next) => {
  try {
    const { seats = [] } = req.body;
    const result = await eventService.reserveSeats(req.params.id, req.user.id, req.user.name, seats);

    // tell all users watching this event that these seats are now reserved
    req.app.get('io')?.to(`event:${req.params.id}`).emit('seats:reserved', {
      eventId: result.eventId,
      seats:   result.seats,
      userId:  result.userId,
      expiresAt: result.expiresAt
    });

    res.json({ success: true, reservationId: result.reservationId, expiresAt: result.expiresAt });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    next(err);
  }
};

// DELETE /api/events/:id/reserve
export const clearReservation = async (req, res, next) => {
  try {
    const result = await eventService.clearReservation(req.params.id, req.user.id);

    if (result.seats.length > 0) {
      req.app.get('io')?.to(`event:${req.params.id}`).emit('seats:released', {
        eventId: result.eventId,
        seats:   result.seats
      });
    }

    res.json({ success: true, message: 'Reservation cleared' });
  } catch (err) { next(err); }
};

// POST /api/events/:id/enroll
export const enrollInEvent = async (req, res, next) => {
  try {
    const seats  = req.body.seats || (req.body.seat ? [req.body.seat] : []);
    const result = await eventService.enrollInEvent(req.params.id, req.user, seats);

    const io = req.app.get('io');
    if (io) {
      // tell everyone each seat is now permanently taken
      result.seats.forEach(seat =>
        io.to(`event:${req.params.id}`).emit('seat:taken', { eventId: result.eventId, seat, userId: result.userId })
      );
      // update the event card stats for everyone
      io.to(`event:${req.params.id}`).emit('event:update', {
        id:              req.params.id,
        enrolledMembers: result.event.enrolledMembers,
        membersRequired: result.event.membersRequired,
        spotsLeft:       result.event.membersRequired - result.event.enrolledMembers,
        isFull:          result.event.enrolledMembers >= result.event.membersRequired
      });
    }

    res.json({ success: true, message: result.message, seats: result.seats, event: result.event });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    next(err);
  }
};

// DELETE /api/events/:id
export const deleteEvent = async (req, res, next) => {
  try {
    const result = await eventService.deleteEvent(req.params.id, req.user.id, req.user.is_admin);
    req.app.get('io')?.emit('event:deleted', { id: result.eventId });
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    next(err);
  }
};
