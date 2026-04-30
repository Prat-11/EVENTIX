/**
 * Reservation.model.js — Seat Reservation Model
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles temporary seat reservations (5-minute holds)
 */

import { db } from '../config/firebase.config.js';
import { COLLECTIONS, DB_CONSTANTS } from '../config/database.config.js';

class ReservationModel {
  /**
   * Create a new reservation
   */
  static async create(reservationData) {
    const expiresAt = new Date(Date.now() + DB_CONSTANTS.RESERVATION_TIMEOUT_MS);
    
    const reservation = {
      eventId: reservationData.eventId,
      userId: reservationData.userId,
      userName: reservationData.userName,
      seats: reservationData.seats,
      createdAt: new Date(),
      expiresAt,
    };

    const docRef = await db.collection(COLLECTIONS.RESERVATIONS).add(reservation);
    return { id: docRef.id, ...reservation };
  }

  /**
   * Get active reservations for an event
   */
  static async getActiveByEvent(eventId) {
    const now = new Date();
    const snapshot = await db.collection(COLLECTIONS.RESERVATIONS)
      .where('eventId', '==', eventId)
      .where('expiresAt', '>', now)
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Delete user's reservations for an event
   */
  static async deleteByUserAndEvent(userId, eventId) {
    const snapshot = await db.collection(COLLECTIONS.RESERVATIONS)
      .where('eventId', '==', eventId)
      .where('userId', '==', userId)
      .get();

    if (snapshot.empty) return [];

    const batch = db.batch();
    const seats = [];
    
    snapshot.docs.forEach(doc => {
      seats.push(...doc.data().seats);
      batch.delete(doc.ref);
    });

    await batch.commit();
    return seats;
  }

  /**
   * Clean up expired reservations
   */
  static async cleanupExpired() {
    const now = new Date();
    const snapshot = await db.collection(COLLECTIONS.RESERVATIONS)
      .where('expiresAt', '<=', now)
      .get();

    if (snapshot.empty) return { count: 0, released: {} };

    const batch = db.batch();
    const released = {}; // eventId -> seats[]

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (!released[data.eventId]) released[data.eventId] = [];
      released[data.eventId].push(...data.seats);
      batch.delete(doc.ref);
    });

    await batch.commit();
    return { count: snapshot.size, released };
  }
}

export default ReservationModel;
