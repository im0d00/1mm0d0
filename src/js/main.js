// Main JavaScript for Aimad Security Website

function initApp() {
    initHeaderScroll();
    initThemeToggle();
    initMobileNav();
    initSearchModal();
    initScrollTop();
    initScrollReveal();
    initCodeBlocks();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// 1. Header Scroll Effect (Smooth Cyber Scrolled State + Auto Hide/Show)
function initHeaderScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    
    let ticking = false;
    let lastScrollY = window.scrollY;
    
    const updateHeader = () => {
        const currentScrollY = window.scrollY;
        const searchModal = document.getElementById('searchModal');
        const mobNav = document.getElementById('mobNav');
        const isOverlayOpen = (searchModal && searchModal.style.display === 'flex') || 
                              (mobNav && mobNav.classList.contains('open'));

        // Deep frosted cyber glass & neon glow when scrolled past top
        if (currentScrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Smooth hide on scroll down, reveal on scroll up
        if (!isOverlayOpen && currentScrollY > 100) {
            if (currentScrollY > lastScrollY + 6) {
                // Scrolling down
                navbar.classList.add('nav-hidden');
            } else if (currentScrollY < lastScrollY - 6) {
                // Scrolling up
                navbar.classList.remove('nav-hidden');
            }
        } else {
            navbar.classList.remove('nav-hidden');
        }
        
        lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
        ticking = false;
    };
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }, { passive: true });
    
    updateHeader();
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
    if (ham) {
        ham.setAttribute('aria-expanded', 'true');
        ham.classList.add('is-active');
    }
    document.body.classList.add('menu-open');
}

