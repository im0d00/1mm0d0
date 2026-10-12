import fs from 'fs';
import path from 'path';

const SITE_DIR = path.resolve('_site');
const PROD_DOMAIN = 'https://aimadulislam.dpdns.org';

function getAllFiles(dir, exts, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllFiles(fullPath, exts, fileList);
    } else {
      if (exts.includes(path.extname(file))) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

const htmlFiles = getAllFiles(SITE_DIR, ['.html']);

console.log(`Found ${htmlFiles.length} HTML files to audit in _site/`);

const report = {
  totalHtml: htmlFiles.length,
  missingTitle: [],
  duplicateTitles: {},
  longTitles: [],
  missingDesc: [],
  duplicateDescs: {},
  missingCanonical: [],
  multipleCanonicals: [],
  invalidCanonicalDomain: [],
  canonicalMismatch: [],
  missingH1: [],
  multipleH1: [],
  brokenInternalLinks: [],
  brokenImages: [],
  invalidJsonLd: [],
  missingOg: [],
  missingTwitter: []
};

const titlesMap = new Map();
const descsMap = new Map();

for (const filePath of htmlFiles) {
  const relPath = path.relative(SITE_DIR, filePath).replace(/\\/g, '/');
  // Ignore admin
  if (relPath.startsWith('admin/')) continue;

  const content = fs.readFileSync(filePath, 'utf-8');

  // Title
  const titleMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;
  if (!title) {
    report.missingTitle.push(relPath);
  } else {
    if (title.length > 70) report.longTitles.push({ file: relPath, title, len: title.length });
    if (!titlesMap.has(title)) titlesMap.set(title, []);
    titlesMap.get(title).push(relPath);
  }

  // Meta description
  const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i) ||
                    content.match(/<meta\s+content=["']([\s\S]*?)["']\s+name=["']description["']/i);
  const desc = descMatch ? descMatch[1].trim() : null;
  if (!desc) {
    report.missingDesc.push(relPath);
  } else {
    if (!descsMap.has(desc)) descsMap.set(desc, []);
    descsMap.get(desc).push(relPath);
  }

  // Canonical
  const canonicalMatches = [...content.matchAll(/<link\s+rel=["']canonical["']\s+href=["']([\s\S]*?)["']/gi)];
  if (canonicalMatches.length === 0) {
    report.missingCanonical.push(relPath);
  } else if (canonicalMatches.length > 1) {
    report.multipleCanonicals.push({ file: relPath, count: canonicalMatches.length });
  } else {
    const canonicalUrl = canonicalMatches[0][1].trim();
    if (!canonicalUrl.startsWith(PROD_DOMAIN)) {
      report.invalidCanonicalDomain.push({ file: relPath, url: canonicalUrl });
    }
  }

  // H1
  const h1Matches = [...content.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  if (h1Matches.length === 0) {
    report.missingH1.push(relPath);
  } else if (h1Matches.length > 1) {
    report.multipleH1.push({ file: relPath, count: h1Matches.length });
  }

  // OpenGraph
  const ogTitle = content.match(/<meta\s+property=["']og:title["']/i);
  const ogDesc = content.match(/<meta\s+property=["']og:description["']/i);
  const ogUrl = content.match(/<meta\s+property=["']og:url["']/i);
  const ogImage = content.match(/<meta\s+property=["']og:image["']/i);
  if (!ogTitle || !ogDesc || !ogUrl || !ogImage) {
    report.missingOg.push(relPath);
  }

  // Twitter
  const twCard = content.match(/<meta\s+name=["']twitter:card["']/i);
  const twTitle = content.match(/<meta\s+name=["']twitter:title["']/i);
  if (!twCard || !twTitle) {
    report.missingTwitter.push(relPath);
  }

  // JSON-LD
  const jsonLdBlocks = [...content.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)];
  for (const block of jsonLdBlocks) {
    try {
      JSON.parse(block[1]);
    } catch (e) {
      report.invalidJsonLd.push({ file: relPath, error: e.message });
    }
  }

  // Check local images: <img ... src="/images/..."
  const imgMatches = [...content.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)];
  for (const match of imgMatches) {
    const src = match[1];
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) continue;
    // local path
    let localPath = src.split('?')[0].split('#')[0];
    if (localPath.startsWith('/')) localPath = localPath.substring(1);
    const targetFile = path.join(SITE_DIR, localPath);
    if (!fs.existsSync(targetFile)) {
      report.brokenImages.push({ file: relPath, src });
    }
  }

  // Check internal links
  const aMatches = [...content.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)];
  for (const match of aMatches) {
    let href = match[1].trim();
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
    if (href.startsWith('http://') || href.startsWith('https://')) {
      if (!href.startsWith(PROD_DOMAIN)) continue;
      href = href.replace(PROD_DOMAIN, '');
    }
    let localHref = href.split('?')[0].split('#')[0];
    if (!localHref || localHref === '/') continue;
    if (localHref.startsWith('/')) localHref = localHref.substring(1);

    // Can be a directory (index.html) or a direct file
    const targetHtml = path.join(SITE_DIR, localHref, 'index.html');
    const targetDirect = path.join(SITE_DIR, localHref);
    if (!fs.existsSync(targetHtml) && !fs.existsSync(targetDirect)) {
      report.brokenInternalLinks.push({ file: relPath, href });
    }
  }
}

// Find duplicate titles across distinct pages
for (const [title, files] of titlesMap.entries()) {
  if (files.length > 1) {
    report.duplicateTitles[title] = files;
  }
}

// Find duplicate descriptions across distinct pages
for (const [desc, files] of descsMap.entries()) {
  if (files.length > 1) {
    report.duplicateDescs[desc] = files;
  }
}

console.log('=== AUDIT RESULTS SUMMARY ===');
console.log('Missing Titles:', report.missingTitle);
console.log('Duplicate Titles count:', Object.keys(report.duplicateTitles).length);
if (Object.keys(report.duplicateTitles).length > 0) {
  console.log('Duplicate Titles:', JSON.stringify(report.duplicateTitles, null, 2));
}
console.log('Missing Descriptions:', report.missingDesc);
console.log('Duplicate Descriptions count:', Object.keys(report.duplicateDescs).length);
if (Object.keys(report.duplicateDescs).length > 0) {
  console.log('Duplicate Descriptions:', JSON.stringify(report.duplicateDescs, null, 2));
}
console.log('Missing Canonicals:', report.missingCanonical);
console.log('Multiple Canonicals:', report.multipleCanonicals);
console.log('Invalid Canonical Domain:', report.invalidCanonicalDomain);
console.log('Missing H1:', report.missingH1);
console.log('Multiple H1:', report.multipleH1);
console.log('Broken Internal Links:', report.brokenInternalLinks);
console.log('Broken Local Images:', report.brokenImages);
console.log('Invalid JSON-LD:', report.invalidJsonLd);
console.log('Missing OG:', report.missingOg);
console.log('Missing Twitter:', report.missingTwitter);
