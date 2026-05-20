const API = 'http://localhost:3000/api';

// ── Auth ──────────────────────────────────────────────────────────────────────
let currentUser = null, authToken = null;
try {
  const raw = localStorage.getItem('user');
  if (raw) { currentUser = JSON.parse(raw); authToken = currentUser.token; }
  else { window.location.href = 'login.html'; }
} catch(_) { window.location.href = 'login.html'; }

const H = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` });

// ── Cursor ────────────────────────────────────────────────────────────────────
const cur  = document.getElementById('cursor');
const ring = document.getElementById('cursor-ring');
document.addEventListener('mousemove', e => {
  cur.style.left  = e.clientX + 'px'; cur.style.top  = e.clientY + 'px';
  ring.style.left = e.clientX + 'px'; ring.style.top = e.clientY + 'px';
});
document.querySelectorAll('a,button,input,textarea,.avatar-wrap').forEach(el => {
  el.addEventListener('mouseenter', () => { cur.style.width='18px'; cur.style.height='18px'; });
  el.addEventListener('mouseleave', () => { cur.style.width='10px'; cur.style.height='10px'; });
});

// ── Load profile ──────────────────────────────────────────────────────────────
async function loadProfile() {
  try {
    const res  = await fetch(`${API}/users/${currentUser.id}`);
    const data = await res.json();
    if (!data.success) return;
    const p = data.data;

    document.getElementById('fullName').value  = p.name     || '';
    document.getElementById('email').value     = p.email    || '';
    document.getElementById('phone').value     = p.phone    || '';
    document.getElementById('dob').value       = p.dob      || '';
    document.getElementById('location').value  = p.location || '';
    document.getElementById('bio').value       = p.bio      || '';

    const avatarImg = document.getElementById('avatarImg');
    avatarImg.src = p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&size=128&background=222&color=f0ede8&rounded=true`;

    if (p.interests?.length) {
      document.querySelectorAll('input[name="interests"]').forEach(cb => {
        cb.checked = p.interests.includes(cb.value);
      });
    }
    if (p.notifications) {
      const radio = document.querySelector(`input[name="notifications"][value="${p.notifications}"]`);
      if (radio) radio.checked = true;
    }
  } catch(err) {
    console.error('Error loading profile:', err);
  }
}

// ── Avatar upload ─────────────────────────────────────────────────────────────
document.getElementById('avatarWrap').addEventListener('click', () => {
  document.getElementById('avatarInput').click();
});
document.getElementById('avatarInput').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;

  // show preview immediately while uploading
  const reader = new FileReader();
  reader.onload = ev => { document.getElementById('avatarImg').src = ev.target.result; };
  reader.readAsDataURL(file);

  // upload to Cloudinary via our backend
  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const res = await fetch(`${API}/users/${currentUser.id}/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` }, // no Content-Type — browser sets it
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      // update avatar in localStorage so nav shows new pic
      currentUser.avatar = data.data.avatar;
      localStorage.setItem('user', JSON.stringify(currentUser));
      document.getElementById('avatarImg').src = data.data.avatar;
      showToast('Avatar updated!', 'success');
    } else {
      showToast(data.error || 'Upload failed', 'error');
    }
  } catch (err) {
    showToast('Upload error', 'error');
  }
});

