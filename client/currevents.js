/**
 * currevents.js — Events page
 * GSAP animations + Socket.io live concurrency + Theatre seat picker (3-step)
 */
const API = 'http://localhost:3000/api';
gsap.registerPlugin(ScrollTrigger);

// ── Auth ──────────────────────────────────────────────────────────────────────
let user = null, token = null;
try { const r = localStorage.getItem('user'); if (r) { user = JSON.parse(r); token = user.token; } } catch(_) {}
const H = () => ({ 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}) });

// ── Cursor ────────────────────────────────────────────────────────────────────
const cur  = document.getElementById('cur');
const ring = document.getElementById('cur-ring');
let mx=0,my=0,rx=0,ry=0;
document.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; });
(function lerp(){
  rx+=(mx-rx)*.12; ry+=(my-ry)*.12;
  cur.style.left=mx+'px'; cur.style.top=my+'px';
  ring.style.left=rx+'px'; ring.style.top=ry+'px';
  requestAnimationFrame(lerp);
})();
function bindCursorHover() {
  document.querySelectorAll('a,button,.event-card,.seat,.seat-count-btn').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('ch'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('ch'));
  });
}

// ── Socket.io ─────────────────────────────────────────────────────────────────
const socket = io('http://localhost:3000', { withCredentials: true });
socket.on('connect', () => allEvents.forEach(ev => socket.emit('join:event', ev.id)));

socket.on('event:update', data => {
  const ev = allEvents.find(e => e.id === data.id);
  if (ev) ev.enrolledMembers = data.enrolledMembers;
  updateCardLive(data);
  // Update seat modal subtitle if open
  const seatSub = document.getElementById('seatSub');
  if (activeSeatEventId === data.id && seatSub) {
    document.getElementById('seatLiveCount').innerHTML = `<strong>${data.enrolledMembers}</strong>/${data.membersRequired} taken`;
  }
  toast('A seat was just taken — live update', 'info');
});

socket.on('event:deleted', ({ id }) => {
  allEvents = allEvents.filter(e => e.id !== id);
  renderEvents();
});

// ── State ─────────────────────────────────────────────────────────────────────
let allEvents=[], activeFilter='all', activeSort='newest', searchQ='';
let activeSeatEventId = null;

// ── Nav ───────────────────────────────────────────────────────────────────────
const navUser = document.getElementById('navUser');
if (user) {
  navUser.innerHTML = `<img src="${user.avatar}" class="nav-avatar" onclick="location.href='profile.html'" title="${user.name}">`;
} else {
  navUser.innerHTML = `<button class="btn-sm" onclick="location.href='login.html'">Sign in</button>`;
}

// ── Page header animation ─────────────────────────────────────────────────────
gsap.from('.page-title .word', { y: '100%', duration: .9, ease: 'power3.out', delay: .1 });
gsap.from('.page-eyebrow',     { opacity: 0, y: 12, duration: .6, ease: 'power2.out', delay: .3 });
gsap.from('.page-meta .meta-item', { opacity: 0, y: 16, duration: .5, stagger: .08, ease: 'power2.out', delay: .4 });

// ── Filters ───────────────────────────────────────────────────────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderEvents();
  });
});
document.getElementById('sortSelect').addEventListener('change', e => { activeSort = e.target.value; renderEvents(); });
document.getElementById('searchInput').addEventListener('input', e => { searchQ = e.target.value.toLowerCase(); renderEvents(); });

