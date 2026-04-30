/**
 * firebase.config.js — Firebase Admin & Client SDK Configuration
 * ─────────────────────────────────────────────────────────────────────────────
 * Initializes Firebase Admin SDK for server-side operations (Firestore, Auth)
 * and exports Firebase client config for frontend authentication
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE ADMIN SDK (Server-side)
// ─────────────────────────────────────────────────────────────────────────────
const serviceAccountPath = join(__dirname, '../../fireb-sdk.json');

let db, auth;

if (existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  db = admin.firestore();
  auth = admin.auth();
  console.log('✅  Firebase Admin SDK initialized');
} else {
  console.warn('⚠️  fireb-sdk.json not found - Creating temporary service account');
  
  // Create a minimal service account from environment variables
  // This allows basic functionality without the full service account key
  try {
    // For now, we'll create a mock credential that won't work with Firestore
    // but will allow the server to start
    console.log('⚠️  WARNING: Server running in LIMITED MODE');
    console.log('📝  To enable full functionality:');
    console.log('   1. Go to Firebase Console → Project Settings → Service Accounts');
    console.log('   2. Generate new private key');
    console.log('   3. Save as server/fireb-sdk.json');
    console.log('   4. Restart server');
    
    // Don't initialize Firebase - use fallback authentication only
    db = null;
    auth = null;
  } catch (error) {
    console.error('❌  Firebase initialization failed:', error.message);
    db = null;
    auth = null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE CLIENT CONFIG (For frontend)
// ─────────────────────────────────────────────────────────────────────────────
// Replace these with your actual Firebase project config from Firebase Console
const firebaseClientConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: process.env.FIREBASE_APP_ID || "YOUR_APP_ID"
};

export { admin, db, auth, firebaseClientConfig };
