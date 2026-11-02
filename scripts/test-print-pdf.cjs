const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testArticlePrint(urlPath, label) {
  console.log(`\n========================================`);
  console.log(`Testing Print-to-PDF: ${label}`);
  console.log(`URL: ${urlPath}`);
  console.log(`========================================`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1200, height: 900 });

    const targetUrl = `http://localhost:3000${urlPath}`;
    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 15000 });

    // Emulate print media
    console.log(`Emulating media type: print...`);
    await page.emulateMediaType('print');

    // Run in-page evaluation of print CSS rules
    const audit = await page.evaluate(() => {
      const getStyle = (el, prop) => {
        if (!el) return null;
        return window.getComputedStyle(el).getPropertyValue(prop);
      };

      const results = {};

      // 1. Check body styles
      const body = document.body;
      results.bodyBg = getStyle(body, 'background-color');
      results.bodyColor = getStyle(body, 'color');

      // 2. Check print header visibility
      const printHeader = document.querySelector('.print-header');
      results.printHeaderDisplay = printHeader ? getStyle(printHeader, 'display') : 'not-found';
      results.printHeaderText = printHeader ? printHeader.innerText.slice(0, 100) : '';

      // 3. Check print footer visibility
      const printFooter = document.querySelector('.print-footer');
      results.printFooterDisplay = printFooter ? getStyle(printFooter, 'display') : 'not-found';

      // 4. Check hidden UI elements
      const navbar = document.querySelector('#navbar');
      results.navbarDisplay = navbar ? getStyle(navbar, 'display') : 'none';

      const footer = document.querySelector('#site-footer');
      results.footerDisplay = footer ? getStyle(footer, 'display') : 'none';

      const sidebar = document.querySelector('.sidebar');
      results.sidebarDisplay = sidebar ? getStyle(sidebar, 'display') : 'none';

      const quickTools = document.querySelector('.article-quick-tools');
      results.quickToolsDisplay = quickTools ? getStyle(quickTools, 'display') : 'none';

      const progress = document.querySelector('#reading-progress');
      results.progressDisplay = progress ? getStyle(progress, 'display') : 'none';

      const scrollTop = document.querySelector('#scroll-top');
      results.scrollTopDisplay = scrollTop ? getStyle(scrollTop, 'display') : 'none';

      // 5. Check text readability on headings and paragraphs
      const h1 = document.querySelector('.print-title') || document.querySelector('h1');
      results.h1Color = h1 ? getStyle(h1, 'color') : null;

      const firstP = document.querySelector('.article-markdown-body p') || document.querySelector('p');
      results.firstPColor = firstP ? getStyle(firstP, 'color') : null;

      const pre = document.querySelector('pre');
      results.preBg = pre ? getStyle(pre, 'background-color') : null;
      results.preColor = pre ? getStyle(pre, 'color') : null;
      results.preBreakInside = pre ? (getStyle(pre, 'break-inside') || getStyle(pre, 'page-break-inside')) : null;

      // 6. Check images
      const img = document.querySelector('.article-markdown-body img') || document.querySelector('img');
      results.imgBreakInside = img ? (getStyle(img, 'break-inside') || getStyle(img, 'page-break-inside')) : null;

      return results;
    });

    console.log(`Print Audit Results:`);
    console.log(`- Body Background: ${audit.bodyBg}`);
    console.log(`- Body Text Color: ${audit.bodyColor}`);
    console.log(`- Print Header Display: ${audit.printHeaderDisplay}`);
    console.log(`- Print Footer Display: ${audit.printFooterDisplay}`);
    console.log(`- Navbar Hidden: ${audit.navbarDisplay === 'none' ? 'YES (PASS)' : 'NO: ' + audit.navbarDisplay}`);
    console.log(`- Footer Hidden: ${audit.footerDisplay === 'none' ? 'YES (PASS)' : 'NO: ' + audit.footerDisplay}`);
    console.log(`- Sidebar Hidden: ${audit.sidebarDisplay === 'none' ? 'YES (PASS)' : 'NO: ' + audit.sidebarDisplay}`);
    console.log(`- Quick Tools Hidden: ${audit.quickToolsDisplay === 'none' ? 'YES (PASS)' : 'NO: ' + audit.quickToolsDisplay}`);
    console.log(`- Reading Progress Hidden: ${audit.progressDisplay === 'none' ? 'YES (PASS)' : 'NO: ' + audit.progressDisplay}`);
    console.log(`- Scroll-Top Hidden: ${audit.scrollTopDisplay === 'none' ? 'YES (PASS)' : 'NO: ' + audit.scrollTopDisplay}`);
    console.log(`- Title Color: ${audit.h1Color}`);
    console.log(`- Paragraph Color: ${audit.firstPColor}`);
    console.log(`- Code Block (pre) BG: ${audit.preBg}, Color: ${audit.preColor}`);
    console.log(`- Code Break-Inside: ${audit.preBreakInside}`);

    // Generate real PDF file
    const outputDir = path.join(__dirname, '../tmp');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    
    const safeLabel = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const pdfPath = path.join(outputDir, `${safeLabel}.pdf`);
    
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1.5cm',
        right: '1.5cm',
        bottom: '1.5cm',
        left: '1.5cm'
      }
    });

    const stats = fs.statSync(pdfPath);
    console.log(`Generated Real PDF: ${pdfPath}`);
    console.log(`File Size: ${(stats.size / 1024).toFixed(1)} KB`);

    // Verification asserts
    let passed = true;
    if (audit.navbarDisplay !== 'none') { console.error('FAIL: Navbar not hidden in print'); passed = false; }
    if (audit.footerDisplay !== 'none') { console.error('FAIL: Footer not hidden in print'); passed = false; }
    if (audit.sidebarDisplay !== 'none') { console.error('FAIL: Sidebar not hidden in print'); passed = false; }
    if (audit.printHeaderDisplay !== 'block') { console.error('FAIL: Print header not visible in print'); passed = false; }
    if (audit.printFooterDisplay !== 'block') { console.error('FAIL: Print footer not visible in print'); passed = false; }
    
    // Check contrast: body text must not be white or near-white
    const isDarkText = (colorStr) => {
      if (!colorStr) return false;
      const match = colorStr.match(/\d+/g);
      if (!match || match.length < 3) return false;
      const r = parseInt(match[0]), g = parseInt(match[1]), b = parseInt(match[2]);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
      return luminance < 100; // dark text (0 is black, 255 is white)
    };

    if (!isDarkText(audit.bodyColor)) {
      console.error(`FAIL: Body text color ${audit.bodyColor} is too light on white print paper!`);
      passed = false;
    } else {
      console.log(`PASS: Body text has high dark contrast on white paper.`);
    }

    if (!isDarkText(audit.firstPColor)) {
      console.error(`FAIL: Paragraph color ${audit.firstPColor} is too light!`);
      passed = false;
    } else {
      console.log(`PASS: Paragraph text has high dark contrast on white paper.`);
    }

    return { passed, pdfSize: stats.size, audit };

  } catch (err) {
    console.error(`Error during test:`, err);
    return { passed: false, error: err.message };
  } finally {
    await browser.close();
  }
}

