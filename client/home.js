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

    
    const slides = document.querySelectorAll('.slide');
    const slidesContainer = document.getElementById('carouselSlides');
    const leftArrow = document.getElementById('leftArrow');
    const rightArrow = document.getElementById('rightArrow');
    const dots = document.querySelectorAll('.dot');
    let currentIndex = 0;
    const totalSlides = slides.length;
    
    function updateCarousel(index) {
        if (index < 0) index = totalSlides - 1;
        if (index >= totalSlides) index = 0;
        currentIndex = index;
        slidesContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
        dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
    }
    
    leftArrow.addEventListener('click', () => updateCarousel(currentIndex - 1));
    rightArrow.addEventListener('click', () => updateCarousel(currentIndex + 1));
    dots.forEach((dot, idx) => dot.addEventListener('click', () => updateCarousel(idx)));
    
    let autoPlay = setInterval(() => updateCarousel(currentIndex + 1), 5200);
    const carousel = document.getElementById('carousel');
    carousel.addEventListener('mouseenter', () => clearInterval(autoPlay));
    carousel.addEventListener('mouseleave', () => {
        autoPlay = setInterval(() => updateCarousel(currentIndex + 1), 5200);
    });

    
    function refreshCounts() {
        document.querySelectorAll('.event-count').forEach(el => {
            let base = Math.floor(Math.random() * 42) + 18;
            el.innerText = base + ' events';
        });
    }
    setInterval(refreshCounts, 9000);
    setTimeout(refreshCounts, 1800);

    
    const container = document.getElementById('eventCardsContainer');
    const demoEvents = [
        { name: 'Neon Rooftop', genre: 'House / Electronic', date: 'May 24 • 9pm', price: '₹999', img: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=2069&auto=format&fit=crop' },
        { name: 'Laugh therapy', genre: 'Comedy with Aditi', date: 'May 26 • 7:30pm', price: '₹599', img: 'https://images.unsplash.com/photo-1585699324551-f6f309eed430?q=80&w=2070&auto=format&fit=crop' },
        { name: 'Sip & script', genre: 'Wine + writing', date: 'May 28 • 6pm', price: '₹1299', img: 'https://images.unsplash.com/photo-1519671282429-b44660ead0a7?q=80&w=2070&auto=format&fit=crop' },
        { name: 'Bhangra beats', genre: 'Fusion fest', date: 'June 2 • 8pm', price: '₹799', img: 'https://images.unsplash.com/photo-1524368535928-5b5e00dd8c5c?q=80&w=2070&auto=format&fit=crop' }
    ];
    
    let html = '';
    demoEvents.forEach(ev => {
        html += `<div class="event-card">
            <div class="event-img" style="background-image: url('${ev.img}');"><span class="event-label">🔥 trending</span></div>
            <div class="event-info">
                <h4>${ev.name}</h4>
                <div class="event-meta"><i class="fa-regular fa-calendar"></i> ${ev.date}</div>
                <div class="event-meta"><i class="fa-regular fa-clock"></i> ${ev.genre}</div>
                <div class="price">${ev.price}</div>
                <button class="book-btn book-dynamic"><i class="fa-regular fa-hand-pointer"></i> book</button>
            </div>
        </div>`;
    });
    container.innerHTML = html;
    
    document.querySelectorAll('.book-dynamic').forEach(b => 
        b.addEventListener('click', () => alert('✨ (demo) ticket reservation!'))
    );

    
    document.getElementById('subscribeBtn').addEventListener('click', () => {
        const email = document.getElementById('newsletterEmail').value.trim();
        if (email.includes('@') && email.includes('.')) {
            alert(`🎉 Welcome ${email.split('@')[0]}! You're part of Eventix.`);
            document.getElementById('newsletterEmail').value = '';
        } else {
            alert('📧 please enter a valid email (demo)');
        }
    });

    
    document.querySelector('.logo').addEventListener('dblclick', function(){
        this.style.transform = 'scale(1.05)';
        setTimeout(() => this.style.transform = 'scale(1)', 200);
    });
})();



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
    const signInBtn = document.querySelector('.btn-outline');
    if (currentUser && signInBtn) {
       
        signInBtn.innerHTML = `<img src="${currentUser.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.name) + '&size=40&background=e13b2e&color=fff&rounded=true'}" alt="${currentUser.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #e13b2e;">`;
        signInBtn.style.padding = '0.25rem';
        signInBtn.onclick = (e) => {
            e.preventDefault();
            window.location.href = 'profile.html';
        };
    } else if (signInBtn) {
        signInBtn.onclick = (e) => {
            e.preventDefault();
            window.location.href = 'login.html';
        };
    }
});