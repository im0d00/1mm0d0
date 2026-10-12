import fs from 'fs';
import path from 'path';

const postsDir = path.resolve('src/posts');
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));

function decodeHtml(html) {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function detectLang(label, code) {
  const lbl = (label || '').toLowerCase();
  if (lbl.endsWith('.py') || lbl.includes('python') || code.includes('import ') || code.includes('def ') || code.includes('print(')) {
    return 'python';
  }
  if (lbl.endsWith('.sh') || lbl.includes('bash') || lbl.includes('nmap') || lbl.includes('scan') || lbl.includes('kali') || lbl.includes('command') || code.includes('sudo ') || code.includes('apt-get') || code.includes('#!/bin/bash')) {
    return 'bash';
  }
  if (lbl.endsWith('.json') || code.trim().startsWith('{')) {
    return 'json';
  }
  if (lbl.endsWith('.c') || lbl.endsWith('.cpp')) {
    return 'c';
  }
  if (lbl.includes('powershell') || lbl.endsWith('.ps1')) {
    return 'powershell';
  }
  return 'bash';
}

for (const file of files) {
  const filePath = path.join(postsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Match: <div class="code-block-wrap"> ... <span class="code-block-label">...</span> ... <pre><code>([\s\S]*?)</code></pre>\s*</div>
  const regex = /<div class="code-block-wrap">[\s\S]*?(?:<span class="code-block-label">([\s\S]*?)<\/span>)?[\s\S]*?<pre><code>([\s\S]*?)<\/code><\/pre>\s*<\/div>/gi;

  let replaced = 0;
  const newContent = content.replace(regex, (match, label, code) => {
    replaced++;
    const cleanLabel = (label || '').trim();
    const cleanCode = decodeHtml(code.trim());
    const lang = detectLang(cleanLabel, cleanCode);
    return `\`\`\`${lang}\n${cleanCode}\n\`\`\``;
  });

  if (replaced > 0) {
    console.log(`Replaced ${replaced} code blocks in ${file}`);
    fs.writeFileSync(filePath, newContent, 'utf-8');
  }
}
