const API = 'http://localhost:3000/api';

// Check if user is logged in, if not redirect to login page
let currentUser = null, authToken = null;
try {
  const raw = localStorage.getItem('user');
  if (raw) {
    currentUser = JSON.parse(raw);
    authToken = currentUser.token;
  } else {
    window.location.href = 'login.html';
  }
} catch (_) {
  window.location.href = 'login.html';
}

// Helper function to add auth token to requests
const H = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${authToken}`,
});

// Custom cursor that follows your mouse
const cur = document.getElementById('cursor');
const ring = document.getElementById('cursor-ring');
let mx = 0, my = 0;

document.addEventListener('mousemove', (e) => {
  mx = e.clientX;
  my = e.clientY;
  cur.style.left = mx + 'px';
  cur.style.top = my + 'px';
  ring.style.left = mx + 'px';
  ring.style.top = my + 'px';
});

// Make cursor bigger when hovering over clickable things
document.querySelectorAll('a, button, .booking-card').forEach((el) => {
  el.addEventListener('mouseenter', () => {
    cur.style.width = '20px';
    cur.style.height = '20px';
    ring.style.width = '60px';
    ring.style.height = '60px';
  });
  el.addEventListener('mouseleave', () => {
    cur.style.width = '8px';
    cur.style.height = '8px';
    ring.style.width = '40px';
    ring.style.height = '40px';
  });
});

// Logout button functionality
document.getElementById('logoutBtn').addEventListener('click', async () => {
  if (!confirm('Are you sure you want to logout?')) return;
  try {
    await fetch(`${API}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: H(),
    });
  } catch (_) {}
  localStorage.removeItem('user');
  window.location.href = 'login.html';
});

// Convert seat ID like "A1" into readable format
function parseSeat(seatId) {
  const match = seatId.match(/^([A-Z]+)(\d+)$/);
  if (match) {
    return {
      row: match[1],
      number: match[2],
      display: `Row ${match[1]} • Seat ${match[2]}`,
    };
  }
  return {
    row: '',
    number: seatId,
    display: seatId,
  };
}

// Determine seat type based on row (A=VIP, B=Premium, rest=Regular)
function getSeatClass(row) {
  if (row === 'A') return 'vip';
  if (row === 'B') return 'premium';
  return '';
}

// Format date to look nice (e.g., "Jan 15, 2025")
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Format date with time (e.g., "Jan 15, 2025, 10:30 AM")
function formatDateTime(dateStr) {
  const date = new Date(dateStr);
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return date.toLocaleDateString('en-US', options);
}

// Check if event date is in the future
function isUpcoming(dateStr) {
  return new Date(dateStr) > new Date();
}

// Fetch all bookings for current user from server
async function loadBookings() {
  try {
    const res = await fetch(`${API}/users/${currentUser.id}/bookings`, {
      headers: H(),
    });
    const data = await res.json();

    if (!data.success) {
      showToast(data.error || 'Failed to load bookings', 'error');
      return;
    }

    const bookings = data.data || [];
    renderBookings(bookings);
  } catch (err) {
    console.error('Error loading bookings:', err);
    showToast('Server error while loading bookings', 'error');
    document.getElementById('bookingsList').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Error loading bookings</h3>
        <p>Please try again later</p>
      </div>
    `;
  }
}

// Display all bookings on the page
function renderBookings(bookings) {
  const container = document.getElementById('bookingsList');
  const emptyState = document.getElementById('emptyState');

  // If no bookings, show empty state message
  if (!bookings || bookings.length === 0) {
    container.style.display = 'none';
    emptyState.style.display = 'flex';
    return;
  }

  container.style.display = 'grid';
  emptyState.style.display = 'none';

  // Create HTML for each booking card
  container.innerHTML = bookings
    .map((booking, index) => {
      const upcoming = isUpcoming(booking.date);
      const percentage = Math.min(
        Math.round((booking.enrolledMembers / booking.membersRequired) * 100),
        100
      );
      const isFull = booking.enrolledMembers >= booking.membersRequired;

      // Get seat information
      const seats = booking.seats || [];
      const seatsHtml = seats
        .map((seatId) => {
          const seat = parseSeat(seatId);
          const seatClass = getSeatClass(seat.row);
          return `<div class="seat-badge ${seatClass}" title="${seat.display}">${seatId}</div>`;
        })
        .join('');

      return `
        <div class="booking-card" style="animation-delay: ${index * 0.1}s">
          <div class="booking-header">
            <div class="event-category">${booking.category || 'general'}</div>
            <h3 class="event-name">${booking.eventName}</h3>
            <div class="event-organizer">
              <span>👤</span>
              <span>by ${booking.organizerName}</span>
            </div>
          </div>
          
          <div class="booking-body">
            <div class="booking-info">
              <div class="info-row">
                <span class="info-icon">📅</span>
                <span class="info-label">Date:</span>
                <span class="info-value">${formatDate(booking.date)}</span>
              </div>
              <div class="info-row">
                <span class="info-icon">🎫</span>
                <span class="info-label">Seats:</span>
                <span class="info-value">${booking.seatCount || seats.length} seat${(booking.seatCount || seats.length) > 1 ? 's' : ''}</span>
              </div>
              <div class="info-row">
                <span class="info-icon">⏰</span>
                <span class="info-label">Booked:</span>
                <span class="info-value">${booking.enrolledAt ? formatDateTime(booking.enrolledAt) : 'N/A'}</span>
              </div>
            </div>

            ${seats.length > 0 ? `
              <div class="seats-container">
                <div class="seats-label">Your Seats</div>
                <div class="seats-grid">
                  ${seatsHtml}
                </div>
              </div>
            ` : ''}

            <div class="capacity-bar">
              <div class="capacity-label">
                <span>Event Capacity</span>
                <span>${booking.enrolledMembers}/${booking.membersRequired}</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill ${isFull ? 'full' : ''}" style="width: ${percentage}%"></div>
              </div>
            </div>

            <div class="booking-footer">
              <span class="booking-date">${formatDate(booking.date)}</span>
              <span class="booking-status ${upcoming ? 'status-upcoming' : 'status-past'}">
                ${upcoming ? 'Upcoming' : 'Past'}
              </span>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  // Setup filter buttons
  setupFilters(bookings);
}

// Filter bookings by All/Upcoming/Past
function setupFilters(bookings) {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.booking-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Update which button looks active
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      // Show/hide cards based on filter
      cards.forEach((card, index) => {
        const booking = bookings[index];
        let show = true;

        if (filter === 'upcoming') {
          show = isUpcoming(booking.date);
        } else if (filter === 'past') {
          show = !isUpcoming(booking.date);
        }

        card.style.display = show ? 'block' : 'none';
      });
    });
  });
}

// Show notification message at bottom right
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  toast.innerHTML = `
    <span style="font-size: 1.2rem; font-weight: 700;">${icons[type] || icons.info}</span>
    <span>${msg}</span>
  `;

  container.appendChild(toast);

  // Auto-remove toast after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Page load animations
gsap.from('.page-title', { opacity: 0, y: 30, duration: 0.8, ease: 'power3.out', delay: 0.1 });
gsap.from('.page-sub', { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out', delay: 0.25 });
gsap.from('.section-title', { opacity: 0, x: -20, duration: 0.6, ease: 'power2.out', delay: 0.5 });

// Start loading bookings when page loads
loadBookings();
