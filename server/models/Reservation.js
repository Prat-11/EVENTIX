/**
 * Reservation Model - Schema Definition
 * Defines the structure of seat reservation data in MongoDB
 */
import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  seats: {
    type: [String],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
reservationSchema.index({ eventId: 1, expiresAt: 1 });
reservationSchema.index({ eventId: 1, userId: 1 });
reservationSchema.index({ userId: 1 });

const Reservation = mongoose.model('Reservation', reservationSchema);

export default Reservation;
