// Main JavaScript for Aimad Security Website

function initApp() {
    initHeaderScroll();
    initThemeToggle();
    initMobileNav();
    initSearchModal();
    initScrollTop();
    initScrollReveal();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// 1. Header Scroll Effect
function initHeaderScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    
    const handleScroll = () => {
        if (window.scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
}

// 2. Dark / Light Theme Toggle
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('aimad-theme', newTheme);
    
    updateThemeIcon(newTheme);
}
window.toggleTheme = toggleTheme;

function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-toggle-icon');
    if (icon) {
        if (theme === 'light') {
            icon.className = 'fa-regular fa-sun';
        } else {
            icon.className = 'fa-regular fa-moon';
        }
    }
}

function initThemeToggle() {
    const savedTheme = localStorage.getItem('aimad-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

// 3. Mobile Navigation Drawer
function toggleMobileNav(e) {
    if (e && typeof e.stopPropagation === 'function') {
        e.stopPropagation();
    }
    const mobNav = document.getElementById('mobNav');
    if (mobNav && mobNav.classList.contains('open')) {
        closeMobileNav();
    } else {
        openMobileNav();
    }
}

function openMobileNav() {
    const mobNav = document.getElementById('mobNav');
    const mobOverlay = document.getElementById('mobOverlay');
    const ham = document.getElementById('ham');
    if (mobNav) mobNav.classList.add('open');
    if (mobOverlay) mobOverlay.classList.add('visible');
    if (ham) ham.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
}

function closeMobileNav() {
    const mobNav = document.getElementById('mobNav');
    const mobOverlay = document.getElementById('mobOverlay');
    const ham = document.getElementById('ham');
    if (mobNav) mobNav.classList.remove('open');
    if (mobOverlay) mobOverlay.classList.remove('visible');
    if (ham) ham.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
}

window.toggleMobileNav = toggleMobileNav;
window.openMobileNav = openMobileNav;
window.closeMobileNav = closeMobileNav;

function initMobileNav() {
    const ham = document.getElementById('ham');
    const mobOverlay = document.getElementById('mobOverlay');
    const mobCloseBtn = document.getElementById('mobCloseBtn');
    const mobSearchBtn = document.getElementById('mobSearchBtn');

    if (ham) {
        ham.onclick = function(e) {
            e.preventDefault();
            toggleMobileNav(e);
        };
    }

    if (mobOverlay) {
        mobOverlay.onclick = function(e) {
            e.preventDefault();
            closeMobileNav();
        };
    }

    if (mobCloseBtn) {
        mobCloseBtn.onclick = function(e) {
            e.preventDefault();
            closeMobileNav();
        };
    }

    if (mobSearchBtn) {
        mobSearchBtn.onclick = function(e) {
            e.preventDefault();
            closeMobileNav();
            openSearchModal();
        };
    }

    // Close mobile nav when clicking any link inside
    const mobileLinks = document.querySelectorAll('.mobile-links a, .mobile-actions a:not(#mobSearchBtn)');
    mobileLinks.forEach(link => {
        link.onclick = function() {
            closeMobileNav();
        };
    });

    // Handle Escape key to close
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMobileNav();
        }
    });
}

// 4. Global Search Engine (Modal & Real-time Filter)
let searchRecords = null;

function initSearchModal() {
    // Keyboard shortcut Ctrl+K or Cmd+K
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            openSearchModal();
        } else if (e.key === 'Escape') {
            closeSearchModal();
        }
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            performSearch(e.target.value);
        });
    }

    const searchCloseBtn = document.getElementById('searchCloseBtn');
    if (searchCloseBtn) {
        searchCloseBtn.addEventListener('click', closeSearchModal);
    }

    const searchModal = document.getElementById('searchModal');
    if (searchModal) {
        searchModal.addEventListener('click', (e) => {
            if (e.target === searchModal) {
                closeSearchModal();
            }
        });
    }
}

function openSearchModal() {
    const searchModal = document.getElementById('searchModal');
    if (searchModal) {
        searchModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            if (searchInput.value.trim().length > 0) {
                performSearch(searchInput.value);
            }
        }
    }

    // Lazy load search records once
    if (!searchRecords) {
        fetch('/search.json')
            .then(res => res.json())
            .then(data => {
                searchRecords = data;
                const searchInput = document.getElementById('searchInput');
                if (searchInput && searchInput.value.trim().length > 0) {
                    performSearch(searchInput.value);
                }
            })
            .catch(err => {
                console.error('Failed to load search database:', err);
            });
    }
}

function closeSearchModal() {
    const searchModal = document.getElementById('searchModal');
    if (searchModal) {
        searchModal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function performSearch(query) {
    const resultsContainer = document.getElementById('searchResults');
    if (!resultsContainer) return;

    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
        resultsContainer.innerHTML = '<div style="text-align:center; color:var(--muted); padding:1rem; font-size:0.88rem;">Type a query to search across all records...</div>';
        return;
    }

    if (!searchRecords) {
        resultsContainer.innerHTML = '<div style="text-align:center; color:var(--cyan); padding:1rem; font-size:0.88rem;"><i class="fa-solid fa-spinner fa-spin"></i> Loading search database...</div>';
        return;
    }

    const matches = searchRecords.filter(item => {
        const titleMatch = (item.title || '').toLowerCase().includes(trimmed);
        const descMatch = (item.description || '').toLowerCase().includes(trimmed);
        const catMatch = (item.category || '').toLowerCase().includes(trimmed);
        const typeMatch = (item.type || '').toLowerCase().includes(trimmed);
        const tagsMatch = Array.isArray(item.tags) && item.tags.some(t => String(t).toLowerCase().includes(trimmed));
        return titleMatch || descMatch || catMatch || typeMatch || tagsMatch;
    });

    if (matches.length === 0) {
        resultsContainer.innerHTML = `<div style="text-align:center; color:var(--muted); padding:1.5rem; font-size:0.88rem;">No security records found matching "<strong>${escapeHtml(query)}</strong>".</div>`;
        return;
    }

    resultsContainer.innerHTML = matches.slice(0, 15).map(item => `
        <a href="${item.url}" onclick="closeSearchModal()" style="display:flex; flex-direction:column; gap:4px; padding:0.8rem 1rem; background:rgba(13,26,48,0.6); border:1px solid var(--border); border-radius:8px; text-decoration:none; transition:all 0.2s ease;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-family:'Space Grotesk',sans-serif; font-size:0.95rem; font-weight:600; color:var(--white);">${escapeHtml(item.title || '')}</span>
                <span style="font-family:'JetBrains Mono',monospace; font-size:0.7rem; color:var(--cyan); background:rgba(0,212,255,0.08); padding:2px 8px; border-radius:4px; border:1px solid rgba(0,212,255,0.2);">${escapeHtml(item.type || 'Record')}</span>
            </div>
            ${item.description ? `<p style="font-size:0.82rem; color:var(--silver); margin:0; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${escapeHtml(item.description)}</p>` : ''}
            <div style="display:flex; gap:6px; font-family:'JetBrains Mono',monospace; font-size:0.72rem; color:var(--muted); margin-top:2px;">
                <span><i class="fa-solid fa-folder-open fa-xs"></i> ${escapeHtml(item.category || 'General')}</span>
            </div>
        </a>
    `).join('');
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// 5. Scroll To Top Button
function initScrollTop() {
    const scrollTopBtn = document.getElementById('scroll-top');
    if (!scrollTopBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 350) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    }, { passive: true });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// 6. Scroll Reveal Observer
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        reveals.forEach(el => observer.observe(el));
    } else {
        reveals.forEach(el => el.classList.add('in'));
    }
}
