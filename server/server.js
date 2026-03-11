import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const app = express();
const PORT = 5000;

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync('./fireb-sdk.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Middleware
app.use(cors());
app.use(express.json());

// ============ USER ROUTES ============

// Register new user
app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required' 
      });
    }
    
    // Check if user already exists
    const existingUser = await db.collection('users')
      .where('email', '==', email)
      .get();
    
    if (!existingUser.empty) {
      return res.status(400).json({ 
        success: false, 
        error: 'User already exists' 
      });
    }
    
    // Create user (in production, hash the password!)
    const newUser = {
      name,
      email,
      password, // WARNING: In production, use bcrypt to hash passwords!
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=e13b2e&color=fff&rounded=true`,
      phone: '',
      dob: '',
      location: '',
      bio: '',
      interests: [],
      notifications: 'all',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('users').add(newUser);
    
    res.status(201).json({ 
      success: true, 
      data: { 
        id: docRef.id, 
        name, 
        email,
        avatar: newUser.avatar
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Login user
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }
    
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .where('password', '==', password)
      .get();
    
    if (usersSnapshot.empty) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    
    res.json({ 
      success: true, 
      data: { 
        id: userDoc.id, 
        name: userData.name, 
        email: userData.email,
        avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&size=128&background=e13b2e&color=fff&rounded=true`
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user profile
app.get('/api/users/:id', async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    const userData = userDoc.data();
    // Don't send password
    delete userData.password;
    
    res.json({ 
      success: true, 
      data: { 
        id: userDoc.id, 
        ...userData
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user profile
app.put('/api/users/:id', async (req, res) => {
  try {
    const { name, avatar, phone, dob, location, bio, interests, notifications } = req.body;
    
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (name) updateData.name = name;
    if (avatar) updateData.avatar = avatar;
    if (phone !== undefined) updateData.phone = phone;
    if (dob !== undefined) updateData.dob = dob;
    if (location !== undefined) updateData.location = location;
    if (bio !== undefined) updateData.bio = bio;
    if (interests) updateData.interests = interests;
    if (notifications) updateData.notifications = notifications;
    
    await db.collection('users').doc(req.params.id).update(updateData);
    
    res.json({ 
      success: true, 
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ EVENT ROUTES ============

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    const eventsSnapshot = await db.collection('events').get();
    const events = [];
    
    eventsSnapshot.forEach(doc => {
      events.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new event
app.post('/api/events', async (req, res) => {
  try {
    const { organizerName, eventName, date, membersRequired } = req.body;
    
    if (!organizerName || !eventName || !date || !membersRequired) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required' 
      });
    }
    
    const newEvent = {
      organizerName,
      eventName,
      date,
      membersRequired: parseInt(membersRequired),
      enrolledMembers: 0,
      enrollments: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('events').add(newEvent);
    
    res.status(201).json({ 
      success: true, 
      data: { id: docRef.id, ...newEvent } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Enroll in event (with user authentication)
app.post('/api/events/:id/enroll', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User must be logged in to enroll' 
      });
    }
    
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    const userData = userDoc.data();
    
    const eventRef = db.collection('events').doc(id);
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Event not found' 
      });
    }
    
    const eventData = eventDoc.data();
    
    // Check if already enrolled
    if (eventData.enrollments && eventData.enrollments.some(e => e.userId === userId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Already enrolled in this event' 
      });
    }
    
    if (eventData.enrolledMembers >= eventData.membersRequired) {
      return res.status(400).json({ 
        success: false, 
        error: 'Event is full' 
      });
    }
    
    const enrollment = {
      userId,
      userName: userData.name,
      userEmail: userData.email,
      enrolledAt: new Date().toISOString()
    };
    
    await eventRef.update({
      enrolledMembers: admin.firestore.FieldValue.increment(1),
      enrollments: admin.firestore.FieldValue.arrayUnion(enrollment)
    });
    
    res.json({ 
      success: true, 
      message: 'Enrollment successful' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete event
app.delete('/api/events/:id', async (req, res) => {
  try {
    await db.collection('events').doc(req.params.id).delete();
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});