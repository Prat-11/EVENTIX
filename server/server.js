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

// Enroll in event
app.post('/api/events/:id/enroll', async (req, res) => {
  try {
    const { id } = req.params;
    const { userName, userEmail } = req.body;
    
    if (!userName || !userEmail) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and email are required' 
      });
    }
    
    const eventRef = db.collection('events').doc(id);
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Event not found' 
      });
    }
    
    const eventData = eventDoc.data();
    
    if (eventData.enrolledMembers >= eventData.membersRequired) {
      return res.status(400).json({ 
        success: false, 
        error: 'Event is full' 
      });
    }
    
    const enrollment = {
      userName,
      userEmail,
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
