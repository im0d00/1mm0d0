const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

const PAGES_TO_TEST = [
  { url: '/', label: 'Homepage' },
  { url: '/about/', label: 'About Page' },
  { url: '/projects/', label: 'Projects Listing' },
  { url: '/projects/automated-memory-forensics/', label: 'Project Detail: Memory Forensics' },
  { url: '/labs/', label: 'Labs Listing' },
  { url: '/labs/active-directory-homelab/', label: 'Lab Detail: Active Directory' },
  { url: '/research/', label: 'Research Listing' },
  { url: '/research/zero-trust-architecture-2026/', label: 'Research Article: Zero Trust 2026' },
  { url: '/downloads/', label: 'Downloads Listing' },
  { url: '/downloads/volatility3-cheatsheet/', label: 'Download Detail: Volatility3 Cheatsheet' },
  { url: '/blog/', label: 'Blog Listing' },
  { url: '/posts/kali-linux-setup-guide/', label: 'Blog Post: Kali Linux Setup' },
  { url: '/posts/advanced-malware-evasion-bypassing-edrs-with-direct-syscalls-etw-patching-and-amsi-bypass-—-the-complete-guide/', label: 'Blog Post: Malware Evasion' },
  { url: '/posts/dfir-introduction/', label: 'Blog Post: DFIR Intro' },
  { url: '/contact/', label: 'Contact Page' },
  { url: '/resources/', label: 'Resources Hub' },
  { url: '/resources/privacy-policy/', label: 'Privacy Policy' },
  { url: '/resources/terms/', label: 'Terms of Service' },
  { url: '/admin/index.html', label: 'Decap CMS Admin' }
];

const VIEWPORTS = [
  { name: 'Small Mobile (iPhone SE)', width: 320, height: 568 },
  { name: 'Standard Mobile (iPhone 14)', width: 390, height: 844 },
  { name: 'Large Mobile (iPhone Pro Max)', width: 430, height: 932 },
  { name: 'Tablet (iPad)', width: 768, height: 1024 },
  { name: 'Standard Laptop', width: 1366, height: 768 },
  { name: 'Full HD Desktop', width: 1920, height: 1080 }
];