// ── Save profile ──────────────────────────────────────────────────────────────
document.getElementById('profileForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('saveBtn');
  btn.disabled = true; btn.textContent = 'Saving…';

  const interests = [];
  document.querySelectorAll('input[name="interests"]:checked').forEach(cb => interests.push(cb.value));
  const notifications = document.querySelector('input[name="notifications"]:checked')?.value || 'all';

  const payload = {
    name:          document.getElementById('fullName').value,
    phone:         document.getElementById('phone').value,
    dob:           document.getElementById('dob').value,
    location:      document.getElementById('location').value,
    bio:           document.getElementById('bio').value,
    interests,
    notifications,
  };

  try {
    const res  = await fetch(`${API}/users/${currentUser.id}`, {
      method: 'PUT', headers: H(), body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      currentUser.name   = payload.name;
      currentUser.avatar = payload.avatar;
      localStorage.setItem('user', JSON.stringify(currentUser));
      showToast('Profile saved', 'success');
    } else {
      showToast(data.error, 'error');
    }
  } catch(_) {
    showToast('Server error', 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Save Changes';
  }
});

document.getElementById('cancelBtn').addEventListener('click', () => {
  if (confirm('Discard unsaved changes?')) loadProfile();
});

document.getElementById('changePasswordBtn').addEventListener('click', () => {
  showToast('Password change coming soon', 'info');
});
document.getElementById('deactivateBtn').addEventListener('click', () => {
  if (confirm('Deactivate your account? You will be logged out.')) {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  }
});

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  // Inject toast container if not present
  let c = document.getElementById('toastContainer');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toastContainer';
    Object.assign(c.style, {
      position:'fixed', bottom:'2rem', right:'2rem',
      display:'flex', flexDirection:'column', gap:'.5rem', zIndex:'9999',
    });
    document.body.appendChild(c);
  }
  const t = document.createElement('div');
  const colors = { success:'rgba(34,197,94,.3)', error:'rgba(200,57,43,.3)', info:'rgba(255,255,255,.15)' };
  const textColors = { success:'#86efac', error:'#fca5a5', info:'#888' };
  Object.assign(t.style, {
    padding:'.65rem 1.2rem',
    background:'#111',
    border:`1px solid ${colors[type]||colors.info}`,
    borderRadius:'2px',
    fontSize:'.78rem', fontWeight:'500',
    color: textColors[type]||textColors.info,
    fontFamily:"'Inter',sans-serif",
    boxShadow:'0 8px 24px rgba(0,0,0,.5)',
    animation:'toastIn .25s ease',
  });
  t.textContent = msg;
  c.appendChild(t);

  // Inject keyframe once
  if (!document.getElementById('toastStyle')) {
    const s = document.createElement('style');
    s.id = 'toastStyle';
    s.textContent = `@keyframes toastIn{from{transform:translateX(12px);opacity:0}to{transform:none;opacity:1}}`;
    document.head.appendChild(s);
  }

  setTimeout(() => { t.style.opacity='0'; t.style.transition='opacity .3s'; setTimeout(()=>t.remove(),300); }, 3000);
}

// ── Init ──────────────────────────────────────────────────────────────────────
loadProfile();
loadBookings();

// ── Load bookings ─────────────────────────────────────────────────────────────
async function loadBookings() {
  try {
    const res = await fetch(`${API}/users/${currentUser.id}/bookings`, { headers: H() });
    const data = await res.json();
    
    const list = document.getElementById('bookingsList');
    const count = document.getElementById('bookingsCount');
    
    if (!data.success || !data.data || data.data.length === 0) {
      list.innerHTML = '<div class="bookings-loading">No bookings yet</div>';
      count.textContent = '0';
      return;
    }
    
    const bookings = data.data;
    count.textContent = bookings.length;
    
    list.innerHTML = bookings.map(b => {
      const seats = b.seats || [];
      const seatsText = seats.length > 0 ? seats.join(', ') : `${b.seatCount || 1} seat(s)`;
      const date = new Date(b.date).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'});
      
      return `
        <div class="booking-item">
          <div class="booking-event">${b.eventName}</div>
          <div class="booking-meta">
            <span>👤 ${b.organizerName}</span>
            <span>📅 ${date}</span>
            <span>🎫 ${seatsText}</span>
          </div>
        </div>
      `;
    }).join('');
  } catch(err) {
    console.error('Error loading bookings:', err);
    document.getElementById('bookingsList').innerHTML = '<div class="bookings-loading">Error loading bookings</div>';
  }
}