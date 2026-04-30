/**
 * Signup.controller.js — Signup Controller (Client)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import AuthModel from '../models/Auth.model.js';

class SignupController {
  constructor() {
    this.form = document.getElementById('signupForm');
    this.nameInput = document.getElementById('name');
    this.emailInput = document.getElementById('email');
    this.passwordInput = document.getElementById('password');
    this.confirmPasswordInput = document.getElementById('confirmPassword');
    this.submitBtn = document.getElementById('submitBtn');
    this.errorDiv = document.getElementById('err');

    this.init();
  }

  init() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    this.hideError();

    const name = this.nameInput.value.trim();
    const email = this.emailInput.value.trim();
    const password = this.passwordInput.value;
    const confirmPassword = this.confirmPasswordInput.value;

    // Validation
    if (password !== confirmPassword) {
      this.showError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      this.showError('Password must be at least 6 characters');
      return;
    }

    this.setLoading(true);

    try {
      const response = await AuthModel.register(name, email, password);

      if (response.success) {
        AuthModel.saveUser(response.data);
        
        // Animate out and redirect
        if (window.gsap) {
          gsap.to('body', {
            opacity: 0,
            duration: 0.4,
            onComplete: () => {
              window.location.href = response.data.isAdmin ? 'admin.html' : 'currevents.html';
            },
          });
        } else {
          window.location.href = response.data.isAdmin ? 'admin.html' : 'currevents.html';
        }
      } else {
        this.showError(response.error);
      }
    } catch (error) {
      this.showError('Cannot reach server');
    } finally {
      this.setLoading(false);
    }
  }

  showError(message) {
    this.errorDiv.textContent = message;
    this.errorDiv.style.display = 'block';
    
    if (window.gsap) {
      gsap.from(this.errorDiv, { x: -8, duration: 0.3, ease: 'power2.out' });
    }
  }

  hideError() {
    this.errorDiv.style.display = 'none';
  }

  setLoading(loading) {
    this.submitBtn.disabled = loading;
    
    if (loading) {
      this.submitBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite">
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".3"/>
          <path d="M21 12a9 9 0 00-9-9"/>
        </svg> Creating…
      `;
    } else {
      this.submitBtn.innerHTML = '→ Create Account';
    }
  }
}

export default SignupController;
