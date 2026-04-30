/**
 * Event.model.js — Event Data Model
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles all event-related database operations
 */

import { db, admin } from '../config/firebase.config.js';
import { COLLECTIONS } from '../config/database.config.js';

class EventModel {
  /**
   * Create a new event
   */
  static async create(eventData) {
    const newEvent = {
      organizerName: eventData.organizerName,
      organizerId: eventData.organizerId,
      eventName: eventData.eventName,
      date: eventData.date,
      description: eventData.description || '',
      category: eventData.category || 'general',
      membersRequired: parseInt(eventData.membersRequired, 10),
      enrolledMembers: 0,
      enrollments: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection(COLLECTIONS.EVENTS).add(newEvent);
    return { id: docRef.id, ...newEvent };
  }

  /**
   * Find event by ID
   */
  static async findById(eventId) {
    const doc = await db.collection(COLLECTIONS.EVENTS).doc(eventId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Get all events
   */
  static async findAll() {
    const snapshot = await db.collection(COLLECTIONS.EVENTS)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Delete event
   */
  static async delete(eventId) {
    await db.collection(COLLECTIONS.EVENTS).doc(eventId).delete();
    return true;
  }

  /**
   * Enroll user in event (with transaction for concurrency)
   */
  static async enrollUser(eventId, enrollmentData) {
    const eventRef = db.collection(COLLECTIONS.EVENTS).doc(eventId);

    return await db.runTransaction(async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      
      if (!eventDoc.exists) {
        throw Object.assign(new Error('Event not found'), { status: 404 });
      }

      const event = eventDoc.data();

      // Check if user already enrolled
      if (event.enrollments?.some(e => e.userId === enrollmentData.userId)) {
        throw Object.assign(new Error('Already enrolled in this event'), { status: 400 });
      }

      // Check capacity
      const spotsLeft = event.membersRequired - event.enrolledMembers;
      if (spotsLeft < enrollmentData.seatCount) {
        throw Object.assign(
          new Error(`Only ${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`),
          { status: 400 }
        );
      }

      // Check seat conflicts
      if (enrollmentData.seats && enrollmentData.seats.length > 0) {
        const takenSeats = new Set(
          (event.enrollments || [])
            .map(e => e.seats || [e.seat])
            .flat()
            .filter(Boolean)
        );
        
        const conflict = enrollmentData.seats.find(s => takenSeats.has(s));
        if (conflict) {
          throw Object.assign(
            new Error(`Seat ${conflict} already taken — pick another`),
            { status: 400 }
          );
        }
      }

      // Create enrollment record
      const enrollment = {
        userId: enrollmentData.userId,
        userName: enrollmentData.userName,
        userEmail: enrollmentData.userEmail,
        seats: enrollmentData.seats || null,
        seatCount: enrollmentData.seatCount,
        enrolledAt: new Date().toISOString(),
      };

      // Update event
      transaction.update(eventRef, {
        enrolledMembers: admin.firestore.FieldValue.increment(enrollmentData.seatCount),
        enrollments: admin.firestore.FieldValue.arrayUnion(enrollment),
      });

      return enrollment;
    });
  }

  /**
   * Get user bookings
   */
  static async getUserBookings(userId) {
    const snapshot = await db.collection(COLLECTIONS.EVENTS).get();
    
    return snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(ev => (ev.enrollments || []).some(e => e.userId === userId))
      .map(ev => {
        const enrollment = (ev.enrollments || []).find(e => e.userId === userId);
        return {
          eventId: ev.id,
          eventName: ev.eventName,
          organizerName: ev.organizerName,
          date: ev.date,
          category: ev.category || 'general',
          seats: enrollment?.seats || (enrollment?.seat ? [enrollment.seat] : []),
          seatCount: enrollment?.seatCount || 1,
          enrolledAt: enrollment?.enrolledAt,
          membersRequired: ev.membersRequired,
          enrolledMembers: ev.enrolledMembers,
        };
      });
  }
}

export default EventModel;
