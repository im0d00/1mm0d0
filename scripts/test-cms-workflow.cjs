const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const testDraftPath = path.resolve('src/posts/qa-test-draft.md');

console.log('--- DECAP CMS CONTROLLED DRAFT WORKFLOW TEST ---');

// Step 1: Create draft
console.log('1. Creating controlled draft with status: Draft and draft: true...');
const draftContent = [
  '---',
  'title: "QA Test Controlled Draft Post"',
  'date: 2026-11-02',
  'status: "Draft"',
  'draft: true',
  'categories: ["Cybersecurity"]',
  'tags: ["qa-test"]',
  'excerpt: "Temporary draft test for Decap CMS lifecycle validation."',
  '---',
  'Draft content for CMS workflow verification.'
].join('\n');

fs.writeFileSync(testDraftPath, draftContent);

// Step 2: Build and verify exclusion
console.log('2. Running Eleventy build with draft...');
execSync('npx eleventy --config=.eleventy.cjs', { stdio: 'pipe' });

const blogHtml = fs.readFileSync('_site/blog/index.html', 'utf8');
const draftInBlog = blogHtml.includes('QA Test Controlled Draft Post');
console.log('Result: Draft in public /blog/ feed:', draftInBlog ? 'FAILED (Draft was displayed)' : 'PASSED (Draft was suppressed from public listings)');

// Step 3: Update to Published
console.log('3. Updating content to status: Published and draft: false...');
const publishedContent = [
  '---',
  'title: "QA Test Controlled Draft Post"',
  'date: 2026-11-02',
  'status: "Published"',
  'draft: false',
  'categories: ["Cybersecurity"]',
  'tags: ["qa-test"]',
  'excerpt: "Temporary draft test for Decap CMS lifecycle validation."',
  '---',
  'Published content for CMS workflow verification.'
].join('\n');

fs.writeFileSync(testDraftPath, publishedContent);

execSync('npx eleventy --config=.eleventy.cjs', { stdio: 'pipe' });
const blogHtmlPublished = fs.readFileSync('_site/blog/index.html', 'utf8');
const publishedInBlog = blogHtmlPublished.includes('QA Test Controlled Draft Post');
console.log('Result: Published post in public /blog/ feed:', publishedInBlog ? 'PASSED (Post appeared immediately)' : 'FAILED (Post not found)');

// Step 4: Cleanup
console.log('4. Cleaning up temporary draft file and rebuilding site...');
if (fs.existsSync(testDraftPath)) {
  fs.unlinkSync(testDraftPath);
}
// Also remove generated post from _site if any
const siteDraftDir = path.resolve('_site/posts/qa-test-controlled-draft-post');
if (fs.existsSync(siteDraftDir)) {
  fs.rmSync(siteDraftDir, { recursive: true, force: true });
}
execSync('npx eleventy --config=.eleventy.cjs', { stdio: 'pipe' });

const blogHtmlFinal = fs.readFileSync('_site/blog/index.html', 'utf8');
const cleanedUp = !blogHtmlFinal.includes('QA Test Controlled Draft Post');
console.log('Result: Cleanup verified:', cleanedUp ? 'PASSED (Clean state restored)' : 'FAILED');

console.log('--- CMS LIFECYCLE AUDIT COMPLETE ---');
