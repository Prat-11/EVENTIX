const API_URL = 'http://localhost:5000/api';

// DOM Elements
const createBtn = document.getElementById('createBtn');
const createModal = document.getElementById('createModal');
const enrollModal = document.getElementById('enrollModal');
const closeCreate = document.getElementById('closeCreate');
const closeEnroll = document.getElementById('closeEnroll');
const createEventForm = document.getElementById('createEventForm');
const enrollForm = document.getElementById('enrollForm');
const eventsGrid = document.getElementById('eventsGrid');

let selectedEventId = null;

// Modal Controls
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

// Fetch and Display Events
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

    eventsGrid.innerHTML = events.map(event => {
        const spotsLeft = event.membersRequired - event.enrolledMembers;
        const isFull = spotsLeft <= 0;
        const progress = (event.enrolledMembers / event.membersRequired) * 100;

        return `
            <div class="event-card">
                <div class="event-header">
                    <h3 class="event-name">${event.eventName}</h3>
                    <p class="organizer">Organized by ${event.organizerName}</p>
                </div>
                <div class="event-details">
                    <div class="detail-item">
                        <span class="detail-label">Date:</span>
                        <span>${new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Enrolled:</span>
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
                    <div>
                        <button class="enroll-btn" onclick="openEnrollModal('${event.id}', '${event.eventName}', '${event.date}', ${event.membersRequired}, ${event.enrolledMembers})" ${isFull ? 'disabled' : ''}>
                            ${isFull ? 'Full' : 'Enroll'}
                        </button>
                        <button class="delete-btn" onclick="deleteEvent('${event.id}')">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Create Event
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

// Open Enroll Modal
function openEnrollModal(eventId, eventName, date, required, enrolled) {
    selectedEventId = eventId;
    const spotsLeft = required - enrolled;
    
    document.getElementById('enrollEventInfo').innerHTML = `
        <h3>${eventName}</h3>
        <p>Date: ${new Date(date).toLocaleDateString()}</p>
        <p>Spots Available: ${spotsLeft} / ${required}</p>
    `;
    
    enrollModal.style.display = 'block';
}

// Enroll in Event
enrollForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const enrollData = {
        userName: document.getElementById('userName').value,
        userEmail: document.getElementById('userEmail').value
    };

    try {
        const response = await fetch(`${API_URL}/events/${selectedEventId}/enroll`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(enrollData)
        });

        const data = await response.json();

        if (data.success) {
            alert('Enrollment successful!');
            enrollModal.style.display = 'none';
            enrollForm.reset();
            fetchEvents();
        } else {
            alert('Enrollment failed: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error enrolling in event');
    }
});

// Delete Event
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

// Load events on page load
fetchEvents();
