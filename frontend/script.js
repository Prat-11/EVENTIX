// Categories Data
const categories = [
    { icon: '💻', title: 'Tech Events', desc: 'Hackathons, coding contests, tech talks', color: 'linear-gradient(to right, #3B82F6, #22D3EE)' },
    { icon: '⚽', title: 'Sports', desc: 'Football, cricket, basketball tournaments', color: 'linear-gradient(to right, #10B981, #34D399)' },
    { icon: '🎤', title: 'Musical Nights', desc: 'Concerts, DJ nights, band performances', color: 'linear-gradient(to right, #EC4899, #F472B6)' },
    { icon: '🎬', title: 'Movie Nights', desc: 'Campus screenings and film clubs', color: 'linear-gradient(to right, #8B5CF6, #A78BFA)' },
    { icon: '🏆', title: 'Competitions', desc: 'Quizzes, debates, case competitions', color: 'linear-gradient(to right, #F59E0B, #FBBF24)' },
    { icon: '🎭', title: 'Cultural Events', desc: 'Festivals, drama, dance competitions', color: 'linear-gradient(to right, #EF4444, #F97316)' },
    { icon: '📚', title: 'Workshops', desc: 'Skill sessions and learning events', color: 'linear-gradient(to right, #6366F1, #3B82F6)' },
    { icon: '🎪', title: 'Shows & Performances', desc: 'Stand-up comedy, open mics, talent shows', color: 'linear-gradient(to right, #14B8A6, #10B981)' }
];

// Testimonials Data
const testimonials = [
    { name: 'Alex Chen', role: 'CS Major', text: 'Found my first hackathon through EVENTIX and won! Campus life just got 10x better.', emoji: '🚀' },
    { name: 'Maya Rodriguez', role: 'Dance Team Captain', text: 'Our cultural fest registration tripled after listing on EVENTIX. Game changer!', emoji: '💃' },
    { name: 'Jordan Smith', role: 'Student President', text: 'Managing campus events has never been easier. The platform just works.', emoji: '👑' }
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    renderCategories();
    renderTestimonials();
    initMobileMenu();
    initParticles();
    initScrollLinks();
});

// Theme Toggle
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;
    
    // Check saved theme or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    html.classList.toggle('dark', savedTheme === 'dark');
    updateThemeIcon(savedTheme === 'dark');
    
    themeToggle.addEventListener('click', () => {
        const isDark = html.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateThemeIcon(isDark);
    });
}

function updateThemeIcon(isDark) {
    const icon = document.querySelector('#theme-toggle i');
    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}

// Render Categories
function renderCategories() {
    const grid = document.getElementById('categories-grid');
    
    categories.forEach((category, index) => {
        const card = document.createElement('div');
        card.className = 'category-card animate-float';
        card.style.animationDelay = `${index * 0.1}s`;
        
        card.innerHTML = `
            <div class="category-icon" style="background: ${category.color}">
                ${category.icon}
            </div>
            <h3>${category.title}</h3>
            <p>${category.desc}</p>
        `;
        
        grid.appendChild(card);
    });
}

// Render Testimonials
function renderTestimonials() {
    const grid = document.getElementById('testimonials-grid');
    
    testimonials.forEach((testimonial, index) => {
        const card = document.createElement('div');
        card.className = 'testimonial-card animate-float';
        card.style.animationDelay = `${index * 0.2}s`;
        
        card.innerHTML = `
            <div class="testimonial-header">
                <div class="testimonial-avatar">
                    ${testimonial.name.charAt(0)}
                </div>
                <div class="testimonial-info">
                    <h4>${testimonial.name}</h4>
                    <p>${testimonial.role}</p>
                </div>
                <div class="testimonial-emoji">${testimonial.emoji}</div>
            </div>
            <p class="testimonial-text">"${testimonial.text}"</p>
            <div class="testimonial-stars">
                ${'<i class="fas fa-star"></i>'.repeat(5)}
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// Mobile Menu
function initMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    const closeBtn = document.getElementById('mobile-menu-close');
    const backdrop = menu.querySelector('.mobile-menu-backdrop');
    const links = menu.querySelectorAll('.mobile-menu-link');
    
    function openMenu() {
        menu.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeMenu() {
        menu.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    menuBtn.addEventListener('click', openMenu);
    closeBtn.addEventListener('click', closeMenu);
    backdrop.addEventListener('click', closeMenu);
    
    links.forEach(link => {
        link.addEventListener('click', () => {
            closeMenu();
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                scrollToSection(href.substring(1));
            }
        });
    });
}

// Particles
function initParticles() {
    const container = document.getElementById('particle-background');
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = `${Math.random() * 3 + 1}px`;
        particle.style.height = particle.style.width;
        particle.style.borderRadius = '50%';
        particle.style.background = `rgba(${Math.floor(Math.random() * 100 + 155)}, ${Math.floor(Math.random() * 100 + 155)}, 255, ${Math.random() * 0.3 + 0.1})`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.boxShadow = `0 0 ${particle.style.width} ${particle.style.width} ${particle.style.background}`;
        
        container.appendChild(particle);
        
        animateParticle(particle);
    }
}

function animateParticle(particle) {
    const speedX = (Math.random() - 0.5) * 0.5;
    const speedY = (Math.random() - 0.5) * 0.5;
    
    function move() {
        let x = parseFloat(particle.style.left);
        let y = parseFloat(particle.style.top);
        
        x += speedX;
        y += speedY;
        
        if (x < 0) x = 100;
        if (x > 100) x = 0;
        if (y < 0) y = 100;
        if (y > 100) y = 0;
        
        particle.style.left = `${x}%`;
        particle.style.top = `${y}%`;
        
        requestAnimationFrame(move);
    }
    
    move();
}

// Scroll to Section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const offset = 80; // navbar height
        const elementPosition = section.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

// Initialize Scroll Links
function initScrollLinks() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                scrollToSection(href.substring(1));
            }
        });
    });
}

// Scroll Animation Observer
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements with animation
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.animate-float');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});