function closeMobileNav() {
    const mobNav = document.getElementById('mobNav');
    const mobOverlay = document.getElementById('mobOverlay');
    const ham = document.getElementById('ham');
    if (mobNav) mobNav.classList.remove('open');
    if (mobOverlay) mobOverlay.classList.remove('visible');
    if (ham) {
        ham.setAttribute('aria-expanded', 'false');
        ham.classList.remove('is-active');
    }
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

// 4. Global Search Engine (Modal, Multi-Word, Keyboard Navigation & Real-time Filter)
let searchRecords = null;
let currentSearchResults = [];
let searchSelectedIndex = -1;

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
    const searchClearBtn = document.getElementById('searchClearBtn');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            performSearch(e.target.value);
        });

        // Keyboard navigation inside search input
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                moveSearchSelection(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                moveSearchSelection(-1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                openSelectedSearchResult();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeSearchModal();
            }
        });
    }

    if (searchClearBtn) {
        searchClearBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
                performSearch('');
            }
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
        
        // Ensure navbar is visible when search opens
        const navbar = document.getElementById('navbar');
        if (navbar) navbar.classList.remove('nav-hidden');

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            setTimeout(() => {
                searchInput.focus();
                searchInput.select();
            }, 50);
            if (searchInput.value.trim().length > 0) {
                performSearch(searchInput.value);
            }
        }
    }

    // Lazy load search database
    if (!searchRecords) {
        fetch('/search.json')
            .then(res => res.text())
            .then(text => {
                let data = [];
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    const cleaned = text.replace(/,\s*([\]}])/g, '$1');
                    data = JSON.parse(cleaned);
                }
                const seen = new Set();
                searchRecords = (Array.isArray(data) ? data : []).filter(item => {
                    if (!item || !item.title) return false;
                    const normUrl = (item.url || '').toLowerCase().replace(/\/+$/, '');
                    const key = `${normUrl}::${item.title.trim().toLowerCase()}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                const searchInput = document.getElementById('searchInput');
                if (searchInput && searchInput.value.trim().length > 0) {
                    performSearch(searchInput.value);
                }
            })
            .catch(err => {
                console.error('Failed to load search database:', err);
                const resultsContainer = document.getElementById('searchResults');
                if (resultsContainer) {
                    resultsContainer.innerHTML = '<div style="text-align:center; color:#FF5555; padding:1.5rem; font-size:0.88rem;"><i class="fa-solid fa-triangle-exclamation"></i> Error loading search records. Please try again.</div>';
                }
            });
    }
}

function closeSearchModal() {
    const searchModal = document.getElementById('searchModal');
    if (searchModal) {
        searchModal.style.display = 'none';
        document.body.style.overflow = '';
        searchSelectedIndex = -1;
    }
}

window.openSearchModal = openSearchModal;
window.closeSearchModal = closeSearchModal;

function moveSearchSelection(delta) {
    if (!currentSearchResults || currentSearchResults.length === 0) return;
    const max = currentSearchResults.length;
    searchSelectedIndex = (searchSelectedIndex + delta + max) % max;
    updateSelectionHighlight();
}

function updateSelectionHighlight() {
    const items = document.querySelectorAll('#searchResults .search-result-item');
    items.forEach((item, idx) => {
        if (idx === searchSelectedIndex) {
            item.classList.add('selected');
            item.setAttribute('aria-selected', 'true');
            item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
            item.classList.remove('selected');
            item.removeAttribute('aria-selected');
        }
    });
}

function openSelectedSearchResult() {
    if (!currentSearchResults || currentSearchResults.length === 0) return;
    const targetItem = (searchSelectedIndex >= 0 && searchSelectedIndex < currentSearchResults.length)
        ? currentSearchResults[searchSelectedIndex]
        : currentSearchResults[0];
    if (targetItem && targetItem.url) {
        closeSearchModal();
        window.location.href = targetItem.url;
    }
}

function performSearch(query) {
    const resultsContainer = document.getElementById('searchResults');
    const searchClearBtn = document.getElementById('searchClearBtn');
    const searchStats = document.getElementById('searchStats');
    if (!resultsContainer) return;

    searchSelectedIndex = -1;
    const rawTrimmed = query.trim();
    const trimmed = rawTrimmed.toLowerCase();

    if (searchClearBtn) {
        searchClearBtn.style.display = rawTrimmed.length > 0 ? 'inline-flex' : 'none';
    }

    if (!trimmed) {
        currentSearchResults = [];
        if (searchStats) searchStats.innerText = 'Type keywords to search across all published records';
        resultsContainer.innerHTML = `
            <div style="text-align:center; color:var(--muted); padding:2rem 1rem; font-size:0.9rem;">
                <i class="fa-solid fa-terminal" style="font-size:1.8rem; color:rgba(0,217,255,0.4); margin-bottom:0.75rem; display:block;"></i>
                Type a query to search across all published articles, labs, projects, research papers, and pages...
            </div>
        `;
        return;
    }

    if (!searchRecords) {
        resultsContainer.innerHTML = '<div style="text-align:center; color:#00D9FF; padding:1.5rem; font-size:0.9rem;"><i class="fa-solid fa-spinner fa-spin"></i> Loading search database...</div>';
        return;
    }

    const words = trimmed.split(/\s+/).filter(Boolean);

    // Multi-word scoring algorithm
    const scoredMatches = [];
    for (const item of searchRecords) {
        const title = (item.title || '').toLowerCase();
        const desc = (item.description || item.subtitle || '').toLowerCase();
        const cat = (item.category || '').toLowerCase();
        const type = (item.type || '').toLowerCase();
        const tags = Array.isArray(item.tags) ? item.tags.map(t => String(t).toLowerCase()).join(' ') : '';
        const combined = `${title} ${desc} ${cat} ${type} ${tags}`;

        // Verify EVERY token exists in combined content
        const allWordsMatch = words.every(w => combined.includes(w));
        if (allWordsMatch) {
            let score = 0;
            // Exact full phrase title match
            if (title === trimmed) score += 200;
            else if (title.startsWith(trimmed)) score += 120;
            else if (title.includes(trimmed)) score += 80;

            // Word-level bonus
            words.forEach(w => {
                if (title.includes(w)) score += 30;
                if (cat.includes(w)) score += 20;
                if (tags.includes(w)) score += 15;
                if (desc.includes(w)) score += 10;
            });

            // Prioritize primary pages and actual articles
            if (item.type === 'Page' || item.type === 'Blog' || item.type === 'Project' || item.type === 'Lab' || item.type === 'Research') {
                score += 15;
            }

            scoredMatches.push({ item, score });
        }
    }

    // Sort by relevance score descending
    scoredMatches.sort((a, b) => b.score - a.score);

    // Deduplicate by normalized URL
    const seenUrls = new Set();
    const uniqueMatches = [];
    for (const match of scoredMatches) {
        const normUrl = (match.item.url || '').toLowerCase().replace(/\/+$/, '');
        if (!seenUrls.has(normUrl)) {
            seenUrls.add(normUrl);
            uniqueMatches.push(match.item);
        }
    }

    currentSearchResults = uniqueMatches;

    if (uniqueMatches.length === 0) {
        if (searchStats) searchStats.innerText = '0 records found';
        resultsContainer.innerHTML = `
            <div style="text-align:center; color:var(--muted); padding:2rem 1rem;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size:1.8rem; color:#00D9FF; margin-bottom:0.75rem; display:block;"></i>
                <div style="font-weight:600; color:var(--white); font-size:1rem; margin-bottom:0.4rem;">No matching security records found</div>
                <div style="font-size:0.85rem; color:var(--silver); max-width:440px; margin:0 auto; line-height:1.4;">
                    No results for "<strong>${escapeHtml(rawTrimmed)}</strong>". Try searching for topics like <em>DFIR</em>, <em>Malware</em>, <em>Nmap</em>, <em>Wireshark</em>, <em>Active Directory</em>, <em>Linux</em>, or <em>Zero Trust</em>.
                </div>
            </div>
        `;
        return;
    }

    if (searchStats) {
        searchStats.innerText = `${uniqueMatches.length} record${uniqueMatches.length === 1 ? '' : 's'} found`;
    }

    resultsContainer.innerHTML = uniqueMatches.slice(0, 18).map((item, idx) => `
        <a href="${item.url}" class="search-result-item" data-index="${idx}" onclick="closeSearchModal()" role="option" aria-label="${escapeHtml(item.title || '')}">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem;">
                <span style="font-family:'Space Grotesk',sans-serif; font-size:0.95rem; font-weight:600; color:var(--white); display:flex; align-items:center; gap:0.45rem;">
                    ${getTypeIcon(item.type)}
                    <span>${escapeHtml(item.title || '')}</span>
                </span>
                <span style="font-family:'JetBrains Mono',monospace; font-size:0.68rem; color:#00D9FF; background:rgba(0,212,255,0.08); padding:2px 8px; border-radius:4px; border:1px solid rgba(0,212,255,0.2); white-space:nowrap;">${escapeHtml(item.type || 'Record')}</span>
            </div>
            ${item.description ? `<p style="font-size:0.82rem; color:var(--silver); margin:0; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${escapeHtml(item.description)}</p>` : ''}
            <div style="display:flex; justify-content:space-between; align-items:center; font-family:'JetBrains Mono',monospace; font-size:0.72rem; color:var(--muted); margin-top:2px;">
                <span><i class="fa-solid fa-folder-open fa-xs"></i> ${escapeHtml(item.category || 'General')}</span>
                <span style="color:rgba(0,217,255,0.65);"><i class="fa-solid fa-arrow-right fa-xs"></i> ${escapeHtml(item.url || '')}</span>
            </div>
        </a>
    `).join('');
}

function getTypeIcon(type) {
    switch (type) {
        case 'Blog':
            return '<i class="fa-solid fa-pen-nib" style="color:#00D9FF; font-size:0.85rem;" aria-hidden="true"></i>';
        case 'Project':
            return '<i class="fa-solid fa-folder-open" style="color:#00D9FF; font-size:0.85rem;" aria-hidden="true"></i>';
        case 'Lab':
            return '<i class="fa-solid fa-flask" style="color:#00D9FF; font-size:0.85rem;" aria-hidden="true"></i>';
        case 'Research':
            return '<i class="fa-solid fa-file-contract" style="color:#00D9FF; font-size:0.85rem;" aria-hidden="true"></i>';
        case 'Download':
            return '<i class="fa-solid fa-download" style="color:#00D9FF; font-size:0.85rem;" aria-hidden="true"></i>';
        case 'Certification':
            return '<i class="fa-solid fa-award" style="color:#00D9FF; font-size:0.85rem;" aria-hidden="true"></i>';
        default:
            return '<i class="fa-solid fa-file" style="color:#00D9FF; font-size:0.85rem;" aria-hidden="true"></i>';
    }
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

// 7. Code Blocks Copy & Filename Enhancement
function initCodeBlocks() {
    const codeBlocks = document.querySelectorAll('pre code, .code-block pre');
    codeBlocks.forEach(codeEl => {
        const pre = codeEl.closest('pre');
        if (!pre || pre.querySelector('.code-copy-btn')) return;

        // Ensure parent wrapper style
        if (!pre.parentNode.classList.contains('code-block-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'code-block-wrapper';
            wrapper.style.position = 'relative';
            wrapper.style.margin = '1.5rem 0';
            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(pre);
        }

        const copyBtn = document.createElement('button');
        copyBtn.className = 'code-copy-btn';
        copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
        copyBtn.setAttribute('aria-label', 'Copy code to clipboard');
        copyBtn.style.cssText = 'position:absolute; top:8px; right:8px; background:rgba(0,212,255,0.1); border:1px solid rgba(0,212,255,0.3); color:var(--cyan); font-family:"JetBrains Mono",monospace; font-size:0.75rem; padding:4px 10px; border-radius:4px; cursor:pointer; z-index:5; transition:all 0.2s ease;';

        copyBtn.addEventListener('click', () => {
            const textToCopy = codeEl.innerText || codeEl.textContent;
            navigator.clipboard.writeText(textToCopy).then(() => {
                copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                copyBtn.style.background = 'rgba(0,255,136,0.2)';
                copyBtn.style.borderColor = 'var(--green)';
                copyBtn.style.color = 'var(--green)';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
                    copyBtn.style.background = 'rgba(0,212,255,0.1)';
                    copyBtn.style.borderColor = 'rgba(0,212,255,0.3)';
                    copyBtn.style.color = 'var(--cyan)';
                }, 2000);
            }).catch(err => {
                console.error('Copy error:', err);
            });
        });

        const parentWrapper = pre.closest('.code-block-wrapper') || pre.parentNode;
        parentWrapper.appendChild(copyBtn);
    });
}

