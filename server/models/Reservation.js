/**
 * Reservation Model - Sequelize Definition
 * Tracks user event enrollments
 */
// reservation model (for reservations table)
import { DataTypes } from 'sequelize'; // datatypes for fields
import { sequelize } from '../config/database.js'; // db connection

// define reservation model
const Reservation = sequelize.define('Reservation', {
  id: {
    type: DataTypes.UUID, // unique id
    defaultValue: DataTypes.UUIDV4, // auto uuid
    primaryKey: true // primary key
  },
  userId: {
    type: DataTypes.UUID, // user id
    allowNull: false, // required
    references: {
      model: 'Users', // ref users
      key: 'id'
    }
  },
  eventId: {
    type: DataTypes.UUID, // event id
    allowNull: false, // required
    references: {
      model: 'Events', // ref events
      key: 'id'
    }
  },
  userName: {
    type: DataTypes.STRING, // user name
    allowNull: false // required
  },
  userEmail: {
    type: DataTypes.STRING, // user email
    allowNull: false // required
  },
  seats: {
    type: DataTypes.JSON, // array of seats
    defaultValue: [] // default empty
  },
  seatCount: {
    type: DataTypes.INTEGER, // number of seats
    defaultValue: 1 // default 1
  },
  status: {
    type: DataTypes.ENUM('confirmed', 'cancelled', 'waitlisted'), // status
    defaultValue: 'confirmed' // default
  },
  expiresAt: {
    type: DataTypes.DATE, // when expires
    allowNull: true // optional
  },
  enrolledAt: {
    type: DataTypes.DATE, // when enrolled
    defaultValue: DataTypes.NOW // default now
  }
}, {
  timestamps: true, // auto add createdAt/updatedAt
  underscored: false, // camelCase fields
  indexes: [
    {
      fields: ['eventId', 'expiresAt'] // for queries
    },
    {
      fields: ['eventId', 'userId'] // for queries
    },
    {
      fields: ['userId'] // for queries
    }
  ]
});

export default Reservation; // export model
