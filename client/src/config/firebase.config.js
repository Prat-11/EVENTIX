/**
 * firebase.config.js — Firebase Client Configuration
 * ─────────────────────────────────────────────────────────────────────────────
 * Firebase Authentication for client-side
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Fetch Firebase config from server
let firebaseConfig = null;
let auth = null;

export async function initializeFirebase() {
  try {
    const response = await fetch('http://localhost:3000/api/config/firebase');
    const data = await response.json();
    
    if (data.success) {
      firebaseConfig = data.data;
      const app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      console.log('✅ Firebase initialized on client');
      return auth;
    }
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
  }
  return null;
}

export {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
};
