/**
 * Event Model - Schema Definition
 * Defines the structure of event data in MongoDB
 */
import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: String,
  userEmail: String,
  seats: [String],
  seatCount: {
    type: Number,
    default: 1
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const eventSchema = new mongoose.Schema({
  organizerName: {
    type: String,
    required: true
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventName: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true
  },
  date: {
    type: String,
    required: [true, 'Event date is required']
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['music', 'tech', 'sports', 'food', 'general'],
    default: 'general'
  },
  membersRequired: {
    type: Number,
    required: [true, 'Members required is mandatory'],
    min: [1, 'At least 1 member required']
  },
  enrolledMembers: {
    type: Number,
    default: 0
  },
  enrollments: [enrollmentSchema]
}, {
  timestamps: true
});

// Indexes for faster queries
eventSchema.index({ organizerId: 1 });
eventSchema.index({ date: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ createdAt: -1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;
