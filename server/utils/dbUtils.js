/**
 * Database Utilities
 * Helper functions for database operations
 */
import { sequelize } from '../config/database.js';
import { User, Event, Reservation } from '../models/index.js';

// Sync all models with database
export const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force, alter: !force });
    console.log('✅ Database sync complete');
  } catch (error) {
    console.error('Database sync error:', error.message);
    throw error;
  }
};

// Seed database with sample data
export const seedDatabase = async () => {
  try {
    // Check if data already exists
    const userCount = await User.count();
    if (userCount > 0) {
      console.log('Database already seeded, skipping...');
      return;
    }

    // Create sample users
    const users = await User.bulkCreate([
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        location: 'San Francisco, CA',
        interests: ['tech', 'music']
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
        location: 'New York, NY',
        interests: ['sports', 'food']
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        isAdmin: true,
        interests: ['tech', 'events']
      }
    ]);

    console.log(`✅ Created ${users.length} users`);

    // Create sample events
    const events = await Event.bulkCreate([
      {
        eventName: 'Tech Conference 2026',
        organizerId: users[0].id,
        organizerName: users[0].name,
        date: new Date('2026-06-15'),
        description: 'Annual technology conference',
        category: 'tech',
        membersRequired: 100,
        location: 'San Francisco Convention Center',
        status: 'upcoming'
      },
      {
        eventName: 'Summer Music Festival',
        organizerId: users[1].id,
        organizerName: users[1].name,
        date: new Date('2026-07-20'),
        description: 'Live music performances',
        category: 'music',
        membersRequired: 500,
        location: 'Central Park',
        status: 'upcoming'
      }
    ]);

    console.log(`✅ Created ${events.length} events`);
  } catch (error) {
    console.error('Database seeding error:', error.message);
    throw error;
  }
};

// Clear all data
export const clearDatabase = async () => {
  try {
    await sequelize.truncate({ cascade: true });
    console.log('✅ Database cleared');
  } catch (error) {
    console.error('Database clear error:', error.message);
    throw error;
  }
};

// Get database stats
export const getDatabaseStats = async () => {
  try {
    const stats = {
      users: await User.count(),
      events: await Event.count(),
      reservations: await Reservation.count(),
      timestamp: new Date().toISOString()
    };
    return stats;
  } catch (error) {
    console.error('Database stats error:', error.message);
    throw error;
  }
};
