/**
 * Auth.model.js — Authentication Model (Client)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import APIService from '../utils/api.service.js';

// Firebase imports - will be initialized later
let auth = null;
let signInWithEmailAndPassword = null;
let createUserWithEmailAndPassword = null;
let signOut = null;

// Try to import Firebase (optional)
try {
  const firebaseModule = await import('../config/firebase.config.js');
  auth = firebaseModule.auth;
  signInWithEmailAndPassword = firebaseModule.signInWithEmailAndPassword;
  createUserWithEmailAndPassword = firebaseModule.createUserWithEmailAndPassword;
  signOut = firebaseModule.signOut;
} catch (error) {
  console.warn('Firebase not available, using fallback authentication');
}

class AuthModel {
  /**
   * Register with Firebase Auth + Backend
   */
  static async register(name, email, password) {
    try {
      let firebaseIdToken = null;

      // Try Firebase Auth if available
      if (auth && createUserWithEmailAndPassword) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          firebaseIdToken = await userCredential.user.getIdToken();
        } catch (firebaseError) {
          console.warn('Firebase registration failed, using fallback:', firebaseError.message);
        }
      }

      // Register in backend (with or without Firebase token)
      const response = await APIService.register({
        name,
        email,
        password,
        firebaseIdToken,
      });

      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login with Firebase Auth + Backend
   */
  static async login(email, password) {
    try {
      let firebaseIdToken = null;

      // Try Firebase Auth if available
      if (auth && signInWithEmailAndPassword) {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          firebaseIdToken = await userCredential.user.getIdToken();
        } catch (firebaseError) {
          console.warn('Firebase login failed, using fallback:', firebaseError.message);
        }
      }

      // Login to backend (with or without Firebase token)
      const response = await APIService.login({
        email,
        password,
        firebaseIdToken,
      });

      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Logout
   */
  static async logout() {
    try {
      // Sign out from Firebase if available
      if (auth && signOut) {
        try {
          await signOut(auth);
        } catch (firebaseError) {
          console.warn('Firebase logout failed:', firebaseError.message);
        }
      }

      // Logout from backend
      await APIService.logout();
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Get current user from localStorage
   */
  static getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Save user to localStorage
   */
  static saveUser(userData) {
    localStorage.setItem('user', JSON.stringify(userData));
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated() {
    const user = this.getCurrentUser();
    return user && user.token;
  }

  /**
   * Check if user is admin
   */
  static isAdmin() {
    const user = this.getCurrentUser();
    return user && user.isAdmin;
  }
}

export default AuthModel;
