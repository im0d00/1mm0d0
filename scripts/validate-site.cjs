const fs = require('fs');
const path = require('path');

let errors = [];
let warnings = [];

console.log('--- RUNNING WEBSITE INTEGRITY & RECOVERY SAFEGUARD CHECKS ---');

// 1. Check Decap CMS configuration
console.log('1. Checking Decap CMS configuration...');
const cmsConfigPath = path.resolve('src/admin/config.yml');
if (!fs.existsSync(cmsConfigPath)) {
  errors.push('CRITICAL: src/admin/config.yml is missing!');
} else {
  const cmsContent = fs.readFileSync(cmsConfigPath, 'utf8');
  if (!cmsContent.includes('backend:')) errors.push('CMS config missing backend section');
  if (!cmsContent.includes('repo: im0d00/1mm0d0')) warnings.push('CMS config repo is not set to im0d00/1mm0d0');
  if (!cmsContent.includes('branch: main')) warnings.push('CMS config branch is not set to main');
}

// 2. Check essential static discovery and branding files
console.log('2. Checking essential discovery and branding files...');
const requiredRootFiles = [
  'CNAME',
  'src/CNAME',
  'src/robots.njk',
  'src/sitemap.njk',
  'src/feed.njk',
  'src/llms.njk',
  'src/brand-spec.njk',
  'src/humans.txt',
  'src/.well-known/security.txt',
  'src/posts/posts.json',
  'src/projects/projects.json',
  'src/labs/labs.json',
  'src/research/research.json',
  'src/downloads/downloads.json'
];

requiredRootFiles.forEach(f => {
  if (!fs.existsSync(path.resolve(f))) {
    errors.push(`Missing essential source file: ${f}`);
  }
});

// 3. Check blog post frontmatter and slug uniqueness
console.log('3. Checking blog posts and directory data fallbacks...');
const postsDir = path.resolve('src/posts');
if (fs.existsSync(postsDir)) {
  const postFiles = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
  const slugs = new Set();
  
  postFiles.forEach(file => {
    const slug = file.replace(/\.md$/, '');
    if (slugs.has(slug)) {
      errors.push(`Duplicate post slug detected: ${slug}`);
    }
    slugs.add(slug);

    const content = fs.readFileSync(path.join(postsDir, file), 'utf8');
    if (!content.startsWith('---')) {
      errors.push(`Post ${file} is missing YAML frontmatter!`);
    } else {
      if (!content.includes('title:')) errors.push(`Post ${file} missing required 'title' field`);
      if (!content.includes('date:')) errors.push(`Post ${file} missing required 'date' field`);
    }

    // Check referenced images
    const imageMatches = content.match(/\/images\/[a-zA-Z0-9_\-\.]+\.(png|jpg|jpeg|svg|webp)/g) || [];
    imageMatches.forEach(imgRef => {
      const imgPath = path.resolve('src', imgRef.replace(/^\//, ''));
      if (!fs.existsSync(imgPath)) {
        warnings.push(`Post ${file} references image that does not exist in src/images: ${imgRef}`);
      }
    });
  });
  console.log(`Validated ${postFiles.length} markdown posts.`);
}

// 4. Check generated build artifacts if _site exists
if (fs.existsSync(path.resolve('_site'))) {
  console.log('4. Checking generated production artifacts in _site...');
  const requiredSiteFiles = [
    '_site/index.html',
    '_site/about/index.html',
    '_site/blog/index.html',
    '_site/projects/index.html',
    '_site/labs/index.html',
    '_site/research/index.html',
    '_site/contact/index.html',
    '_site/resources/index.html',
    '_site/404.html',
    '_site/sitemap.xml',
    '_site/robots.txt',
    '_site/feed.xml',
    '_site/llms.txt',
    '_site/brand.md',
    '_site/CNAME',
    '_site/.nojekyll'
  ];

  requiredSiteFiles.forEach(f => {
    if (!fs.existsSync(path.resolve(f))) {
      errors.push(`Built artifact missing: ${f}`);
    }
  });

  // Verify sitemap validity
  const sitemapContent = fs.readFileSync(path.resolve('_site/sitemap.xml'), 'utf8');
  if (!sitemapContent.includes('<urlset') || !sitemapContent.includes('https://aimadulislam.dpdns.org/')) {
    errors.push('_site/sitemap.xml is invalid or missing domain declaration');
  }

  // Verify CNAME
  const cnameContent = fs.readFileSync(path.resolve('_site/CNAME'), 'utf8').trim();
  if (cnameContent !== 'aimadulislam.dpdns.org') {
    errors.push(`_site/CNAME contains incorrect domain: "${cnameContent}" (expected "aimadulislam.dpdns.org")`);
  }
}

console.log('--- SAFEGUARD AUDIT RESULTS ---');
if (warnings.length > 0) {
  console.log(`Warnings (${warnings.length}):\n` + warnings.map(w => '  - ' + w).join('\n'));
}
if (errors.length > 0) {
  console.error(`ERRORS (${errors.length}):\n` + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
} else {
  console.log('SUCCESS: All safeguard checks passed without errors!');
}
