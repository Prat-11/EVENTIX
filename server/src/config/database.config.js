/**
 * database.config.js — Database Configuration & Constants
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const COLLECTIONS = {
  USERS: 'users',
  EVENTS: 'events',
  RESERVATIONS: 'reservations',
};

export const DB_CONSTANTS = {
  MAX_SEATS_PER_BOOKING: 10,
  RESERVATION_TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes
  CLEANUP_INTERVAL_MS: 60 * 1000, // 1 minute
};
