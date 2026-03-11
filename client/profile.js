const API_URL = 'http://localhost:5000/api';

// Check if user is logged in
let currentUser = null;
try {
    const userData = localStorage.getItem('user');
    if (userData) {
        currentUser = JSON.parse(userData);
    } else {
        // Redirect to login if not logged in
        window.location.href = 'login.html';
    }
} catch (error) {
    console.error('Error loading user data:', error);
    window.location.href = 'login.html';
}

(function() {
    // ========== ANIMATED BACKGROUND ==========
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
            
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.shadowBlur = 0;
            
            p.x += p.speedX;
            p.y += p.speedY;
            
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;
        });
        
        ctx.globalAlpha = 0.03;
        ctx.strokeStyle = '#e13b2e';
        ctx.lineWidth = 0.8;
        for (let i = 0; i < particles.length; i+=3) {
            for (let j = i+1; j < particles.length; j+=5) {
                let dx = particles[i].x - particles[j].x;
                let dy = particles[i].y - particles[j].y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        ctx.globalAlpha = 1.0;
        
        requestAnimationFrame(drawParticles);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    drawParticles();

    // ========== PROFILE PAGE FUNCTIONALITY ==========
    
    const avatarUploadBtn = document.getElementById('avatarUploadBtn');
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');
    const profileForm = document.getElementById('profileForm');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    // Load user profile from backend
    async function loadUserProfile() {
        try {
            const response = await fetch(`${API_URL}/users/${currentUser.id}`);
            const data = await response.json();
            
            if (data.success) {
                const profile = data.data;
                
                // Set form fields
                document.getElementById('fullName').value = profile.name || '';
                document.getElementById('email').value = profile.email || '';
                document.getElementById('phone').value = profile.phone || '';
                document.getElementById('dob').value = profile.dob || '';
                document.getElementById('location').value = profile.location || '';
                document.getElementById('bio').value = profile.bio || '';
                
                // Set avatar
                if (profile.avatar) {
                    avatarPreview.src = profile.avatar;
                }
                
                // Set interests
                if (profile.interests && profile.interests.length > 0) {
                    document.querySelectorAll('input[name="interests"]').forEach(cb => {
                        cb.checked = profile.interests.includes(cb.value);
                    });
                }
                
                // Set notifications
                if (profile.notifications) {
                    const radio = document.querySelector(`input[name="notifications"][value="${profile.notifications}"]`);
                    if (radio) radio.checked = true;
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            showToast('Error loading profile', 'error');
        }
    }

    // Avatar upload
    avatarUploadBtn.addEventListener('click', () => {
        avatarInput.click();
    });

    avatarInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                avatarPreview.src = event.target.result;
                showToast('Profile picture updated');
            };
            reader.readAsDataURL(file);
        }
    });

    // Save profile
    async function saveProfileData() {
        const interests = [];
        document.querySelectorAll('input[name="interests"]:checked').forEach(cb => {
            interests.push(cb.value);
        });
        
        const notificationPref = document.querySelector('input[name="notifications"]:checked')?.value || 'all';
        
        const profileData = {
            name: document.getElementById('fullName').value,
            avatar: avatarPreview.src,
            phone: document.getElementById('phone').value,
            dob: document.getElementById('dob').value,
            location: document.getElementById('location').value,
            bio: document.getElementById('bio').value,
            interests: interests,
            notifications: notificationPref
        };
        
        try {
            const response = await fetch(`${API_URL}/users/${currentUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update localStorage
                currentUser.name = profileData.name;
                currentUser.avatar = profileData.avatar;
                localStorage.setItem('user', JSON.stringify(currentUser));
                
                showToast('Profile saved successfully!', 'success');
            } else {
                showToast('Failed to save profile: ' + data.error, 'error');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            showToast('Error saving profile', 'error');
        }
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.innerHTML = `
            <i class="fa-regular ${type === 'success' ? 'fa-circle-check' : 'fa-circle-xmark'}"></i>
            <span>${message}</span>
        `;
        
        toast.style.position = 'fixed';
        toast.style.bottom = '30px';
        toast.style.right = '30px';
        toast.style.background = type === 'success' ? '#10b981' : '#e13b2e';
        toast.style.color = 'white';
        toast.style.padding = '1rem 2rem';
        toast.style.borderRadius = '60px';
        toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
        toast.style.zIndex = '9999';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '0.8rem';
        toast.style.fontWeight = '500';
        toast.style.animation = 'slideIn 0.3s ease';
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveProfileData();
    });

    saveBtn.addEventListener('click', function(e) {
        e.preventDefault();
        saveProfileData();
    });

    cancelBtn.addEventListener('click', function() {
        if (confirm('Discard unsaved changes?')) {
            loadUserProfile();
            showToast('Changes discarded', 'info');
        }
    });

    // Danger zone actions
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const deactivateBtn = document.getElementById('deactivateBtn');

    changePasswordBtn.addEventListener('click', function() {
        alert('🔒 Password change feature coming soon!');
    });

    deactivateBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to deactivate your account?')) {
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        }
    });

    // Load profile on page load
    loadUserProfile();
})();