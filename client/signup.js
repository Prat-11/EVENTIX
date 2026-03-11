// script.js
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

    // very subtle moving gradient (similar to your dark theme with a hint of red)
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

        // faint red glow (moving)
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