/**
 * User.model.js — User Data Model
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles all user-related database operations
 */

import { db, admin } from '../config/firebase.config.js';
import { COLLECTIONS } from '../config/database.config.js';

class UserModel {
  /**
   * Create a new user
   */
  static async create(userData) {
    const newUser = {
      name: userData.name,
      email: userData.email,
      password: userData.password, // Already hashed
      avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&size=128&background=e13b2e&color=fff&rounded=true`,
      phone: userData.phone || '',
      dob: userData.dob || '',
      location: userData.location || '',
      bio: userData.bio || '',
      interests: userData.interests || [],
      notifications: userData.notifications || 'all',
      blocked: false,
      isAdmin: userData.email === 'admin@eventix.com',
      firebaseUid: userData.firebaseUid || null, // Firebase Auth UID
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection(COLLECTIONS.USERS).add(newUser);
    return { id: docRef.id, ...newUser };
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const snapshot = await db.collection(COLLECTIONS.USERS)
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Find user by Firebase UID
   */
  static async findByFirebaseUid(firebaseUid) {
    const snapshot = await db.collection(COLLECTIONS.USERS)
      .where('firebaseUid', '==', firebaseUid)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Find user by ID
   */
  static async findById(userId) {
    const doc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Update user
   */
  static async update(userId, updateData) {
    const update = {
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection(COLLECTIONS.USERS).doc(userId).update(update);
    return this.findById(userId);
  }

  /**
   * Delete user
   */
  static async delete(userId) {
    await db.collection(COLLECTIONS.USERS).doc(userId).delete();
    return true;
  }

  /**
   * Get all users (admin only)
   */
  static async findAll() {
    const snapshot = await db.collection(COLLECTIONS.USERS).get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      delete data.password; // Never return passwords
      return { id: doc.id, ...data };
    });
  }

  /**
   * Block/Unblock user
   */
  static async setBlockStatus(userId, blocked) {
    const update = {
      blocked,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (blocked) {
      update.blockedAt = admin.firestore.FieldValue.serverTimestamp();
    } else {
      update.unblockedAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await db.collection(COLLECTIONS.USERS).doc(userId).update(update);
    return this.findById(userId);
  }

  /**
   * Make user admin
   */
  static async makeAdmin(userId) {
    await db.collection(COLLECTIONS.USERS).doc(userId).update({
      isAdmin: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return this.findById(userId);
  }
}

export default UserModel;
