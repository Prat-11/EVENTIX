const API_URL = 'http://localhost:5000/api';


let currentUser = null;
try {
    const userData = localStorage.getItem('user');
    if (userData) {
        currentUser = JSON.parse(userData);
    }
} catch (error) {
    console.error('Error loading user data:', error);
}


window.addEventListener('DOMContentLoaded', () => {
    const signInBtn = document.querySelector('.sign-in-btn');
    if (currentUser) {
        signInBtn.textContent = `👤 ${currentUser.name}`;
        signInBtn.onclick = () => {
            if (confirm('Do you want to logout?')) {
                localStorage.removeItem('user');
                window.location.reload();
            }
        };
    } else {
        signInBtn.onclick = () => {
            window.location.href = 'signup.html';
        };
    }
});


const createBtn = document.getElementById('createBtn');
const createModal = document.getElementById('createModal');
const enrollModal = document.getElementById('enrollModal');
const closeCreate = document.getElementById('closeCreate');
const closeEnroll = document.getElementById('closeEnroll');
const createEventForm = document.getElementById('createEventForm');
const enrollForm = document.getElementById('enrollForm');
const eventsGrid = document.getElementById('eventsGrid');

let selectedEventId = null;


createBtn.addEventListener('click', () => {
    createModal.style.display = 'block';
});

closeCreate.addEventListener('click', () => {
    createModal.style.display = 'none';
});

closeEnroll.addEventListener('click', () => {
    enrollModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === createModal) {
        createModal.style.display = 'none';
    }
    if (e.target === enrollModal) {
        enrollModal.style.display = 'none';
    }
});


async function fetchEvents() {
    try {
        const response = await fetch(`${API_URL}/events`);
        const data = await response.json();

        if (data.success) {
            displayEvents(data.data);
        } else {
            eventsGrid.innerHTML = '<div class="error">Failed to load events</div>';
        }
    } catch (error) {
        console.error('Error:', error);
        eventsGrid.innerHTML = '<div class="error">Error connecting to server</div>';
    }
}

function displayEvents(events) {
    if (events.length === 0) {
        eventsGrid.innerHTML = '<div class="loading">No events available. Create one!</div>';
        return;
    }

    const eventIcons = ['🎭', '🎵', '🎪', '🎨', '🎬', '🎤', '🎸', '🎺', '🎻', '🎹'];

    eventsGrid.innerHTML = events.map((event, index) => {
        const spotsLeft = event.membersRequired - event.enrolledMembers;
        const isFull = spotsLeft <= 0;
        const progress = (event.enrolledMembers / event.membersRequired) * 100;
        const icon = eventIcons[index % eventIcons.length];

        return `
            <div class="event-card">
                <div class="event-image">${icon}</div>
                <div class="event-content">
                    <div class="event-header">
                        <h3 class="event-name">${event.eventName}</h3>
                        <p class="organizer">by ${event.organizerName}</p>
                    </div>
                    <div class="event-details">
                        <div class="detail-item">
                            <span class="detail-label">Date</span>
                            <span>${new Date(event.date).toLocaleDateString()}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Enrolled</span>
                            <span>${event.enrolledMembers} / ${event.membersRequired}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    <div class="event-footer">
                        <span class="spots-left ${isFull ? 'spots-full' : ''}">
                            ${isFull ? 'Event Full' : `${spotsLeft} spots left`}
                        </span>
                        <div class="event-actions">
                            <button class="enroll-btn" onclick="openEnrollModal('${event.id}', '${event.eventName}', '${event.date}', ${event.membersRequired}, ${event.enrolledMembers})" ${isFull ? 'disabled' : ''}>
                                ${isFull ? 'Full' : 'Enroll'}
                            </button>
                            <button class="delete-btn" onclick="deleteEvent('${event.id}')">×</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}


createEventForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const eventData = {
        organizerName: document.getElementById('organizerName').value,
        eventName: document.getElementById('eventName').value,
        date: document.getElementById('eventDate').value,
        membersRequired: document.getElementById('membersRequired').value
    };

    try {
        const response = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        });

        const data = await response.json();

        if (data.success) {
            alert('Event created successfully!');
            createModal.style.display = 'none';
            createEventForm.reset();
            fetchEvents();
        } else {
            alert('Failed to create event: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error creating event');
    }
});


function openEnrollModal(eventId, eventName, date, required, enrolled) {
    
    if (!currentUser) {
        alert('Please sign in to enroll in events');
        window.location.href = 'signup.html';
        return;
    }
    
    selectedEventId = eventId;
    const spotsLeft = required - enrolled;
    
    document.getElementById('enrollEventInfo').innerHTML = `
        <h3>${eventName}</h3>
        <p>Date: ${new Date(date).toLocaleDateString()}</p>
        <p>Spots Available: ${spotsLeft} / ${required}</p>
        <div style="margin-top: 1rem; padding: 1rem; background: rgba(225, 59, 46, 0.1); border-radius: 8px; border: 1px solid rgba(225, 59, 46, 0.3);">
            <p style="color: #ff4444; font-weight: 600;">Enrolling as:</p>
            <p style="color: #ccc; margin-top: 0.5rem;">${currentUser.name}</p>
            <p style="color: #999; font-size: 0.9rem;">${currentUser.email}</p>
        </div>
    `;
    
    enrollModal.style.display = 'block';
}


enrollForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUser) {
        alert('Please sign in to enroll');
        window.location.href = 'signup.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/events/${selectedEventId}/enroll`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentUser.id
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('Enrollment successful!');
            enrollModal.style.display = 'none';
            fetchEvents();
        } else {
            alert('Enrollment failed: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error enrolling in event');
    }
});


async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/events/${eventId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            alert('Event deleted successfully!');
            fetchEvents();
        } else {
            alert('Failed to delete event');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error deleting event');
    }
}


fetchEvents();



const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.2;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
    }

    draw() {
        ctx.fillStyle = `rgba(225, 59, 46, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

const particles = [];
for (let i = 0; i < 80; i++) {
    particles.push(new Particle());
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 120) {
                ctx.strokeStyle = `rgba(225, 59, 46, ${0.15 * (1 - distance / 120)})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
    
    requestAnimationFrame(animateParticles);
}

animateParticles();