async function runAllTests() {
  console.log('STARTING PRINT-TO-PDF HEADLESS VERIFICATION AUDIT...');
  
  // 1. Short article test
  const shortResult = await testArticlePrint(
    '/posts/kali-linux-setup-guide/',
    'Short Article (Kali Linux Setup)'
  );

  // 2. Long technical writeup test
  const longResult = await testArticlePrint(
    '/posts/advanced-malware-evasion-bypassing-edrs-with-direct-syscalls-etw-patching-and-amsi-bypass-—-the-complete-guide/',
    'Long Article (Advanced Malware Evasion & EDR Bypass)'
  );

  // 3. DFIR intro article test
  const dfirResult = await testArticlePrint(
    '/posts/dfir-introduction/',
    'Medium Article (DFIR Introduction)'
  );

  console.log(`\n========================================`);
  console.log(`FINAL PRINT-TO-PDF AUDIT SUMMARY`);
  console.log(`========================================`);
  console.log(`Short Article: ${shortResult.passed ? 'PASSED ✅' : 'FAILED ❌'} (PDF Size: ${(shortResult.pdfSize / 1024).toFixed(1)} KB)`);
  console.log(`Long Article:  ${longResult.passed ? 'PASSED ✅' : 'FAILED ❌'} (PDF Size: ${(longResult.pdfSize / 1024).toFixed(1)} KB)`);
  console.log(`DFIR Article:  ${dfirResult.passed ? 'PASSED ✅' : 'FAILED ❌'} (PDF Size: ${(dfirResult.pdfSize / 1024).toFixed(1)} KB)`);

  if (shortResult.passed && longResult.passed && dfirResult.passed) {
    console.log(`\nALL PRINT-TO-PDF CHECKS PASSED WITH FLYING COLORS! 🚀`);
    process.exit(0);
  } else {
    console.error(`\nSOME PRINT-TO-PDF CHECKS FAILED!`);
    process.exit(1);
  }
}

runAllTests();
