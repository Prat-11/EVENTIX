/**
 * socket.controller.js — Socket.io Controller
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles real-time WebSocket connections
 */

import { db } from '../config/firebase.config.js';
import { COLLECTIONS } from '../config/database.config.js';

export function initializeSocketIO(io) {
  io.on('connection', (socket) => {
    console.log(`🔌  Socket connected: ${socket.id}`);

    // Join event room
    socket.on('join:event', (eventId) => {
      socket.join(`event:${eventId}`);
    });

    // Leave event room
    socket.on('leave:event', (eventId) => {
      socket.leave(`event:${eventId}`);
    });

    // Join admin room
    socket.on('join:admin', () => {
      socket.join('admin');
      pushAdminStats(io); // Push current stats immediately
    });

    // Disconnect
    socket.on('disconnect', (reason) => {
      console.log(`🔌  Socket disconnected: ${socket.id} (${reason})`);
    });
  });
}

/**
 * Push admin statistics to all connected admin clients
 */
export async function pushAdminStats(io) {
  try {
    const [usersSnap, eventsSnap] = await Promise.all([
      db.collection(COLLECTIONS.USERS).get(),
      db.collection(COLLECTIONS.EVENTS).get(),
    ]);

    const users = usersSnap.docs.map(d => d.data());
    const events = eventsSnap.docs.map(d => d.data());

    io.to('admin').emit('admin:stats', {
      totalUsers: users.length,
      blockedUsers: users.filter(u => u.blocked).length,
      totalEvents: events.length,
      totalEnrollments: events.reduce((sum, e) => sum + (e.enrolledMembers || 0), 0),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('pushAdminStats error:', err.message);
  }
}
