/**
 * User Model - Schema Definition
 * Defines the structure of user data in MongoDB
 */
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  firebaseUid: {
    type: String,
    default: null
  },
  avatar: {
    type: String,
    default: function() {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=6366f1&color=fff`;
    }
  },
  phone: {
    type: String,
    default: ''
  },
  dob: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  interests: {
    type: [String],
    default: []
  },
  notifications: {
    type: String,
    enum: ['all', 'important', 'none'],
    default: 'all'
  },
  blocked: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  blockedAt: Date,
  unblockedAt: Date
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Indexes for faster queries
userSchema.index({ email: 1 });
userSchema.index({ firebaseUid: 1 });

const User = mongoose.model('User', userSchema);

export default User;