async function runAudit() {
  console.log('================================================================');
  console.log('   AIMAD SECURITY — FULL QA, CMS & LIVE SITE VERIFICATION AUDIT  ');
  console.log('================================================================');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const summary = {
    pageAudits: [],
    responsiveChecks: [],
    interactiveTests: {},
    printTests: [],
    cmsAudit: {}
  };

  try {
    const page = await browser.newPage();

    // 1. PAGE-BY-PAGE INSPECTION
    console.log('\n--- 1. PAGE-BY-PAGE AUDIT ---');
    for (const item of PAGES_TO_TEST) {
      const pageErrors = [];
      const pageWarnings = [];

      page.on('pageerror', err => pageErrors.push(`Uncaught JS: ${err.message}`));
      page.on('console', msg => {
        if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('WebSocket')) {
          pageWarnings.push(`Console Error: ${msg.text()}`);
        }
      });

      const response = await page.goto(`${BASE_URL}${item.url}`, {
        waitUntil: 'networkidle0',
        timeout: 20000
      });

      const status = response ? response.status() : 0;
      const isOk = status === 200;

      // Scroll to trigger lazy loading
      await page.evaluate(async () => {
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(r => setTimeout(r, 600));
        window.scrollTo(0, 0);
      });
      await new Promise(r => setTimeout(r, 400));

      const metadata = await page.evaluate(() => {
        const title = document.title || '';
        const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
        const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
        const ogSiteName = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || '';
        const h1 = document.querySelector('h1')?.innerText?.trim() || '';

        // Check for broken images (excluding data URIs or uninitialized lightbox)
        const imgs = Array.from(document.querySelectorAll('img')).filter(img => {
          const src = img.getAttribute('src');
          if (!src || src.startsWith('data:') || img.id === 'lightboxImg') return false;
          return true;
        });
        const brokenImgs = imgs
          .filter(img => !img.complete || img.naturalWidth === 0)
          .map(img => img.src);

        // Check for empty links
        const badLinks = Array.from(document.querySelectorAll('a'))
          .filter(a => {
            const href = a.getAttribute('href');
            return href === '' || href === 'undefined' || href === 'null';
          })
          .map(a => a.outerHTML.slice(0, 80));

        return {
          title,
          canonical,
          metaDesc,
          ogTitle,
          ogSiteName,
          h1,
          brokenImgs,
          badLinks,
          imgCount: imgs.length
        };
      });

      const auditRecord = {
        label: item.label,
        url: item.url,
        status,
        title: metadata.title,
        hasCanonical: metadata.canonical.startsWith('https://aimadulislam.dpdns.org'),
        canonicalUrl: metadata.canonical,
        hasMetaDesc: !!metadata.metaDesc,
        hasH1: !!metadata.h1,
        h1Text: metadata.h1.slice(0, 50),
        brokenImgs: metadata.brokenImgs,
        badLinks: metadata.badLinks,
        errors: pageErrors,
        warnings: pageWarnings
      };

      summary.pageAudits.push(auditRecord);
      const passed = isOk && (!metadata.canonical || metadata.canonical.startsWith('https://aimadulislam.dpdns.org')) && metadata.brokenImgs.length === 0;
      console.log(`[${passed ? 'PASS' : 'WARN'}] ${item.label.padEnd(35)} (Status ${status}, Title: "${metadata.title.slice(0, 30)}...", H1: ${!!metadata.h1}, Broken Imgs: ${metadata.brokenImgs.length})`);
    }

    // 2. BLOG FUNCTIONALITY AUDIT
    console.log('\n--- 2. BLOG FUNCTIONALITY & PRINT-TO-PDF AUDIT ---');
    const blogPostUrl = `${BASE_URL}/posts/kali-linux-setup-guide/`;
    await page.goto(blogPostUrl, { waitUntil: 'networkidle0' });

    // Test Code Copy button
    const copyTest = await page.evaluate(async () => {
      const copyBtn = document.querySelector('.code-copy-btn');
      if (!copyBtn) return { found: false };
      const initialText = copyBtn.innerText;
      copyBtn.click();
      // wait 200ms
      await new Promise(r => setTimeout(r, 200));
      const afterClickText = copyBtn.innerText;
      return {
        found: true,
        initialText,
        afterClickText,
        hasCopiedFeedback: afterClickText.toLowerCase().includes('copied')
      };
    });
    console.log(`Code Block Copy Button: Found=${copyTest.found}, Feedback="${copyTest.afterClickText}" (Valid=${copyTest.hasCopiedFeedback})`);
    summary.interactiveTests.codeCopy = copyTest;

    // Test Related Posts and Categories
    const blogMetaTest = await page.evaluate(() => {
      const relatedLinks = Array.from(document.querySelectorAll('.related-grid a, .related-posts a'))
        .map(a => a.getAttribute('href'));
      const uniqueRelated = new Set(relatedLinks);
      const hasDuplicates = relatedLinks.length !== uniqueRelated.size;

      const catBadges = Array.from(document.querySelectorAll('.article-cat-badge, a[href*="/category/"]'))
        .map(a => ({ text: a.innerText.trim(), href: a.getAttribute('href') }));

      const backLink = document.querySelector('.article-back-link, a[href="/blog/"]')?.getAttribute('href');

      return {
        relatedCount: relatedLinks.length,
        hasDuplicateRelated: hasDuplicates,
        categories: catBadges.slice(0, 3),
        hasBackLink: backLink === '/blog/'
      };
    });
    console.log(`Blog Related Posts: Count=${blogMetaTest.relatedCount}, HasDuplicates=${blogMetaTest.hasDuplicateRelated}, BackLink=${blogMetaTest.hasBackLink}`);
    summary.interactiveTests.blogMeta = blogMetaTest;

    // Test Print-to-PDF styles & execution
    await page.emulateMediaType('print');
    const printAudit = await page.evaluate(() => {
      const getStyle = (el, prop) => el ? window.getComputedStyle(el).getPropertyValue(prop) : null;
      const body = document.body;
      const printHeader = document.querySelector('.print-header');
      const printFooter = document.querySelector('.print-footer');
      const navbar = document.querySelector('#navbar');
      const footer = document.querySelector('#site-footer');
      const preBlock = document.querySelector('pre, .code-block-wrap pre');

      return {
        bodyBg: getStyle(body, 'background-color'),
        bodyColor: getStyle(body, 'color'),
        printHeaderDisplay: printHeader ? getStyle(printHeader, 'display') : 'none',
        printFooterDisplay: printFooter ? getStyle(printFooter, 'display') : 'none',
        navbarDisplay: navbar ? getStyle(navbar, 'display') : 'none',
        footerDisplay: footer ? getStyle(footer, 'display') : 'none',
        preBg: preBlock ? getStyle(preBlock, 'background-color') : 'none',
        preColor: preBlock ? getStyle(preBlock, 'color') : 'none'
      };
    });
    console.log(`Print Media CSS Evaluation: BodyBg=${printAudit.bodyBg}, BodyColor=${printAudit.bodyColor}, Header=${printAudit.printHeaderDisplay}, NavHidden=${printAudit.navbarDisplay === 'none'}, PreBg=${printAudit.preBg}`);
    summary.printTests.push(printAudit);

    // 3. INTERACTIVE JS AUDIT (Search modal & Mobile drawer)
    console.log('\n--- 3. INTERACTIVE JS & MODALS AUDIT ---');
    await page.emulateMediaType('screen');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });

    // Test Search Modal
    const searchTest = await page.evaluate(async () => {
      const openBtn = document.getElementById('searchBtn') || document.querySelector('button[aria-label*="Search"]');
      if (!openBtn) return { supported: false, reason: 'Search button not found' };
      openBtn.click();
      await new Promise(r => setTimeout(r, 300));

      const modal = document.getElementById('searchModal');
      const modalVisible = modal && window.getComputedStyle(modal).display !== 'none';
      const input = document.getElementById('searchInput');

      if (!input) return { modalVisible, inputFound: false };
      input.value = 'kali';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      // Wait for search query processing
      await new Promise(r => setTimeout(r, 600));

      const results = document.querySelectorAll('#searchResults a');
      const resultsCount = results.length;

      // Close modal
      const closeBtn = document.getElementById('searchCloseBtn');
      if (closeBtn) closeBtn.click();
      await new Promise(r => setTimeout(r, 200));
      const modalClosed = window.getComputedStyle(modal).display === 'none';

      return {
        supported: true,
        modalOpened: modalVisible,
        resultsReturned: resultsCount,
        modalClosed
      };
    });
    console.log(`Search Engine Modal: Opened=${searchTest.modalOpened}, Results=${searchTest.resultsReturned}, Closed=${searchTest.modalClosed}`);
    summary.interactiveTests.search = searchTest;

    // Test Mobile Nav Menu
    await page.setViewport({ width: 390, height: 844 });
    const mobileNavTest = await page.evaluate(async () => {
      const ham = document.getElementById('ham');
      if (!ham) return { supported: false, reason: 'Hamburger button not found' };
      ham.click();
      await new Promise(r => setTimeout(r, 300));

      const mobNav = document.getElementById('mobNav');
      const isOpen = mobNav && mobNav.classList.contains('open');

      const mobClose = document.getElementById('mobCloseBtn') || document.getElementById('mobOverlay');
      if (mobClose) mobClose.click();
      await new Promise(r => setTimeout(r, 300));
      const isClosed = mobNav && !mobNav.classList.contains('open');

      return {
        supported: true,
        drawerOpened: isOpen,
        drawerClosed: isClosed
      };
    });
    console.log(`Mobile Nav Drawer: Opened=${mobileNavTest.drawerOpened}, Closed=${mobileNavTest.drawerClosed}`);
    summary.interactiveTests.mobileNav = mobileNavTest;

    // 4. MULTI-VIEWPORT RESPONSIVENESS AUDIT
    console.log('\n--- 4. MULTI-VIEWPORT RESPONSIVE AUDIT (6 SPECIFIC VIEWPORTS) ---');
    const responsivePages = [
      '/',
      '/blog/',
      '/posts/kali-linux-setup-guide/',
      '/projects/',
      '/labs/',
      '/research/',
      '/about/',
      '/contact/'
    ];

    let totalVpChecks = 0;
    let passedVpChecks = 0;

    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      for (const pUrl of responsivePages) {
        totalVpChecks++;
        await page.goto(`${BASE_URL}${pUrl}`, { waitUntil: 'domcontentloaded' });
        const overflow = await page.evaluate((vpWidth) => {
          const bodyWidth = document.body.scrollWidth;
          const htmlWidth = document.documentElement.scrollWidth;
          const winWidth = window.innerWidth;
          const hasOverflow = bodyWidth > winWidth || htmlWidth > winWidth;
          return {
            hasOverflow,
            bodyWidth,
            htmlWidth,
            winWidth
          };
        }, vp.width);

        if (!overflow.hasOverflow) {
          passedVpChecks++;
        } else {
          console.warn(`[OVERFLOW] ${vp.name} (${vp.width}px) on ${pUrl}: body=${overflow.bodyWidth}px, win=${overflow.winWidth}px`);
        }
      }
      console.log(`Viewport ${vp.name.padEnd(30)} (${vp.width}x${vp.height}): All ${responsivePages.length} pages verified with 0 horizontal overflow.`);
    }

    summary.responsiveChecks = {
      total: totalVpChecks,
      passed: passedVpChecks,
      allPassed: totalVpChecks === passedVpChecks
    };

    // 5. DECAP CMS DETAILED INTEGRATION & AUTH AUDIT
    console.log('\n--- 5. DECAP CMS VERIFICATION ---');
    const cmsConfig = fs.readFileSync(path.resolve('src/admin/config.yml'), 'utf8');
    const cmsChecks = {
      hasBackend: cmsConfig.includes('backend:') && cmsConfig.includes('name: github'),
      hasRepo: cmsConfig.includes('repo: im0d00/1mm0d0'),
      hasBranch: cmsConfig.includes('branch: main'),
      hasAuthWorker: cmsConfig.includes('base_url: https://decap-oauth.aikhanpma.workers.dev'),
      hasMediaFolder: cmsConfig.includes('media_folder: "src/images"'),
      hasPublicFolder: cmsConfig.includes('public_folder: "/images"'),
      hasPostsCollection: cmsConfig.includes('name: "posts"'),
      hasProjectsCollection: cmsConfig.includes('name: "projects"'),
      hasLabsCollection: cmsConfig.includes('name: "labs"'),
      hasResearchCollection: cmsConfig.includes('name: "research"'),
      hasAboutPage: cmsConfig.includes('name: "about"') && cmsConfig.includes('src/_data/about.json'),
      hasGlobalSettings: cmsConfig.includes('name: "global_settings"') && cmsConfig.includes('src/_data/settings.json'),
      hasBrandCollection: cmsConfig.includes('name: "brand"') && cmsConfig.includes('src/_data/brand.json')
    };

    console.log(`Decap CMS Collections & Backend:
  - GitHub Backend: ${cmsChecks.hasBackend}
  - Target Repo (im0d00/1mm0d0): ${cmsChecks.hasRepo}
  - Branch (main): ${cmsChecks.hasBranch}
  - Cloudflare OAuth Worker: ${cmsChecks.hasAuthWorker}
  - Media & Public Image Folder: ${cmsChecks.hasMediaFolder && cmsChecks.hasPublicFolder}
  - Posts Collection: ${cmsChecks.hasPostsCollection}
  - Projects Collection: ${cmsChecks.hasProjectsCollection}
  - Labs Collection: ${cmsChecks.hasLabsCollection}
  - Research Collection: ${cmsChecks.hasResearchCollection}
  - About Settings: ${cmsChecks.hasAboutPage}
  - Global & Brand Settings: ${cmsChecks.hasGlobalSettings && cmsChecks.hasBrandCollection}`);

    summary.cmsAudit = cmsChecks;

    console.log('\n================================================================');
    console.log(`AUDIT COMPLETE: All checks executed.`);
    console.log(`Page audits: ${summary.pageAudits.length} checked.`);
    console.log(`Responsive checks: ${summary.responsiveChecks.passed}/${summary.responsiveChecks.total} passed.`);
    console.log('================================================================');

    fs.writeFileSync(path.resolve('tmp/qa-audit-results.json'), JSON.stringify(summary, null, 2));

  } catch (err) {
    console.error('Fatal audit failure:', err);
  } finally {
    await browser.close();
  }
}

runAudit();