// ── Modal helpers ─────────────────────────────────────────────────────────────
const createModal = document.getElementById('createModal');
function openModal(m)  { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeModal(m) { m.classList.remove('open'); document.body.style.overflow = ''; }

document.getElementById('createBtn').addEventListener('click', () => {
  if (!user) { toast('Sign in to create events', 'warning'); setTimeout(() => location.href = 'login.html', 700); return; }
  openModal(createModal);
});
document.getElementById('closeCreate').addEventListener('click', () => closeModal(createModal));
createModal.addEventListener('click', e => { if (e.target === createModal) closeModal(createModal); });

// ── Fetch events ──────────────────────────────────────────────────────────────
async function fetchEvents() {
  try {
    const res = await fetch(`${API}/events`);
    const { data } = await res.json();
    allEvents = data || [];
    allEvents.forEach(ev => socket.emit('join:event', ev.id));
    renderEvents();
    updateMeta();
  } catch(_) {
    document.getElementById('eventsGrid').innerHTML =
      `<div class="empty"><div class="empty-title">Can't reach server</div><div class="empty-sub">Make sure the server is running on port 3000</div></div>`;
  }
}

function getList() {
  let list = [...allEvents];
  if (activeFilter !== 'all') list = list.filter(e => (e.category||'general') === activeFilter);
  if (searchQ) list = list.filter(e =>
    e.eventName.toLowerCase().includes(searchQ) || e.organizerName.toLowerCase().includes(searchQ)
  );
  if (activeSort === 'newest')  list.sort((a,b) => (b.createdAt?._seconds||0)-(a.createdAt?._seconds||0));
  if (activeSort === 'filling') list.sort((a,b) => (b.enrolledMembers/b.membersRequired)-(a.enrolledMembers/a.membersRequired));
  if (activeSort === 'spots')   list.sort((a,b) => (b.membersRequired-b.enrolledMembers)-(a.membersRequired-a.enrolledMembers));
  return list;
}

const ICONS = { music:'🎵', tech:'💻', sports:'🏆', food:'🍽️', general:'🎭' };

function renderEvents() {
  const list = getList();
  const grid = document.getElementById('eventsGrid');
  if (!list.length) {
    grid.innerHTML = `<div class="empty">
      <div class="empty-title">${searchQ||activeFilter!=='all'?'No matches':'No events yet'}</div>
      <div class="empty-sub">${searchQ?'Try a different search':'Be the first to create one'}</div>
    </div>`;
    return;
  }
  grid.innerHTML = list.map((ev, i) => buildCard(ev, i)).join('');
  gsap.from('.event-card', { opacity:0, y:24, duration:.5, stagger:.06, ease:'power2.out',
    scrollTrigger: { trigger: '.events-grid', start: 'top 85%' }
  });
  bindCursorHover();
}

function buildCard(ev, i) {
  const spots  = ev.membersRequired - (ev.enrolledMembers||0);
  const isFull = spots <= 0;
  const pct    = Math.min(Math.round(((ev.enrolledMembers||0)/ev.membersRequired)*100), 100);
  const isHot  = pct >= 70 && !isFull;
  const date   = new Date(ev.date).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'});
  const alreadyIn = user && (ev.enrollments||[]).some(e => e.userId === user.id);

  return `
  <div class="event-card" data-event-id="${ev.id}">
    <div class="card-top">
      <div class="card-icon">${ICONS[ev.category||'general']||'🎭'}</div>
      <div class="card-badges">
        <span class="badge badge-cat">${ev.category||'general'}</span>
        ${isHot ? '<span class="badge badge-hot">Hot</span>' : ''}
        ${alreadyIn ? '<span class="badge badge-live">Booked</span>' :
          isFull ? '<span class="badge badge-full">Sold out</span>' :
          '<span class="badge badge-live"><span style="width:5px;height:5px;border-radius:50%;background:var(--green);animation:pulse 2s infinite"></span>Live</span>'}
      </div>
    </div>
    <div class="card-title">${ev.eventName}</div>
    <div class="card-org">${ev.organizerName}</div>
    <div class="card-meta">
      <div class="card-meta-item"><strong>${date}</strong>Date</div>
      <div class="card-meta-item"><strong>${ev.enrolledMembers||0}/${ev.membersRequired}</strong>Enrolled</div>
    </div>
    <div class="prog-row">
      <span class="prog-label">${isFull?'Sold out':`${spots} spot${spots!==1?'s':''} left`}</span>
      <span class="prog-pct">${pct}%</span>
    </div>
    <div class="prog-track"><div class="prog-fill ${isFull?'full':''}" style="width:${pct}%"></div></div>
    <div class="card-footer">
      <button class="btn-seat" onclick="openSeatPicker('${ev.id}')" ${isFull||alreadyIn?'disabled':''}>
        ${alreadyIn ? '✓ Booked' : '🎭 Pick Seat'}
      </button>
      <button class="btn-enroll" onclick="quickEnroll('${ev.id}')" ${isFull||alreadyIn?'disabled':''}>
        ${alreadyIn ? 'Enrolled' : 'Quick Enroll'}
      </button>
      <button class="btn-del" onclick="deleteEvent('${ev.id}')" title="Delete">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
      </button>
    </div>
  </div>`;
}

// ── Live card update ──────────────────────────────────────────────────────────
function updateCardLive(data) {
  const card = document.querySelector(`[data-event-id="${data.id}"]`);
  if (!card) return;
  const spots = data.membersRequired - data.enrolledMembers;
  const pct   = Math.min(Math.round((data.enrolledMembers/data.membersRequired)*100), 100);
  const fill  = card.querySelector('.prog-fill');
  if (fill) { gsap.to(fill, { width: pct+'%', duration:.6, ease:'power2.out' }); if(data.isFull) fill.classList.add('full'); }
  const label = card.querySelector('.prog-label');
  if (label) label.textContent = data.isFull ? 'Sold out' : `${spots} spot${spots!==1?'s':''} left`;
  const pctEl = card.querySelector('.prog-pct');
  if (pctEl) pctEl.textContent = pct+'%';
  const meta = card.querySelectorAll('.card-meta-item')[1];
  if (meta) meta.innerHTML = `<strong>${data.enrolledMembers}/${data.membersRequired}</strong>Enrolled`;
  card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash');
  updateMeta();
}

function updateMeta() {
  document.getElementById('metaTotal').textContent    = allEvents.length;
  document.getElementById('metaOpen').textContent     = allEvents.reduce((s,e) => s+Math.max(0,e.membersRequired-(e.enrolledMembers||0)), 0);
  document.getElementById('metaEnrolled').textContent = allEvents.reduce((s,e) => s+(e.enrolledMembers||0), 0);
}

// ── THEATRE SEAT PICKER — 3-step flow ────────────────────────────────────────
// Step 1: choose count  →  Step 2: pick seats  →  Step 3: cart/confirm

const seatCountModal = document.getElementById('seatCountModal');
const seatModal      = document.getElementById('seatModal');
const cartModal      = document.getElementById('cartModal');

let wantedCount   = 0;    // seats user wants to book
let selectedSeats = [];   // seat IDs user has clicked
let reservedSeats = [];   // seats reserved by this user
let activeEventId = null; // event being booked
let reservationTimer = null; // countdown timer
let reservationExpiry = null; // when reservation expires
let reservationDebounce = null; // debounce timer for API calls

function resetSeatFlow() {
  // Clear reservation when user abandons seat selection
  if (selectedSeats.length > 0 && activeEventId) {
    clearReservation();
  }
  
  wantedCount = 0; selectedSeats = []; reservedSeats = []; activeEventId = null; activeSeatEventId = null;
  if (reservationTimer) {
    clearInterval(reservationTimer);
    reservationTimer = null;
  }
  reservationExpiry = null;
}

// Close / back handlers
document.getElementById('closeSeatCount').addEventListener('click', () => { closeModal(seatCountModal); resetSeatFlow(); });
document.getElementById('closeSeat').addEventListener('click',      () => { closeModal(seatModal); });
document.getElementById('closeCart').addEventListener('click',      () => { closeModal(cartModal); resetSeatFlow(); });
document.getElementById('backToSeats').addEventListener('click',    () => { closeModal(cartModal); openModal(seatModal); });
[seatCountModal, seatModal, cartModal].forEach(m =>
  m.addEventListener('click', e => { if (e.target === m) { closeModal(m); resetSeatFlow(); } })
);

// ── STEP 1: how many seats? ───────────────────────────────────────────────────
function openSeatPicker(eventId) {
  if (!user) { toast('Sign in to book seats', 'warning'); setTimeout(() => location.href = 'login.html', 700); return; }
  const ev = allEvents.find(e => e.id === eventId);
  if (!ev) return;

  if ((ev.enrollments||[]).some(e => e.userId === user.id)) {
    toast('You are already enrolled in this event', 'info'); return;
  }

  activeEventId = eventId; activeSeatEventId = eventId;
  wantedCount = 0; selectedSeats = [];

  const spotsLeft = ev.membersRequired - (ev.enrolledMembers||0);
  const maxSeats  = Math.min(10, spotsLeft);

  document.getElementById('seatCountTitle').textContent     = ev.eventName;
  document.getElementById('seatCountSub').textContent       = `${spotsLeft} spot${spotsLeft!==1?'s':''} available`;
  document.getElementById('seatCountEventName').textContent = ev.eventName;
  document.getElementById('seatCountEventMeta').textContent =
    `${ev.organizerName} · ${new Date(ev.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})} · ${spotsLeft} spots left`;

  // Build number buttons 1 – maxSeats
  const btns = document.getElementById('seatCountBtns');
  btns.innerHTML = '';
  for (let i = 1; i <= maxSeats; i++) {
    const b = document.createElement('button');
    b.className   = 'seat-count-btn';
    b.textContent = i;
    const num = i;
    b.addEventListener('click', () => {
      document.querySelectorAll('.seat-count-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      wantedCount = num;
      document.getElementById('proceedToSeats').disabled = false;
      gsap.from(b, { scale: .75, duration: .2, ease: 'back.out(3)' });
    });
    btns.appendChild(b);
  }

  document.getElementById('proceedToSeats').disabled = true;
  openModal(seatCountModal);
  bindCursorHover();
}

// Step 1 → Step 2
document.getElementById('proceedToSeats').addEventListener('click', () => {
  if (!wantedCount) return;
  const ev = allEvents.find(e => e.id === activeEventId);
  if (!ev) return;

  closeModal(seatCountModal);
  selectedSeats = [];

  document.getElementById('seatTitle').textContent      = ev.eventName;
  document.getElementById('seatSub').textContent        = `Select exactly ${wantedCount} seat${wantedCount>1?'s':''}`;
  document.getElementById('requiredCount').textContent  = wantedCount;
  document.getElementById('selectedLabel').textContent  = '0';
  document.getElementById('seatLiveCount').innerHTML    = `<strong>${ev.enrolledMembers||0}</strong>/${ev.membersRequired} taken`;
  document.getElementById('proceedToCart').disabled     = true;

  buildSeatGrid(ev);
  openModal(seatModal);
  bindCursorHover();
});

// ── STEP 2: seat grid ─────────────────────────────────────────────────────────
async function buildSeatGrid(ev) {
  console.log('🎭 Building seat grid for event:', ev.id);
  const total    = ev.membersRequired;
  // Collect all taken seats — supports both old (seat) and new (seats[]) format
  const takenSet = new Set(
    (ev.enrollments||[])
      .flatMap(e => e.seats || (e.seat ? [e.seat] : []))
      .filter(Boolean)
  );
  console.log('🚫 Taken seats:', Array.from(takenSet));

  // Fetch currently reserved seats from server
  const reservedSet = new Set();
  try {
    console.log('📡 Fetching reservations...');
    const res = await fetch(`${API}/events/${ev.id}/reservations`, { headers: H() });
    const data = await res.json();
    console.log('📦 Reservations response:', data);
    if (data.success && data.data) {
      data.data.forEach(r => {
        // Don't mark our own reservations as reserved
        if (r.userId !== user?.id) {
          r.seats.forEach(s => reservedSet.add(s));
        }
      });
      console.log('🔒 Reserved seats (by others):', Array.from(reservedSet));
    }
  } catch (err) {
    console.error('❌ Failed to fetch reservations:', err);
  }

  const COLS  = 10;
  const ROWS  = Math.ceil(total / COLS);
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const grid  = document.getElementById('seatGrid');
  grid.innerHTML = '';

  let n = 0;
  for (let r = 0; r < ROWS; r++) {
    const row = document.createElement('div');
    row.className = 'seat-row';

    const lbl = document.createElement('span');
    lbl.className   = 'seat-row-label';
    lbl.textContent = ALPHA[r % 26];
    row.appendChild(lbl);

    for (let c = 0; c < COLS; c++) {
      if (n >= total) break;
      const seatId     = `${ALPHA[r % 26]}${c + 1}`;
      const isTaken    = takenSet.has(seatId);
      const isReserved = reservedSet.has(seatId);

      const el = document.createElement('div');
      el.className    = 'seat';
      el.dataset.seat = seatId;
      el.textContent  = c + 1;

      if (isTaken) {
        el.classList.add('taken');
        el.title = `Seat ${seatId} — Taken`;
      } else if (isReserved) {
        el.classList.add('reserved');
        el.title = `Seat ${seatId} — Reserved by another user`;
      } else {
        el.title = `Seat ${seatId}`;
        el.addEventListener('click', () => toggleSeat(seatId, el));
      }

      row.appendChild(el);
      n++;
    }
    grid.appendChild(row);
  }

  console.log('✅ Seat grid built');
  // Spring pop-in
  gsap.from('.seat', { opacity:0, scale:0.5, duration:0.3, stagger:{amount:0.6,from:'random'}, ease:'back.out(2)' });
}

function toggleSeat(seatId, el) {
  const idx = selectedSeats.indexOf(seatId);

  if (idx !== -1) {
    // Deselect - release this seat from reservation
    selectedSeats.splice(idx, 1);
    el.classList.remove('selected');
    gsap.to(el, { scale:1, duration:.15 });
    
    // Update reservation immediately
    if (selectedSeats.length > 0) {
      updateReservation();
    } else {
      // No seats selected, clear reservation
      clearReservation();
    }
  } else {
    // Reject if limit reached
    if (selectedSeats.length >= wantedCount) {
      gsap.to(el, { x:-5, duration:.05, yoyo:true, repeat:5, ease:'none' });
      toast(`Select exactly ${wantedCount} seat${wantedCount>1?'s':''}`, 'warning');
      return;
    }
    selectedSeats.push(seatId);
    el.classList.add('selected');
    gsap.fromTo(el, { scale:0.75 }, { scale:1, duration:0.25, ease:'back.out(3)' });
    
    // Reserve immediately when seat is selected
    updateReservation();
  }

  document.getElementById('selectedLabel').textContent = selectedSeats.length;
  const ready = selectedSeats.length === wantedCount;
  document.getElementById('proceedToCart').disabled = !ready;
  if (ready) gsap.from('#proceedToCart', { scale:.97, duration:.2, ease:'back.out(2)' });
}

// Update reservation in real-time as user selects/deselects seats
// Debounced to avoid too many API calls
async function updateReservation() {
  if (!selectedSeats.length) return;
  
  // Clear previous debounce timer
  if (reservationDebounce) {
    clearTimeout(reservationDebounce);
  }
  
  // Debounce: wait 300ms after last seat click before reserving
  reservationDebounce = setTimeout(async () => {
    try {
      const res = await fetch(`${API}/events/${activeEventId}/reserve`, {
        method: 'POST', headers: H(),
        body: JSON.stringify({ seats: selectedSeats }),
      });
      const data = await res.json();

      if (data.success) {
        console.log('✅ Seats reserved:', selectedSeats);
        reservedSeats = [...selectedSeats];
        reservationExpiry = new Date(data.expiresAt);
        
        // Show subtle indicator that seats are reserved
        if (!document.getElementById('reservationIndicator')) {
          const indicator = document.createElement('div');
          indicator.id = 'reservationIndicator';
          indicator.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:rgba(34,197,94,0.9);color:white;padding:0.5rem 1.5rem;border-radius:20px;font-size:0.75rem;font-weight:600;z-index:1000;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
          indicator.innerHTML = '✓ Seats reserved for 5 minutes';
          document.body.appendChild(indicator);
          
          // Auto-hide after 3 seconds
          setTimeout(() => {
            indicator.style.opacity = '0';
            indicator.style.transition = 'opacity 0.3s';
            setTimeout(() => indicator.remove(), 300);
          }, 3000);
        }
      } else {
        console.error('❌ Reservation failed:', data.error);
        // If reservation fails, deselect the last seat
        const lastSeat = selectedSeats.pop();
        const el = document.querySelector(`.seat[data-seat="${lastSeat}"]`);
        if (el) el.classList.remove('selected');
        document.getElementById('selectedLabel').textContent = selectedSeats.length;
        toast(data.error, 'error');
      }
    } catch (err) {
      console.error('💥 Reserve error:', err);
    }
  }, 300); // Wait 300ms after last click
}

// Clear reservation when all seats are deselected
async function clearReservation() {
  if (!activeEventId) return;
  
  try {
    // Delete reservation by creating empty reservation (server will clean up old ones)
    await fetch(`${API}/events/${activeEventId}/reserve`, {
      method: 'DELETE', headers: H(),
    });
    console.log('🗑️ Reservation cleared');
  } catch (err) {
    console.error('Error clearing reservation:', err);
  }
}

// Live seat taken by another user while picker is open
socket.on('seat:taken', data => {
  if (activeSeatEventId !== data.eventId) return;
  const el = document.querySelector(`.seat[data-seat="${data.seat}"]`);
  if (el && !el.classList.contains('taken')) {
    el.classList.add('taken', 'live-taken');
    el.classList.remove('selected');
    const idx = selectedSeats.indexOf(data.seat);
    if (idx !== -1) {
      selectedSeats.splice(idx, 1);
      document.getElementById('selectedLabel').textContent = selectedSeats.length;
      document.getElementById('proceedToCart').disabled = true;
      toast(`Seat ${data.seat} was just taken by someone else!`, 'warning');
    }
  }
});

// Seats reserved by another user
socket.on('seats:reserved', data => {
  console.log('🔔 Received seats:reserved event:', data);
  if (activeSeatEventId !== data.eventId || data.userId === user?.id) {
    console.log('⏭️ Ignoring - different event or own reservation');
    return;
  }
  console.log('🔒 Marking seats as reserved:', data.seats);
  data.seats.forEach(seat => {
    const el = document.querySelector(`.seat[data-seat="${seat}"]`);
    if (el && !el.classList.contains('taken')) {
      el.classList.add('reserved');
      el.title = `Seat ${seat} — Reserved by another user`;
      // Remove click listener to prevent selection
      el.replaceWith(el.cloneNode(true));
      
      // If user had this seat selected, remove it
      const idx = selectedSeats.indexOf(seat);
      if (idx !== -1) {
        selectedSeats.splice(idx, 1);
        document.getElementById('selectedLabel').textContent = selectedSeats.length;
        document.getElementById('proceedToCart').disabled = selectedSeats.length !== wantedCount;
      }
    }
  });
  toast('Some seats were just reserved by another user', 'info');
});

// Seats released (reservation expired)
socket.on('seats:released', data => {
  console.log('🔓 Received seats:released event:', data);
  if (activeSeatEventId !== data.eventId) {
    console.log('⏭️ Ignoring - different event');
    return;
  }
  console.log('✅ Releasing seats:', data.seats);
  data.seats.forEach(seat => {
    const el = document.querySelector(`.seat[data-seat="${seat}"]`);
    if (el && el.classList.contains('reserved')) {
      el.classList.remove('reserved');
      el.title = `Seat ${seat}`;
      // Re-add click listener
      const newEl = el.cloneNode(true);
      newEl.addEventListener('click', () => toggleSeat(seat, newEl));
      el.replaceWith(newEl);
    }
  });
  toast('Some reserved seats are now available!', 'success');
});

// Countdown timer for seat reservation
function startReservationTimer() {
  console.log('⏰ Starting reservation timer');
  console.log('⏰ Expiry time:', reservationExpiry);
  
  if (reservationTimer) clearInterval(reservationTimer);
  
  // Add timer display to cart modal if not exists
  let timerEl = document.getElementById('reservationTimer');
  if (!timerEl) {
    console.log('📝 Creating timer element');
    timerEl = document.createElement('div');
    timerEl.id = 'reservationTimer';
    timerEl.style.cssText = 'text-align:center;padding:1rem;background:rgba(192,57,43,0.1);border:1px solid rgba(192,57,43,0.3);margin-bottom:1rem;font-size:0.9rem;font-weight:600;color:#c0392b;';
    const cartModal = document.getElementById('cartModal');
    const cartContent = cartModal.querySelector('.modal-content');
    if (cartContent) {
      cartContent.insertBefore(timerEl, cartContent.firstChild);
      console.log('✅ Timer element added to cart');
    } else {
      console.error('❌ Could not find cart modal content');
    }
  }

  reservationTimer = setInterval(() => {
    const now = new Date();
    const remaining = Math.max(0, reservationExpiry - now);
    
    if (remaining <= 0) {
      console.log('⏰ Reservation expired!');
      clearInterval(reservationTimer);
      timerEl.innerHTML = '⏰ Reservation expired! Please select seats again.';
      setTimeout(() => {
        closeModal(cartModal);
        resetSeatFlow();
        toast('Your seat reservation expired', 'warning');
      }, 2000);
      return;
    }

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    timerEl.innerHTML = `⏱️ Seats reserved for: <strong>${minutes}:${seconds.toString().padStart(2, '0')}</strong>`;
    
    // Warning when less than 1 minute left
    if (remaining < 60000) {
      timerEl.style.background = 'rgba(192,57,43,0.2)';
      timerEl.style.animation = 'pulse 1s infinite';
    }
  }, 1000);
  
  console.log('✅ Timer started');
}

// Step 2 → Step 3 (seats already reserved, just show cart)
document.getElementById('proceedToCart').addEventListener('click', async () => {
  if (selectedSeats.length !== wantedCount) return;
  const ev = allEvents.find(e => e.id === activeEventId);
  if (!ev) return;

  console.log('🛒 Proceeding to cart with reserved seats:', selectedSeats);

  // Seats are already reserved from toggleSeat(), just show cart
  closeModal(seatModal);

  // Populate cart
  document.getElementById('cartEventInfo').innerHTML = `
    <div style="font-family:var(--display);font-size:1.1rem;font-weight:700;letter-spacing:-.02em;margin-bottom:.4rem">${ev.eventName}</div>
    <div style="font-size:.75rem;color:var(--muted2)">${ev.organizerName} · ${new Date(ev.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>`;

  document.getElementById('cartSeats').innerHTML =
    selectedSeats.map(s => `<div class="seat-chip">${s}</div>`).join('');

  document.getElementById('cartUserBox').innerHTML = `
    <img src="${user.avatar}" alt="${user.name}">
    <div><div class="enroll-user-name">${user.name}</div><div class="enroll-user-email">${user.email}</div></div>`;

  const btn = document.getElementById('confirmBooking');
  btn.disabled    = false;
  btn.textContent = `✓ Confirm ${wantedCount} Seat${wantedCount>1?'s':''}`;

  // Start timer display in cart
  if (reservationExpiry) {
    startReservationTimer();
  }

  openModal(cartModal);
});

// ── STEP 3: confirm booking ───────────────────────────────────────────────────
document.getElementById('confirmBooking').addEventListener('click', async () => {
  const btn = document.getElementById('confirmBooking');
  btn.disabled    = true;
  btn.textContent = 'Securing seats…';

  try {
    const res  = await fetch(`${API}/events/${activeEventId}/enroll`, {
      method: 'POST', headers: H(),
      body: JSON.stringify({ userId: user.id, seats: selectedSeats }),
    });
    const data = await res.json();

    if (data.success) {
      closeModal(cartModal);
      resetSeatFlow();
      toast(`🎭 ${data.message}`, 'success');
      fetchEvents();
    } else {
      toast(data.error, 'error');
      btn.disabled    = false;
      btn.textContent = '✓ Confirm Booking';
    }
  } catch (_) {
    toast('Server error', 'error');
    btn.disabled    = false;
    btn.textContent = '✓ Confirm Booking';
  }
});

// ── Quick enroll (no seat selection) ─────────────────────────────────────────
async function quickEnroll(eventId) {
  if (!user) { toast('Sign in to enroll', 'warning'); setTimeout(() => location.href = 'login.html', 700); return; }
  const btn = document.querySelector(`[data-event-id="${eventId}"] .btn-enroll`);
  if (btn) { btn.disabled = true; btn.textContent = 'Enrolling…'; }
  try {
    const res  = await fetch(`${API}/events/${eventId}/enroll`, {
      method: 'POST', headers: H(), body: JSON.stringify({ userId: user.id }),
    });
    const data = await res.json();
    if (data.success) { toast('🎉 Enrolled!', 'success'); fetchEvents(); }
    else { toast(data.error, 'error'); if (btn) { btn.disabled = false; btn.textContent = 'Quick Enroll'; } }
  } catch (_) { toast('Server error', 'error'); }
}

// ── Create event ──────────────────────────────────────────────────────────────
document.getElementById('createForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('createSubmit');
  btn.disabled = true; btn.textContent = 'Launching…';
  try {
    const res = await fetch(`${API}/events`, {
      method: 'POST', headers: H(),
      body: JSON.stringify({
        eventName:       document.getElementById('evName').value,
        date:            document.getElementById('evDate').value,
        membersRequired: document.getElementById('evCapacity').value,
        category:        document.getElementById('evCategory').value,
        description:     document.getElementById('evDesc').value,
      }),
    });
    const data = await res.json();
    if (data.success) { closeModal(createModal); document.getElementById('createForm').reset(); toast('Event launched!', 'success'); fetchEvents(); }
    else toast(data.error, 'error');
  } catch (_) { toast('Server error', 'error'); }
  finally { btn.disabled = false; btn.textContent = '→ Launch Event'; }
});

// ── Delete event ──────────────────────────────────────────────────────────────
async function deleteEvent(id) {
  if (!confirm('Delete this event?')) return;
  try {
    const res  = await fetch(`${API}/events/${id}`, { method: 'DELETE', headers: H() });
    const data = await res.json();
    if (data.success) {
      const card = document.querySelector(`[data-event-id="${id}"]`);
      if (card) gsap.to(card, { opacity:0, scale:.95, duration:.3, ease:'power2.in',
        onComplete: () => { allEvents = allEvents.filter(e => e.id !== id); renderEvents(); }
      });
      else { allEvents = allEvents.filter(e => e.id !== id); renderEvents(); }
      toast('Deleted', 'success');
    } else toast(data.error, 'error');
  } catch (_) { toast('Server error', 'error'); }
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const c = document.getElementById('toastWrap');
  const t = document.createElement('div');
  t.className   = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { gsap.to(t, { opacity:0, x:12, duration:.3, onComplete: () => t.remove() }); }, 3500);
}

// ── Init ──────────────────────────────────────────────────────────────────────
fetchEvents();