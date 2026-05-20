/**
 * Event Model - Sequelize Definition
 * Defines the structure of event data in PostgreSQL
 */
// event model (for events table)
import { DataTypes } from 'sequelize'; // datatypes for fields
import { sequelize } from '../config/database.js'; // db connection

// define event model
const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.UUID, // unique id
    defaultValue: DataTypes.UUIDV4, // auto uuid
    primaryKey: true // primary key
  },
  organizerName: {
    type: DataTypes.STRING, // name of organizer
    allowNull: false // required
  },
  organizerId: {
    type: DataTypes.UUID, // user id
    allowNull: false, // required
    references: {
      model: 'Users', // ref users
      key: 'id'
    }
  },
  eventName: {
    type: DataTypes.STRING, // event name
    allowNull: false, // required
    trim: true // remove spaces
  },
  date: {
    type: DataTypes.DATE, // event date
    allowNull: false // required
  },
  description: {
    type: DataTypes.TEXT, // event desc
    allowNull: true // optional
  },
  category: {
    type: DataTypes.ENUM('music', 'tech', 'sports', 'food', 'general'), // type
    defaultValue: 'general' // default
  },
  image: {
    type: DataTypes.STRING, // image url
    allowNull: true // optional
  },
  imagePublicId: {
    type: DataTypes.STRING, // cloudinary id
    allowNull: true // optional
  },
  membersRequired: {
    type: DataTypes.INTEGER, // total members
    allowNull: false, // required
    validate: {
      min: 1 // at least 1
    }
  },
  enrolledMembers: {
    type: DataTypes.INTEGER, // joined
    defaultValue: 0 // default 0
  },
  location: {
    type: DataTypes.STRING, // event location
    allowNull: true // optional
  },
  status: {
    type: DataTypes.ENUM('upcoming', 'ongoing', 'completed', 'cancelled'), // status
    defaultValue: 'upcoming' // default
  }
}, {
  timestamps: true, // auto add createdAt/updatedAt
  underscored: false // camelCase fields
});

export default Event; // export model
