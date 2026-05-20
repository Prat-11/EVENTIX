import { DataTypes } from 'sequelize'; 
import { sequelize } from '../config/database.js'; 

// define event model
const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.UUID, 
    defaultValue: DataTypes.UUIDV4, 
    primaryKey: true 
  },
  organizerName: {
    type: DataTypes.STRING, 
    allowNull: false 
  },
  organizerId: {
    type: DataTypes.UUID, 
    allowNull: false, 
    references: {
      model: 'Users', 
      key: 'id'
    }
  },
  eventName: {
    type: DataTypes.STRING, 
    allowNull: false, 
    trim: true 
  },
  date: {
    type: DataTypes.DATE, 
    allowNull: false 
  },
  description: {
    type: DataTypes.TEXT, 
    allowNull: true 
  },
  category: {
    type: DataTypes.ENUM('music', 'tech', 'sports', 'food', 'general'), // type
    defaultValue: 'general' 
  },
  image: {
    type: DataTypes.STRING, 
    allowNull: true 
  },
  imagePublicId: {
    type: DataTypes.STRING, 
    allowNull: true 
  },
  membersRequired: {
    type: DataTypes.INTEGER, 
    allowNull: false, 
    validate: {
      min: 1 
    }
  },
  enrolledMembers: {
    type: DataTypes.INTEGER, 
    defaultValue: 0 
  },
  location: {
    type: DataTypes.STRING, 
    allowNull: true 
  },
  status: {
    type: DataTypes.ENUM('upcoming', 'ongoing', 'completed', 'cancelled'), // status
    defaultValue: 'upcoming' 
  }
}, {
  timestamps: true, 
  underscored: false 
});

export default Event; 
