const puppeteer = require('puppeteer');

const viewports = [
  { name: 'Mobile Small (iPhone SE)', width: 375, height: 667 },
  { name: 'Mobile Standard (iPhone 14)', width: 390, height: 844 },
  { name: 'Mobile Landscape', width: 667, height: 375 },
  { name: 'Tablet Portrait (iPad)', width: 768, height: 1024 },
  { name: 'Tablet Landscape', width: 1024, height: 768 },
  { name: 'Laptop / Desktop', width: 1280, height: 800 },
  { name: 'Large Screen (1080p)', width: 1920, height: 1080 }
];

const testUrls = [
  '/',
  '/blog/',
  '/posts/kali-linux-setup-guide/',
  '/posts/advanced-malware-evasion-bypassing-edrs-with-direct-syscalls-etw-patching-and-amsi-bypass-—-the-complete-guide/',
  '/about/',
  '/projects/',
  '/labs/',
  '/contact/'
];

async function runResponsiveAudit() {
  console.log('STARTING MULTI-VIEWPORT RESPONSIVE AUDIT...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;

  try {
    const page = await browser.newPage();

    for (const vp of viewports) {
      console.log(`\n========================================`);
      console.log(`Testing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
      console.log(`========================================`);

      await page.setViewport({ width: vp.width, height: vp.height });

      for (const urlPath of testUrls) {
        totalChecks++;
        const targetUrl = `http://localhost:3000${urlPath}`;
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });

        const result = await page.evaluate((vpWidth) => {
          const bodyWidth = document.body.scrollWidth;
          const htmlWidth = document.documentElement.scrollWidth;
          const windowWidth = window.innerWidth;
          const hasHorizontalOverflow = bodyWidth > windowWidth || htmlWidth > windowWidth;

          // Check if any element is overflowing horizontally
          let overflowingElement = null;
          if (hasHorizontalOverflow) {
            const all = document.querySelectorAll('*');
            for (let el of all) {
              const r = el.getBoundingClientRect();
              if (r.right > windowWidth + 2) {
                overflowingElement = `${el.tagName}.${el.className} (right: ${r.right})`;
                break;
              }
            }
          }

          return {
            hasHorizontalOverflow,
            bodyWidth,
            htmlWidth,
            windowWidth,
            overflowingElement
          };
        }, vp.width);

        if (!result.hasHorizontalOverflow) {
          console.log(`  [PASS] ${urlPath.padEnd(45)} no overflow (width: ${result.windowWidth}px)`);
          passedChecks++;
        } else {
          console.error(`  [FAIL] ${urlPath.padEnd(45)} OVERFLOW: body=${result.bodyWidth} window=${result.windowWidth} element=${result.overflowingElement}`);
          failedChecks++;
        }
      }

      // If mobile, test nav toggle
      if (vp.width <= 768) {
        await page.goto('http://localhost:3000/blog/', { waitUntil: 'domcontentloaded' });
        const navToggle = await page.$('.nav-toggle, #nav-toggle');
        if (navToggle) {
          await navToggle.click();
          await new Promise(r => setTimeout(r, 300));
          const isMenuOpen = await page.evaluate(() => {
            const mobNav = document.querySelector('#mobile-nav, .mobile-nav');
            return mobNav && (mobNav.classList.contains('active') || mobNav.classList.contains('open') || window.getComputedStyle(mobNav).display !== 'none');
          });
          console.log(`  [TEST] Mobile navigation toggle: ${isMenuOpen ? 'WORKING ✅' : 'NOT OPENED ⚠️'}`);
        }
      }
    }

    console.log(`\n========================================`);
    console.log(`RESPONSIVE AUDIT RESULTS`);
    console.log(`========================================`);
    console.log(`Total Checks: ${totalChecks}`);
    console.log(`Passed: ${passedChecks}`);
    console.log(`Failed: ${failedChecks}`);

    if (failedChecks === 0) {
      console.log(`\n100% RESPONSIVE: ZERO HORIZONTAL OVERFLOW ACROSS ALL DEVICES! 🎉`);
      process.exit(0);
    } else {
      console.error(`\nFAILED ${failedChecks} RESPONSIVE CHECKS!`);
      process.exit(1);
    }

  } catch (err) {
    console.error('Error during responsive audit:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runResponsiveAudit();
