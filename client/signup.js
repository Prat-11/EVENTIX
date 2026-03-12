const API_URL = 'http://localhost:5000/api';


(function() {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let width, height;

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }
    window.addEventListener('resize', resize);
    resize();

    let time = 0;
    function draw() {
        if (!ctx) return;
        time += 0.002;
        const gradient = ctx.createLinearGradient(0, 0, width * 0.8, height);
        gradient.addColorStop(0, '#0f0c0b');
        gradient.addColorStop(0.5, '#1f1512');
        gradient.addColorStop(1, '#0f0c0b');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        const x = Math.sin(time) * 100 + width * 0.3;
        const y = Math.cos(time * 0.7) * 70 + height * 0.6;
        const radGrad = ctx.createRadialGradient(x, y, 50, x + 100, y + 80, 400);
        radGrad.addColorStop(0, 'rgba(225, 59, 46, 0.06)');
        radGrad.addColorStop(0.7, 'rgba(10, 8, 7, 0.3)');
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, width, height);

        requestAnimationFrame(draw);
    }
    draw();
})();


const form = document.querySelector('form');
const nameInput = document.querySelector('input[type="text"]');
const emailInput = document.querySelector('input[type="email"]');
const passwordInput = document.querySelectorAll('input[type="password"]')[0];
const confirmPasswordInput = document.querySelectorAll('input[type="password"]')[1];

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    
    if (!name || !email || !password || !confirmPassword) {
        alert('Please fill in all fields');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Account created successfully! Redirecting...');
            
            localStorage.setItem('user', JSON.stringify(data.data));
            
            
            if (data.data.isAdmin) {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'currevents.html';
            }
        } else {
            alert('Registration failed: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error creating account. Please try again.');
    }
});