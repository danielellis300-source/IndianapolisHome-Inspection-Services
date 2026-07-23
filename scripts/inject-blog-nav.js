/* ════════════════════════════════════════════════════════════
   Adds a "Blog" link to the header nav dropdown and the footer
   Services list on every existing top-level page (homepage +
   all city landing pages). Additive only — does not touch any
   other markup. Safe to re-run (skips files already patched).
   ════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGES = [
  'index.html', 'carmel.html', 'fishers.html', 'zionsville.html', 'westfield.html',
  'noblesville.html', 'avon.html', 'greenwood.html', 'brownsburg.html', 'plainfield.html',
  'lawrence.html', 'beech-grove.html', 'speedway.html', 'mooresville.html',
  'shelbyville.html', 'lebanon.html'
];

const NAV_RE = /(<a href="#quote">Get a Quote<\/a>)(\s*)(<\/div>)/;
const FOOTER_RE = /(<h4>Services<\/h4>\s*<ul class="footer-links">[\s\S]*?)(\s*)(<\/ul>)/;

let totalNav = 0, totalFooter = 0, totalSkipped = 0;

PAGES.forEach(file => {
  const filePath = path.join(ROOT, file);
  // Normalize CRLF -> LF before matching so line-ending differences
  // between files can't cause a silent no-op.
  let raw = fs.readFileSync(filePath, 'utf8');
  const hadCRLF = raw.includes('\r\n');
  let content = raw.replace(/\r\n/g, '\n');

  let navMatched = false, footerMatched = false;

  if (content.includes('<a href="/blog/">Blog</a>')) {
    console.log(`SKIP (already patched): ${file}`);
    totalSkipped++;
    return;
  }

  content = content.replace(NAV_RE, (m, a, ws, close) => {
    navMatched = true;
    return `${a}${ws}<a href="/blog/">Blog</a>${ws}${close}`;
  });

  content = content.replace(FOOTER_RE, (m, listOpenThroughLastItem, ws, closeUl) => {
    footerMatched = true;
    return `${listOpenThroughLastItem}${ws}<li><a href="/blog/">Blog</a></li>${ws}${closeUl}`;
  });

  if (!navMatched) console.log(`WARNING: nav pattern not matched in ${file}`);
  if (!footerMatched) console.log(`WARNING: footer pattern not matched in ${file}`);

  if (navMatched) totalNav++;
  if (footerMatched) totalFooter++;

  // Restore original line-ending convention.
  if (hadCRLF) content = content.replace(/\n/g, '\r\n');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`patched: ${file} (nav=${navMatched}, footer=${footerMatched})`);
});

console.log(`\nDone. nav patched: ${totalNav}/${PAGES.length}, footer patched: ${totalFooter}/${PAGES.length}, skipped: ${totalSkipped}`);
