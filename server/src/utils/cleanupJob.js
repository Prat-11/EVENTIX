/**
 * cleanupJob.js — Cleanup Job for Expired Reservations
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs every minute to remove expired seat reservations
 */

import ReservationModel from '../models/Reservation.model.js';
import { DB_CONSTANTS } from '../config/database.config.js';

export function startCleanupJob(io) {
  setInterval(async () => {
    try {
      const result = await ReservationModel.cleanupExpired();

      if (result.count === 0) return;

      // Broadcast released seats to event rooms
      Object.entries(result.released).forEach(([eventId, seats]) => {
        io.to(`event:${eventId}`).emit('seats:released', { eventId, seats });
      });

      console.log(`🧹 Cleaned up ${result.count} expired reservations`);
    } catch (err) {
      console.error('Cleanup job error:', err.message);
    }
  }, DB_CONSTANTS.CLEANUP_INTERVAL_MS);
}
