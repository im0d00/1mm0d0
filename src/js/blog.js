// Blog Interactivity Script
document.addEventListener('DOMContentLoaded', () => {
    // Mobile Navigation Toggle
    const ham = document.getElementById('ham');
    const mobNav = document.getElementById('mobNav');
    if (ham && mobNav) {
        ham.addEventListener('click', () => {
            mobNav.classList.toggle('open');
        });
    }

    // Dark Mode Toggle
    const darkModeBtn = document.getElementById('dark-mode-btn');
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            darkModeBtn.innerHTML = isLight ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        });
    }

    // Scroll to Top Button
    const scrollTopBtn = document.getElementById('scroll-top');
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        });
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Reading Progress Indicator
    const progress = document.getElementById('reading-progress');
    if (progress) {
        window.addEventListener('scroll', () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
            progress.style.width = scrolled + '%';
        });
    }
});
