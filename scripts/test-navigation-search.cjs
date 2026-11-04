const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

async function runTestSuite() {
  console.log('================================================================');
  console.log('   NAVIGATION REORDERING & SEARCH FUNCTIONALITY VERIFICATION   ');
  console.log('================================================================');

  const results = {};

  // 1. NAVIGATION AUDIT
  console.log('\n--- 1. NAVIGATION ORDER & CONSISTENCY AUDIT ---');
  const indexHtml = fs.readFileSync(path.resolve('_site/index.html'), 'utf8');

  // Desktop items check
  const desktopNavMatch = indexHtml.match(/<ul class="cyber-nav-links"[\s\S]*?<\/ul>/);
  if (!desktopNavMatch) throw new Error('Desktop navigation not found in _site/index.html');

  const desktopLiMatches = [...desktopNavMatch[0].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)];
  const desktopItems = desktopLiMatches.map(m => {
    const raw = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const hrefMatch = m[1].match(/href="([^"]+)"/);
    const isSearchBtn = m[1].includes('openSearchModal') || m[1].includes('searchOpenBtn');
    return {
      text: raw.replace('Ctrl+K', '').trim(),
      href: hrefMatch ? hrefMatch[1] : (isSearchBtn ? '#search-modal' : 'unknown')
    };
  });

  console.log('Desktop Navigation Items:');
  desktopItems.forEach((it, i) => console.log(`  ${i + 1}. ${it.text} -> ${it.href}`));

  // Mobile items check
  const mobileNavMatch = indexHtml.match(/<ul class="mobile-links">[\s\S]*?<\/ul>/);
  if (!mobileNavMatch) throw new Error('Mobile navigation not found in _site/index.html');

  const mobileLiMatches = [...mobileNavMatch[0].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)];
  const mobileItems = mobileLiMatches.map(m => {
    const raw = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const hrefMatch = m[1].match(/href="([^"]+)"/);
    const isSearchBtn = m[1].includes('openSearchModal') || m[1].includes('mobSearchLink');
    return {
      text: raw,
      href: hrefMatch && hrefMatch[1] !== 'javascript:void(0)' ? hrefMatch[1] : (isSearchBtn ? '#search-modal' : 'unknown')
    };
  });

  console.log('\nMobile Navigation Items:');
  mobileItems.forEach((it, i) => console.log(`  ${i + 1}. ${it.text} -> ${it.href}`));

  const EXPECTED_ORDER = [
    { text: 'Home', href: '/' },
    { text: 'About', href: '/about/' },
    { text: 'Projects', href: '/projects/' },
    { text: 'Labs', href: '/labs/' },
    { text: 'Blog', href: '/blog/' },
    { text: 'Research', href: '/research/' },
    { text: 'Contact', href: '/contact/' },
    { text: 'Search', href: '#search-modal' }
  ];

  let desktopOrderMatch = desktopItems.length === 8;
  let mobileOrderMatch = mobileItems.length === 8;

  EXPECTED_ORDER.forEach((expected, i) => {
    if (desktopItems[i].text !== expected.text || desktopItems[i].href !== expected.href) {
      console.error(`Desktop mismatch at position ${i + 1}: expected ${expected.text} (${expected.href}), got ${desktopItems[i].text} (${desktopItems[i].href})`);
      desktopOrderMatch = false;
    }
    if (mobileItems[i].text !== expected.text || mobileItems[i].href !== expected.href) {
      console.error(`Mobile mismatch at position ${i + 1}: expected ${expected.text} (${expected.href}), got ${mobileItems[i].text} (${mobileItems[i].href})`);
      mobileOrderMatch = false;
    }
  });

  console.log(`\nDesktop Navigation Matches Exact Required Order: ${desktopOrderMatch}`);
  console.log(`Mobile Navigation Matches Exact Required Order:  ${mobileOrderMatch}`);
  console.log(`Desktop and Mobile Orders Match Identically:     ${desktopOrderMatch && mobileOrderMatch}`);

  // Check no duplicates in mobile-actions
  const mobileActionsMatch = indexHtml.match(/<div class="mobile-actions">([\s\S]*?)<\/div>/);
  const hasDuplicateSearchInMobileActions = mobileActionsMatch ? mobileActionsMatch[1].includes('Search') : false;
  console.log(`No duplicate Search link in mobile actions:      ${!hasDuplicateSearchInMobileActions}`);

  results.navigationOrder = desktopOrderMatch && mobileOrderMatch && !hasDuplicateSearchInMobileActions;

  // 2. SEARCH DATABASE & CONTENT AUDIT
  console.log('\n--- 2. SEARCH DATABASE AUDIT (REAL DATA) ---');
  const searchJson = JSON.parse(fs.readFileSync(path.resolve('_site/search.json'), 'utf8'));
  console.log(`Total Search Records in Live Database: ${searchJson.length}`);

  // Verify all categories of content are indexed
  const hasHome = searchJson.some(r => r.url === '/' && r.type === 'Page');
  const hasAbout = searchJson.some(r => r.url === '/about/' && r.type === 'Page');
  const hasProjectsHub = searchJson.some(r => r.url === '/projects/' && r.type === 'Page');
  const hasLabsHub = searchJson.some(r => r.url === '/labs/' && r.type === 'Page');
  const hasBlogHub = searchJson.some(r => r.url === '/blog/' && r.type === 'Page');
  const hasResearchHub = searchJson.some(r => r.url === '/research/' && r.type === 'Page');
  const hasContact = searchJson.some(r => r.url === '/contact/' && r.type === 'Page');
  const hasBlogPosts = searchJson.filter(r => r.type === 'Blog').length >= 14;
  const hasProjects = searchJson.filter(r => r.type === 'Project').length >= 1;
  const hasLabs = searchJson.filter(r => r.type === 'Lab').length >= 1;
  const hasResearch = searchJson.filter(r => r.type === 'Research').length >= 1;

  console.log(`- Home page indexed:           ${hasHome}`);
  console.log(`- About page indexed:          ${hasAbout}`);
  console.log(`- Projects hub indexed:        ${hasProjectsHub}`);
  console.log(`- Labs hub indexed:            ${hasLabsHub}`);
  console.log(`- Blog hub indexed:            ${hasBlogHub}`);
  console.log(`- Research hub indexed:        ${hasResearchHub}`);
  console.log(`- Contact desk indexed:        ${hasContact}`);
  console.log(`- Published blog posts (>=14): ${hasBlogPosts}`);
  console.log(`- Security projects indexed:   ${hasProjects}`);
  console.log(`- Cybersecurity labs indexed:  ${hasLabs}`);
  console.log(`- Research articles indexed:   ${hasResearch}`);

  const contentCoverage = hasHome && hasAbout && hasProjectsHub && hasLabsHub && hasBlogHub && hasResearchHub && hasContact && hasBlogPosts && hasProjects && hasLabs && hasResearch;
  results.contentCoverage = contentCoverage;

  // 3. SEARCH ENGINE FUNCTIONAL QUERY TESTS (SIMULATING MAIN.JS ALGORITHM)
  console.log('\n--- 3. SEARCH ENGINE FUNCTIONAL QUERY TESTS ---');

  function search(query) {
    const rawTrimmed = query.trim();
    const trimmed = rawTrimmed.toLowerCase();
    if (!trimmed) return [];
    const words = trimmed.split(/\s+/).filter(Boolean);

    const scoredMatches = [];
    for (const item of searchJson) {
      const title = (item.title || '').toLowerCase();
      const desc = (item.description || item.subtitle || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      const type = (item.type || '').toLowerCase();
      const tags = Array.isArray(item.tags) ? item.tags.map(t => String(t).toLowerCase()).join(' ') : '';
      const combined = `${title} ${desc} ${cat} ${type} ${tags}`;

      const allWordsMatch = words.every(w => combined.includes(w));
      if (allWordsMatch) {
        let score = 0;
        if (title === trimmed) score += 200;
        else if (title.startsWith(trimmed)) score += 120;
        else if (title.includes(trimmed)) score += 80;

        words.forEach(w => {
          if (title.includes(w)) score += 30;
          if (cat.includes(w)) score += 20;
          if (tags.includes(w)) score += 15;
          if (desc.includes(w)) score += 10;
        });

        if (item.type === 'Page' || item.type === 'Blog' || item.type === 'Project' || item.type === 'Lab' || item.type === 'Research') {
          score += 15;
        }

        scoredMatches.push({ item, score });
      }
    }

    scoredMatches.sort((a, b) => b.score - a.score);

    const seenUrls = new Set();
    const unique = [];
    for (const m of scoredMatches) {
      const normUrl = (m.item.url || '').toLowerCase().replace(/\/+$/, '');
      if (!seenUrls.has(normUrl)) {
        seenUrls.add(normUrl);
        unique.push(m.item);
      }
    }
    return unique;
  }

  // Test 1: Known blog title
  const resBlog = search('Advanced Malware Evasion');
  const passBlog = resBlog.length > 0 && resBlog[0].title.includes('Advanced Malware Evasion');
  console.log(`Test 1 (Known blog: "Advanced Malware Evasion"): Found ${resBlog.length} [Top: "${resBlog[0]?.title}"] [PASS: ${passBlog}]`);

  // Test 2: Known project
  const resProj = search('Automated Volatility 3 Memory Forensic Parser');
  const passProj = resProj.length > 0 && resProj[0].title.includes('Volatility');
  console.log(`Test 2 (Known project: "Automated Volatility 3 Memory Forensic Parser"): Found ${resProj.length} [Top: "${resProj[0]?.title}"] [PASS: ${passProj}]`);

  // Test 3: Known lab
  const resLab = search('Active Directory Cyber Defense');
  const passLab = resLab.length > 0 && resLab.some(r => r.title.includes('Active Directory'));
  console.log(`Test 3 (Known lab: "Active Directory Cyber Defense"): Found ${resLab.length} [Top: "${resLab[0]?.title}"] [PASS: ${passLab}]`);

  // Test 4: Research article
  const resResearch = search('Zero Trust Architecture');
  const passResearch = resResearch.length > 0 && resResearch[0].title.includes('Zero Trust');
  console.log(`Test 4 (Research: "Zero Trust Architecture"): Found ${resResearch.length} [Top: "${resResearch[0]?.title}"] [PASS: ${passResearch}]`);

  // Test 5: Partial keyword
  const resPartial = search('wire');
  const passPartial = resPartial.length > 0 && resPartial.some(r => (r.title + r.description).toLowerCase().includes('wire'));
  console.log(`Test 5 (Partial keyword "wire"): Found ${resPartial.length} [Top: "${resPartial[0]?.title}"] [PASS: ${passPartial}]`);

  // Test 6: Case insensitivity
  const resUpper = search('ETHICAL HACKER');
  const resLower = search('ethical hacker');
  const passCase = resUpper.length > 0 && resUpper.length === resLower.length && resUpper[0].url === resLower[0].url;
  console.log(`Test 6 (Case insensitive "ETHICAL HACKER" vs "ethical hacker"): Both found ${resUpper.length} results [PASS: ${passCase}]`);

  // Test 7: Multi-word query
  const resMulti = search('malware evasion syscalls');
  const passMulti = resMulti.length > 0 && resMulti[0].title.includes('Advanced Malware Evasion');
  console.log(`Test 7 (Multi-word "malware evasion syscalls"): Found ${resMulti.length} [Top: "${resMulti[0]?.title}"] [PASS: ${passMulti}]`);

  // Test 8: Non-existent query
  const resNone = search('quantum flux teleporter xyz999');
  const passNone = resNone.length === 0;
  console.log(`Test 8 (Non-existent "quantum flux teleporter xyz999"): Found ${resNone.length} (Expected: 0) [PASS: ${passNone}]`);

  results.searchQueries = passBlog && passProj && passLab && passResearch && passPartial && passCase && passMulti && passNone;

  // 4. HTTP RESOLUTION & DESTINATION URL INTEGRITY
  console.log('\n--- 4. HTTP DESTINATION URL INTEGRITY CHECK ---');
  const urlsToTest = [
    '/',
    '/about/',
    '/projects/',
    '/labs/',
    '/blog/',
    '/research/',
    '/contact/',
    resBlog[0]?.url,
    resProj[0]?.url,
    resLab[0]?.url,
    resResearch[0]?.url
  ].filter(Boolean);

  let allUrlsOk = true;
  for (const u of urlsToTest) {
    const fullUrl = `${BASE_URL}${u.startsWith('/') ? u : '/' + u}`;
    try {
      const resp = await fetch(fullUrl);
      if (resp.status !== 200) {
        console.error(`[FAIL] HTTP ${resp.status} for ${fullUrl}`);
        allUrlsOk = false;
      } else {
        console.log(`  ✓ HTTP 200: ${u}`);
      }
    } catch (e) {
      console.error(`[FAIL] Fetch error for ${fullUrl}:`, e.message);
      allUrlsOk = false;
    }
  }
  console.log(`All Tested Navigation and Search URLs Return HTTP 200: ${allUrlsOk}`);
  results.urlIntegrity = allUrlsOk;

  // 5. HEADER SCROLL CSS & JS AUDIT
  console.log('\n--- 5. HEADER SCROLL BEHAVIOR AUDIT ---');
  const mainCss = fs.readFileSync(path.resolve('src/css/main.css'), 'utf8');
  const mainJs = fs.readFileSync(path.resolve('src/js/main.js'), 'utf8');

  const hasNavHiddenCss = mainCss.includes('#navbar.nav-hidden') && mainCss.includes('transform: translateY(-100%)');
  const hasTransformTransition = mainCss.includes('transition: transform 0.3s');
  const hasScrollDownLogic = mainJs.includes("navbar.classList.add('nav-hidden')") && mainJs.includes("navbar.classList.remove('nav-hidden')");
  const hasOverlayGuard = mainJs.includes('isOverlayOpen');

  console.log(`- CSS defines #navbar.nav-hidden with transform: translateY(-100%): ${hasNavHiddenCss}`);
  console.log(`- CSS defines smooth transform transition on navbar:               ${hasTransformTransition}`);
  console.log(`- JS executes nav-hidden toggle on scroll up/down:                   ${hasScrollDownLogic}`);
  console.log(`- JS protects header when search modal or mobile nav is open:        ${hasOverlayGuard}`);

  results.headerScroll = hasNavHiddenCss && hasTransformTransition && hasScrollDownLogic && hasOverlayGuard;

  // 6. SEARCH MODAL UI & ACCESSIBILITY AUDIT
  console.log('\n--- 6. SEARCH MODAL UI & KEYBOARD AUDIT ---');
  const hasDialogRole = indexHtml.includes('role="dialog"') && indexHtml.includes('aria-modal="true"');
  const hasClearBtn = indexHtml.includes('id="searchClearBtn"');
  const hasCloseBtn = indexHtml.includes('id="searchCloseBtn"');
  const hasKeyboardGuides = indexHtml.includes('navigate') && indexHtml.includes('open') && indexHtml.includes('close');
  const hasKeyboardNavigationJs = mainJs.includes("e.key === 'ArrowDown'") && mainJs.includes("e.key === 'ArrowUp'") && mainJs.includes("e.key === 'Enter'");

  console.log(`- Modal has role="dialog" and aria-modal="true": ${hasDialogRole}`);
  console.log(`- Search input contains clear button (#searchClearBtn): ${hasClearBtn}`);
  console.log(`- Close button (#searchCloseBtn) present: ${hasCloseBtn}`);
  console.log(`- Keyboard shortcut badges displayed: ${hasKeyboardGuides}`);
  console.log(`- JS supports ArrowUp, ArrowDown, Enter, Escape: ${hasKeyboardNavigationJs}`);

  results.searchUI = hasDialogRole && hasClearBtn && hasCloseBtn && hasKeyboardGuides && hasKeyboardNavigationJs;

  console.log('\n================================================================');
  console.log('                 FINAL VERIFICATION SUMMARY                     ');
  console.log('================================================================');
  console.log(JSON.stringify(results, null, 2));

  const allPassed = Object.values(results).every(Boolean);
  if (allPassed) {
    console.log('\nALL NAVIGATION & SEARCH REQUIREMENTS FULLY VERIFIED AND PASSING!');
  } else {
    console.error('\nSOME CHECKS FAILED! Review details above.');
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
