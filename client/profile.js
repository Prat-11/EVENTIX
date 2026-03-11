(function() {
    // ========== ANIMATED BACKGROUND (same as homepage) ==========
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
    
    // --- Avatar Upload ---
    const avatarUploadBtn = document.getElementById('avatarUploadBtn');
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');

    // Trigger file input when avatar wrapper is clicked
    avatarUploadBtn.addEventListener('click', () => {
        avatarInput.click();
    });

    // Handle file selection
    avatarInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                avatarPreview.src = event.target.result;
                // Show success message (optional)
                showToast('Profile picture updated');
            };
            reader.readAsDataURL(file);
        }
    });

    // --- Form Submission (Save Changes) ---
    const profileForm = document.getElementById('profileForm');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    // Load saved data from localStorage if exists
    function loadSavedProfile() {
        const savedData = localStorage.getItem('eventixProfile');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // Set form fields (except email - keep original)
            document.getElementById('fullName').value = data.fullName || 'Alex Morgan';
            document.getElementById('phone').value = data.phone || '+1 (555) 123-4567';
            document.getElementById('dob').value = data.dob || '1995-06-15';
            document.getElementById('location').value = data.location || 'New York, NY';
            document.getElementById('bio').value = data.bio || 'Music enthusiast, event organizer, and comedy lover. Always looking for the next great experience!';
            
            // Set avatar if exists
            if (data.avatar) {
                avatarPreview.src = data.avatar;
            }
            
            // Set interests checkboxes
            if (data.interests) {
                document.querySelectorAll('input[name="interests"]').forEach(cb => {
                    cb.checked = data.interests.includes(cb.value);
                });
            }
            
            // Set notification preference
            if (data.notifications) {
                const radio = document.querySelector(`input[name="notifications"][value="${data.notifications}"]`);
                if (radio) radio.checked = true;
            }
        }
    }

    // Save form data to localStorage
    function saveProfileData() {
        // Collect interests
        const interests = [];
        document.querySelectorAll('input[name="interests"]:checked').forEach(cb => {
            interests.push(cb.value);
        });
        
        // Get notification preference
        const notificationPref = document.querySelector('input[name="notifications"]:checked')?.value || 'all';
        
        const profileData = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value, // included but not editable
            phone: document.getElementById('phone').value,
            dob: document.getElementById('dob').value,
            location: document.getElementById('location').value,
            bio: document.getElementById('bio').value,
            avatar: avatarPreview.src,
            interests: interests,
            notifications: notificationPref
        };
        
        localStorage.setItem('eventixProfile', JSON.stringify(profileData));
        showToast('Profile saved successfully!', 'success');
    }

    // Show toast notification
    function showToast(message, type = 'success') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.innerHTML = `
            <i class="fa-regular ${type === 'success' ? 'fa-circle-check' : 'fa-circle-info'}"></i>
            <span>${message}</span>
        `;
        
        // Style the toast
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
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Add animation styles for toast
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

    // Handle form submit
    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveProfileData();
    });

    // Handle save button click (as backup)
    saveBtn.addEventListener('click', function(e) {
        e.preventDefault();
        saveProfileData();
    });

    // Handle cancel button
    cancelBtn.addEventListener('click', function() {
        if (confirm('Discard unsaved changes?')) {
            loadSavedProfile(); // Reload saved data
            showToast('Changes discarded', 'info');
        }
    });

    // --- Danger Zone Actions ---
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const deactivateBtn = document.getElementById('deactivateBtn');

    changePasswordBtn.addEventListener('click', function() {
        alert('🔒 Password change request sent to your email (demo)');
    });

    deactivateBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to deactivate your account? This action can be reversed later.')) {
            alert('Account deactivation requested (demo)');
        }
    });

    // Load saved profile on page load
    loadSavedProfile();

    // Double click on logo effect (same as homepage)
    document.querySelector('.logo').addEventListener('dblclick', function(){
        this.style.transform = 'scale(1.05)';
        setTimeout(() => this.style.transform = 'scale(1)', 200);
    });

    // Form validation (optional)
    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', function(e) {
        // Simple phone formatting (optional)
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 0) {
            if (value.length <= 3) {
                value = `+1 (${value}`;
            } else if (value.length <= 6) {
                value = `+1 (${value.slice(0,3)}) ${value.slice(3)}`;
            } else {
                value = `+1 (${value.slice(0,3)}) ${value.slice(3,6)}-${value.slice(6,10)}`;
            }
            e.target.value = value;
        }
    });
})();