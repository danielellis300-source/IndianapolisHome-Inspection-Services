/* ════════════════════════════════════════════════════════════
   Blog site generator — Indianapolis Home Inspection Services
   Run: node scripts/generate.js
   Produces: blog/<slug>.html, blog/index.html, sitemap.xml, robots.txt
   ════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');
const config = require('./site-config');
const articles = require('./blog-data');
const { renderArticlePage, renderBlogIndexPage } = require('./template');

const ROOT = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('wrote', path.relative(ROOT, filePath));
}

function generateArticles() {
  const articlesBySlug = new Map(articles.map(a => [a.slug, a]));
  articles.forEach(article => {
    const html = renderArticlePage(article, articlesBySlug);
    writeFile(path.join(BLOG_DIR, `${article.slug}.html`), html);
  });
  return articlesBySlug;
}

function generateBlogIndex() {
  const html = renderBlogIndexPage(articles);
  writeFile(path.join(BLOG_DIR, 'index.html'), html);
}

function generateSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [];

  // Homepage
  urls.push({ loc: `${config.domain}/`, lastmod: today, priority: '1.0' });

  // City landing pages
  config.cities
    .filter(c => c.file !== '/')
    .forEach(c => urls.push({ loc: `${config.domain}${c.file}`, lastmod: today, priority: '0.8' }));

  // Blog index
  urls.push({ loc: `${config.domain}/blog/`, lastmod: today, priority: '0.7' });

  // Blog articles
  articles.forEach(a => urls.push({ loc: `${config.domain}/blog/${a.slug}`, lastmod: a.date, priority: '0.6' }));

  const body = urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
  writeFile(path.join(ROOT, 'sitemap.xml'), xml);
}

function generateRobots() {
  const robotsPath = path.join(ROOT, 'robots.txt');
  const content = `User-agent: *
Allow: /

Sitemap: ${config.domain}/sitemap.xml
`;
  writeFile(robotsPath, content);
}

function main() {
  if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });
  generateArticles();
  generateBlogIndex();
  generateSitemap();
  generateRobots();
  console.log(`\nDone. Generated ${articles.length} articles + blog index + sitemap.xml + robots.txt.`);
}

main();
