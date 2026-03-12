const API_URL = 'http://localhost:5000/api';

// Check if user is admin
let currentUser = null;
try {
    const userData = localStorage.getItem('user');
    if (userData) {
        currentUser = JSON.parse(userData);
        console.log('Current user:', currentUser); // Debug log
        // Check if admin
        if (!currentUser.isAdmin) {
            alert('Access denied. Admin privileges required.');
            window.location.href = 'home.html';
        }
    } else {
        alert('Please login first');
        window.location.href = 'login.html';
    }
} catch (error) {
    console.error('Error:', error);
    window.location.href = 'login.html';
}

// Background animation
(function() {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    const PARTICLE_COUNT = 90;
    const colors = ['#e13b2e', '#f97316', '#e13b2e80', '#f59e0b', '#e13b2e60'];

    function initParticles() {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 4 + 1.5,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedX: (Math.random() - 0.5) * 0.4,
                speedY: (Math.random() - 0.5) * 0.3,
                opacity: Math.random() * 0.5 + 0.2,
            });
        }
    }

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        initParticles();
    }

    function drawParticles() {
        ctx.clearRect(0, 0, width, height);
        
        const gradient = ctx.createLinearGradient(0, 0, width*0.5, height);
        gradient.addColorStop(0, '#0f0c0a');
        gradient.addColorStop(0.7, '#1a1310');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.opacity * 0.7;
            ctx.fill();
            
            p.x += p.speedX;
            p.y += p.speedY;
            
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;
        });
        
        ctx.globalAlpha = 1.0;
        requestAnimationFrame(drawParticles);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    drawParticles();
})();

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
});

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab + '-tab').classList.add('active');
    });
});

// Load stats
async function loadStats() {
    try {
        console.log('Loading stats...');
        const [usersRes, eventsRes] = await Promise.all([
            fetch(`${API_URL}/admin/users`),
            fetch(`${API_URL}/admin/events`)
        ]);
        
        console.log('Users response:', usersRes.status);
        console.log('Events response:', eventsRes.status);
        
        const usersData = await usersRes.json();
        const eventsData = await eventsRes.json();
        
        console.log('Users data:', usersData);
        console.log('Events data:', eventsData);
        
        if (usersData.success && eventsData.success) {
            const users = usersData.data;
            const events = eventsData.data;
            
            document.getElementById('totalUsers').textContent = users.length;
            document.getElementById('totalEvents').textContent = events.length;
            
            const blockedCount = users.filter(u => u.blocked).length;
            document.getElementById('blockedUsers').textContent = blockedCount;
            
            const enrollmentCount = events.reduce((sum, e) => sum + (e.enrolledMembers || 0), 0);
            document.getElementById('totalEnrollments').textContent = enrollmentCount;
        } else {
            console.error('API returned error:', usersData, eventsData);
            document.getElementById('totalUsers').textContent = 'Error';
            document.getElementById('totalEvents').textContent = 'Error';
            document.getElementById('blockedUsers').textContent = 'Error';
            document.getElementById('totalEnrollments').textContent = 'Error';
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        document.getElementById('totalUsers').textContent = 'Error';
        document.getElementById('totalEvents').textContent = 'Error';
        document.getElementById('blockedUsers').textContent = 'Error';
        document.getElementById('totalEnrollments').textContent = 'Error';
    }
}

// Load users
async function loadUsers() {
    try {
        console.log('Loading users...');
        const response = await fetch(`${API_URL}/admin/users`);
        console.log('Users response status:', response.status);
        const data = await response.json();
        console.log('Users data:', data);
        
        if (data.success) {
            displayUsers(data.data);
        } else {
            document.getElementById('usersTableBody').innerHTML = '<tr><td colspan="6" class="loading-cell">Error loading users: ' + data.error + '</td></tr>';
        }
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersTableBody').innerHTML = '<tr><td colspan="6" class="loading-cell">Error: ' + error.message + '</td></tr>';
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">No users found</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td><img src="${user.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name) + '&size=40&background=e13b2e&color=fff&rounded=true'}" alt="${user.name}" class="user-avatar"></td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="status-badge ${user.blocked ? 'blocked' : 'active'}">${user.blocked ? 'Blocked' : 'Active'}</span></td>
            <td>${user.createdAt ? new Date(user.createdAt._seconds * 1000).toLocaleDateString() : 'N/A'}</td>
            <td>
                <div class="action-btns">
                    ${user.blocked ? 
                        `<button class="action-btn unblock" onclick="unblockUser('${user.id}')"><i class="fas fa-unlock"></i> Unblock</button>` :
                        `<button class="action-btn block" onclick="blockUser('${user.id}')"><i class="fas fa-ban"></i> Block</button>`
                    }
                    <button class="action-btn delete" onclick="deleteUser('${user.id}')"><i class="fas fa-trash"></i> Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Load events
async function loadEvents() {
    try {
        console.log('Loading events...');
        const response = await fetch(`${API_URL}/admin/events`);
        console.log('Events response status:', response.status);
        const data = await response.json();
        console.log('Events data:', data);
        
        if (data.success) {
            displayEvents(data.data);
        } else {
            document.getElementById('eventsTableBody').innerHTML = '<tr><td colspan="6" class="loading-cell">Error loading events: ' + data.error + '</td></tr>';
        }
    } catch (error) {
        console.error('Error loading events:', error);
        document.getElementById('eventsTableBody').innerHTML = '<tr><td colspan="6" class="loading-cell">Error: ' + error.message + '</td></tr>';
    }
}

function displayEvents(events) {
    const tbody = document.getElementById('eventsTableBody');
    
    if (events.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">No events found</td></tr>';
        return;
    }
    
    tbody.innerHTML = events.map(event => {
        const isFull = event.enrolledMembers >= event.membersRequired;
        return `
            <tr>
                <td>${event.eventName}</td>
                <td>${event.organizerName}</td>
                <td>${new Date(event.date).toLocaleDateString()}</td>
                <td>${event.enrolledMembers} / ${event.membersRequired}</td>
                <td><span class="status-badge ${isFull ? 'full' : 'available'}">${isFull ? 'Full' : 'Available'}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn delete" onclick="deleteEvent('${event.id}')"><i class="fas fa-trash"></i> Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// User actions
async function blockUser(userId) {
    if (!confirm('Are you sure you want to block this user?')) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}/block`, {
            method: 'PUT'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('User blocked successfully');
            loadUsers();
            loadStats();
        } else {
            alert('Failed to block user: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error blocking user');
    }
}

async function unblockUser(userId) {
    if (!confirm('Are you sure you want to unblock this user?')) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}/unblock`, {
            method: 'PUT'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('User unblocked successfully');
            loadUsers();
            loadStats();
        } else {
            alert('Failed to unblock user: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error unblocking user');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('User deleted successfully');
            loadUsers();
            loadStats();
        } else {
            alert('Failed to delete user: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error deleting user');
    }
}

// Event actions
async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    
    try {
        const response = await fetch(`${API_URL}/events/${eventId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Event deleted successfully');
            loadEvents();
            loadStats();
        } else {
            alert('Failed to delete event: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error deleting event');
    }
}

// Search functionality
document.getElementById('userSearch').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#usersTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});

document.getElementById('eventSearch').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#eventsTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});

// Load data on page load
loadStats();
loadUsers();
loadEvents();