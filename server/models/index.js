import User from './User.js';
import Event from './Event.js';
import Reservation from './Reservation.js';

// Set up associations
User.hasMany(Event, {
  foreignKey: 'organizerId',
  as: 'organizedEvents'
});

Event.belongsTo(User, {
  foreignKey: 'organizerId',
  as: 'organizer'
});

User.hasMany(Reservation, {
  foreignKey: 'userId',
  as: 'reservations'
});

Reservation.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Event.hasMany(Reservation, {
  foreignKey: 'eventId',
  as: 'enrollments'
});

Reservation.belongsTo(Event, {
  foreignKey: 'eventId',
  as: 'event'
});

export { User, Event, Reservation };
