/**
 * event.controller.js — Event Controller
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles event operations and seat reservations
 */

import EventModel from '../models/Event.model.js';
import ReservationModel from '../models/Reservation.model.js';
import { DB_CONSTANTS } from '../config/database.config.js';

class EventController {
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
   * Create new event
   */
  static async createEvent(req, res, next) {
    try {
      const { eventName, date, membersRequired, description, category } = req.body;

      if (!eventName || !date || !membersRequired) {
        return res.status(400).json({
          success: false,
          error: 'eventName, date, membersRequired required',
        });
      }

      const newEvent = await EventModel.create({
        organizerName: req.user.name,
        organizerId: req.user.id,
        eventName,
        date,
        description,
        category,
        membersRequired,
      });

      res.status(201).json({ success: true, data: newEvent });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active reservations for an event
   */
  static async getReservations(req, res, next) {
    try {
      const reservations = await ReservationModel.getActiveByEvent(req.params.id);
      res.json({ success: true, data: reservations });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reserve seats (5-minute hold)
   */
  static async reserveSeats(req, res, next) {
    try {
      const eventId = req.params.id;
      const user = req.user;
      const seats = req.body.seats || [];

      if (!seats.length) {
        return res.status(400).json({
          success: false,
          error: 'No seats provided',
        });
      }

      if (seats.length > DB_CONSTANTS.MAX_SEATS_PER_BOOKING) {
        return res.status(400).json({
          success: false,
          error: `Max ${DB_CONSTANTS.MAX_SEATS_PER_BOOKING} seats per booking`,
        });
      }

      const event = await EventModel.findById(eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          error: 'Event not found',
        });
      }

      // Check if seats are already taken
      const takenSeats = new Set(
        (event.enrollments || [])
          .map(e => e.seats || [e.seat])
          .flat()
          .filter(Boolean)
      );

      const conflict = seats.find(s => takenSeats.has(s));
      if (conflict) {
        return res.status(400).json({
          success: false,
          error: `Seat ${conflict} already taken`,
        });
      }

      // Check if seats are reserved by someone else
      const reservations = await ReservationModel.getActiveByEvent(eventId);
      const reservedSeats = new Set();
      
      reservations.forEach(r => {
        if (r.userId !== user.id) {
          r.seats.forEach(s => reservedSeats.add(s));
        }
      });

      const reservedConflict = seats.find(s => reservedSeats.has(s));
      if (reservedConflict) {
        return res.status(400).json({
          success: false,
          error: `Seat ${reservedConflict} is being held by another user`,
        });
      }

      // Clear old reservations by this user
      await ReservationModel.deleteByUserAndEvent(user.id, eventId);

      // Create new reservation
      const reservation = await ReservationModel.create({
        eventId,
        userId: user.id,
        userName: user.name,
        seats,
      });

      // Broadcast via Socket.io (handled in socket controller)
      if (req.app.get('io')) {
        req.app.get('io').to(`event:${eventId}`).emit('seats:reserved', {
          eventId,
          seats,
          userId: user.id,
          expiresAt: reservation.expiresAt.toISOString(),
        });
      }

      res.json({
        success: true,
        reservationId: reservation.id,
        expiresAt: reservation.expiresAt.toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear reservation
   */
  static async clearReservation(req, res, next) {
    try {
      const eventId = req.params.id;
      const userId = req.user.id;

      const seats = await ReservationModel.deleteByUserAndEvent(userId, eventId);

      if (seats.length === 0) {
        return res.json({ success: true, message: 'No reservation to clear' });
      }

      // Broadcast via Socket.io
      if (req.app.get('io')) {
        req.app.get('io').to(`event:${eventId}`).emit('seats:released', {
          eventId,
          seats,
        });
      }

      res.json({ success: true, message: 'Reservation cleared' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Enroll in event (confirm booking)
   */
  static async enrollInEvent(req, res, next) {
    try {
      const eventId = req.params.id;
      const user = req.user;
      const seats = req.body.seats || (req.body.seat ? [req.body.seat] : []);
      const count = seats.length || 1;

      if (count > DB_CONSTANTS.MAX_SEATS_PER_BOOKING) {
        return res.status(400).json({
          success: false,
          error: `Max ${DB_CONSTANTS.MAX_SEATS_PER_BOOKING} seats per booking`,
        });
      }

      const enrollment = await EventModel.enrollUser(eventId, {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        seats: seats.length > 0 ? seats : null,
        seatCount: count,
      });

      // Clear user's reservation
      await ReservationModel.deleteByUserAndEvent(user.id, eventId);

      // Get updated event
      const updatedEvent = await EventModel.findById(eventId);

      // Broadcast via Socket.io
      const io = req.app.get('io');
      if (io) {
        seats.forEach(seat => {
          io.to(`event:${eventId}`).emit('seat:taken', {
            eventId,
            seat,
            userId: user.id,
          });
        });

        io.to(`event:${eventId}`).emit('event:update', {
          id: eventId,
          enrolledMembers: updatedEvent.enrolledMembers,
          membersRequired: updatedEvent.membersRequired,
          spotsLeft: updatedEvent.membersRequired - updatedEvent.enrolledMembers,
          isFull: updatedEvent.enrolledMembers >= updatedEvent.membersRequired,
        });

        io.to('admin').emit('enrollment:new', {
          eventId,
          eventName: updatedEvent.eventName,
          enrolledMembers: updatedEvent.enrolledMembers,
          membersRequired: updatedEvent.membersRequired,
          seats,
          seatCount: count,
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        message: `${count} seat${count > 1 ? 's' : ''} booked successfully`,
        seats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete event
   */
  static async deleteEvent(req, res, next) {
    try {
      const event = await EventModel.findById(req.params.id);
      
      if (!event) {
        return res.status(404).json({
          success: false,
          error: 'Event not found',
        });
      }

      // Authorization check
      if (event.organizerId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
        });
      }

      await EventModel.delete(req.params.id);

      // Broadcast via Socket.io
      if (req.app.get('io')) {
        req.app.get('io').emit('event:deleted', { id: req.params.id });
      }

      res.json({ success: true, message: 'Event deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export default EventController;
