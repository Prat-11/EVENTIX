/**
 * api.service.js — API Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized API communication
 */

const API_BASE = 'http://localhost:3000/api';

class APIService {
  /**
   * Make HTTP request
   */
  static async request(endpoint, options = {}) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = user.token;

    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    return await response.json();
  }

  // Auth endpoints
  static async register(data) {
    return this.request('/auth/register', { method: 'POST', body: data });
  }

  static async login(data) {
    return this.request('/auth/login', { method: 'POST', body: data });
  }

  static async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  static async getMe() {
    return this.request('/auth/me');
  }

  // User endpoints
  static async getUser(id) {
    return this.request(`/users/${id}`);
  }

  static async updateUser(id, data) {
    return this.request(`/users/${id}`, { method: 'PUT', body: data });
  }

  static async getUserBookings(id) {
    return this.request(`/users/${id}/bookings`);
  }

  // Event endpoints
  static async getEvents() {
    return this.request('/events');
  }

  static async createEvent(data) {
    return this.request('/events', { method: 'POST', body: data });
  }

  static async enrollInEvent(eventId, data) {
    return this.request(`/events/${eventId}/enroll`, { method: 'POST', body: data });
  }

  static async reserveSeats(eventId, seats) {
    return this.request(`/events/${eventId}/reserve`, { method: 'POST', body: { seats } });
  }

  static async clearReservation(eventId) {
    return this.request(`/events/${eventId}/reserve`, { method: 'DELETE' });
  }

  static async getReservations(eventId) {
    return this.request(`/events/${eventId}/reservations`);
  }

  static async deleteEvent(eventId) {
    return this.request(`/events/${eventId}`, { method: 'DELETE' });
  }

  // Admin endpoints
  static async getAdminUsers() {
    return this.request('/admin/users');
  }

  static async getAdminEvents() {
    return this.request('/admin/events');
  }

  static async blockUser(id) {
    return this.request(`/admin/users/${id}/block`, { method: 'PUT' });
  }

  static async unblockUser(id) {
    return this.request(`/admin/users/${id}/unblock`, { method: 'PUT' });
  }

  static async deleteUser(id) {
    return this.request(`/admin/users/${id}`, { method: 'DELETE' });
  }

  static async makeAdmin(email) {
    return this.request('/admin/make-admin', { method: 'POST', body: { email } });
  }
}

export default APIService;
